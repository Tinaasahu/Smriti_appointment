-- ====================================================================
-- SMRITI SMART QUEUE & APPOINTMENT SYSTEM - DATABASE SCHEMA
-- Project URL: https://brgakhcuajnkwrmrioyx.supabase.co
-- ====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. TABLES CREATION
-- --------------------------------------------------------------------

-- Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    hospital_name TEXT,
    average_consultation_minutes NUMERIC DEFAULT 8.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'checked_in', 'called', 'in_consultation', 'completed', 'cancelled', 'no_show'
    priority TEXT DEFAULT 'normal', -- 'normal', 'emergency', 'vip'
    booking_source TEXT DEFAULT 'online',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Queue Entries Table
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL,
    token_number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'checked_in', 'called', 'in_consultation', 'completed', 'cancelled', 'no_show'
    joined_at TIMESTAMPTZ DEFAULT now(),
    called_at TIMESTAMPTZ,
    consultation_started_at TIMESTAMPTZ,
    consultation_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- 2. INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_queue_doctor_date ON public.queue_entries(doctor_id, queue_date);
CREATE INDEX IF NOT EXISTS idx_queue_token ON public.queue_entries(token_number);
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);

-- --------------------------------------------------------------------
-- 3. STORED PROCEDURES (RPC FUNCTIONS FOR FASTAPI BACKEND)
-- --------------------------------------------------------------------

-- Function: create_appointment_with_token
CREATE OR REPLACE FUNCTION public.create_appointment_with_token(
    p_hospital_id UUID,
    p_department_id UUID,
    p_doctor_id UUID,
    p_patient_id UUID,
    p_appointment_date DATE,
    p_scheduled_start_time TIME DEFAULT NULL,
    p_scheduled_end_time TIME DEFAULT NULL,
    p_booking_source TEXT DEFAULT 'online',
    p_priority TEXT DEFAULT 'normal'
)
RETURNS TABLE (
    id UUID,
    token_number INT,
    numeric_token INT,
    formatted_token TEXT,
    hospital_id UUID,
    department_id UUID,
    doctor_id UUID,
    patient_id UUID,
    appointment_date DATE,
    status TEXT,
    message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_appointment_id UUID;
    v_next_token INT;
BEGIN
    -- Insert into appointments
    INSERT INTO public.appointments (
        hospital_id, department_id, doctor_id, patient_id,
        appointment_date, scheduled_start_time, scheduled_end_time,
        booking_source, priority, status
    ) VALUES (
        p_hospital_id, p_department_id, p_doctor_id, p_patient_id,
        p_appointment_date, p_scheduled_start_time, p_scheduled_end_time,
        p_booking_source, p_priority, 'waiting'
    )
    RETURNING public.appointments.id INTO v_appointment_id;

    -- Calculate next token number for doctor on date (starts at 101 if first)
    SELECT COALESCE(MAX(q.token_number), 100) + 1
    INTO v_next_token
    FROM public.queue_entries q
    WHERE q.doctor_id = p_doctor_id AND q.queue_date = p_appointment_date;

    -- Insert into queue_entries
    INSERT INTO public.queue_entries (
        appointment_id, doctor_id, queue_date, token_number, status, joined_at
    ) VALUES (
        v_appointment_id, p_doctor_id, p_appointment_date, v_next_token, 'waiting', now()
    );

    RETURN QUERY
    SELECT 
        v_appointment_id AS id,
        v_next_token AS token_number,
        v_next_token AS numeric_token,
        ('TKN-' || v_next_token::TEXT) AS formatted_token,
        p_hospital_id AS hospital_id,
        p_department_id AS department_id,
        p_doctor_id AS doctor_id,
        p_patient_id AS patient_id,
        p_appointment_date AS appointment_date,
        'waiting'::TEXT AS status,
        'Appointment created successfully'::TEXT AS message;
END;
$$;


-- Function: check_in_appointment
CREATE OR REPLACE FUNCTION public.check_in_appointment(
    p_appointment_id UUID
)
RETURNS TABLE (
    id UUID,
    appointment_id UUID,
    status TEXT,
    token_number INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.appointments
    SET status = 'checked_in', updated_at = now()
    WHERE public.appointments.id = p_appointment_id;

    UPDATE public.queue_entries
    SET status = 'checked_in', updated_at = now()
    WHERE public.queue_entries.appointment_id = p_appointment_id;

    RETURN QUERY
    SELECT q.id, q.appointment_id, q.status, q.token_number
    FROM public.queue_entries q
    WHERE q.appointment_id = p_appointment_id;
END;
$$;


-- Function: call_next_patient
CREATE OR REPLACE FUNCTION public.call_next_patient(
    p_doctor_id UUID,
    p_queue_date DATE
)
RETURNS TABLE (
    id UUID,
    appointment_id UUID,
    token_number INT,
    status TEXT,
    called_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    SELECT q.id INTO v_queue_id
    FROM public.queue_entries q
    WHERE q.doctor_id = p_doctor_id 
      AND q.queue_date = p_queue_date 
      AND q.status IN ('waiting', 'checked_in')
    ORDER BY q.token_number ASC
    LIMIT 1;

    IF v_queue_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.queue_entries
    SET status = 'called', called_at = now(), updated_at = now()
    WHERE public.queue_entries.id = v_queue_id;

    UPDATE public.appointments
    SET status = 'called', updated_at = now()
    WHERE public.appointments.id = (SELECT appointment_id FROM public.queue_entries WHERE id = v_queue_id);

    RETURN QUERY
    SELECT q.id, q.appointment_id, q.token_number, q.status, q.called_at
    FROM public.queue_entries q
    WHERE q.id = v_queue_id;
END;
$$;


-- Function: start_consultation
CREATE OR REPLACE FUNCTION public.start_consultation(
    p_appointment_id UUID
)
RETURNS TABLE (
    id UUID,
    appointment_id UUID,
    status TEXT,
    consultation_started_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.queue_entries
    SET status = 'in_consultation', consultation_started_at = now(), updated_at = now()
    WHERE public.queue_entries.appointment_id = p_appointment_id;

    UPDATE public.appointments
    SET status = 'in_consultation', updated_at = now()
    WHERE public.appointments.id = p_appointment_id;

    RETURN QUERY
    SELECT q.id, q.appointment_id, q.status, q.consultation_started_at
    FROM public.queue_entries q
    WHERE q.appointment_id = p_appointment_id;
END;
$$;


-- Function: complete_consultation
CREATE OR REPLACE FUNCTION public.complete_consultation(
    p_appointment_id UUID
)
RETURNS TABLE (
    id UUID,
    appointment_id UUID,
    status TEXT,
    consultation_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.queue_entries
    SET status = 'completed', consultation_completed_at = now(), updated_at = now()
    WHERE public.queue_entries.appointment_id = p_appointment_id;

    UPDATE public.appointments
    SET status = 'completed', updated_at = now()
    WHERE public.appointments.id = p_appointment_id;

    RETURN QUERY
    SELECT q.id, q.appointment_id, q.status, q.consultation_completed_at
    FROM public.queue_entries q
    WHERE q.appointment_id = p_appointment_id;
END;
$$;


-- Function: cancel_appointment
CREATE OR REPLACE FUNCTION public.cancel_appointment(
    p_appointment_id UUID
)
RETURNS TABLE (
    id UUID,
    appointment_id UUID,
    status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.queue_entries
    SET status = 'cancelled', updated_at = now()
    WHERE public.queue_entries.appointment_id = p_appointment_id;

    UPDATE public.appointments
    SET status = 'cancelled', updated_at = now()
    WHERE public.appointments.id = p_appointment_id;

    RETURN QUERY
    SELECT q.id, q.appointment_id, q.status
    FROM public.queue_entries q
    WHERE q.appointment_id = p_appointment_id;
END;
$$;


-- Function: mark_appointment_no_show
CREATE OR REPLACE FUNCTION public.mark_appointment_no_show(
    p_appointment_id UUID
)
RETURNS TABLE (
    id UUID,
    appointment_id UUID,
    status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.queue_entries
    SET status = 'no_show', updated_at = now()
    WHERE public.queue_entries.appointment_id = p_appointment_id;

    UPDATE public.appointments
    SET status = 'no_show', updated_at = now()
    WHERE public.appointments.id = p_appointment_id;

    RETURN QUERY
    SELECT q.id, q.appointment_id, q.status
    FROM public.queue_entries q
    WHERE q.appointment_id = p_appointment_id;
END;
$$;

-- --------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select and insert on hospitals" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select and insert on departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select and insert on doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select and insert on patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select and insert on appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select and insert on queue_entries" ON public.queue_entries FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. SAMPLE SEED DATA
-- --------------------------------------------------------------------
DO $$
DECLARE
    v_hosp_id UUID := '11111111-1111-1111-1111-111111111111';
    v_dept_id UUID := '22222222-2222-2222-2222-222222222222';
    v_doc_id  UUID := '33333333-3333-3333-3333-333333333333';
    v_pat_id  UUID := '44444444-4444-4444-4444-444444444444';
    v_apt_id  UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    INSERT INTO public.hospitals (id, name, address, city)
    VALUES (v_hosp_id, 'City Care Hospital', '123 Health Ave, Connaught Place', 'Delhi')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.departments (id, hospital_id, name)
    VALUES (v_dept_id, v_hosp_id, 'Cardiology')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.doctors (id, hospital_id, department_id, name, specialization, hospital_name, average_consultation_minutes)
    VALUES (v_doc_id, v_hosp_id, v_dept_id, 'Dr. Divyansh Pandey', 'Cardiologist', 'City Care Hospital, Delhi', 8.0)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.patients (id, name, phone, email)
    VALUES (v_pat_id, 'Smriti Agarwal', '+919876543210', 'smriti@example.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.appointments (id, hospital_id, department_id, doctor_id, patient_id, appointment_date, status)
    VALUES (v_apt_id, v_hosp_id, v_dept_id, v_doc_id, v_pat_id, CURRENT_DATE, 'waiting')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.queue_entries (appointment_id, doctor_id, queue_date, token_number, status)
    VALUES (v_apt_id, v_doc_id, CURRENT_DATE, 103, 'waiting')
    ON CONFLICT (appointment_id) DO NOTHING;
END $$;
