/**
 * Central Mock Data for Smriti Smart Digital Waiting Queue
 * Matches backend schemas and reference design exactly.
 */

export const MOCK_USER = {
  id: "pat-987654",
  name: "Ramesh Kumar",
  phone: "+91 9876543210",
  maskedPhone: "+91 98******10",
  email: "ramesh.kumar@gmail.com",
  gender: "Male",
  age: 42,
  bloodGroup: "O+",
  emergencyContact: "+91 9811002233",
  stats: {
    records: 12,
    prescriptions: 5,
    reports: 15,
    upcoming: 2
  }
};

export const MOCK_HOSPITAL = {
  id: "hosp-001",
  name: "City Care Hospital",
  location: "Sector 14, Ring Road, New Delhi",
  coordinates: {
    lat: 28.5355,
    lng: 77.3910,
    address: "City Care Hospital, Sector 14, New Delhi"
  },
  departments: [
    { id: "dept-cardio", name: "Cardiology" },
    { id: "dept-neuro", name: "Neurology" },
    { id: "dept-ortho", name: "Orthopedics" },
    { id: "dept-pedia", name: "Pediatrics" },
    { id: "dept-gen", name: "General Medicine" }
  ]
};

export const MOCK_DOCTORS = [
  {
    id: "doc-divyansh",
    name: "Dr. Divyansh Sharma",
    specialization: "Cardiologist",
    departmentId: "dept-cardio",
    hospitalId: "hosp-001",
    hospitalName: "City Care Hospital, Delhi",
    experience: "14+ Years",
    rating: 4.9,
    reviewsCount: 320,
    averageConsultationMinutes: 8,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    roomNo: "OPD Room 204, 2nd Floor",
    consultationFee: "₹800",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    slots: [
      "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "04:00 PM"
    ]
  },
  {
    id: "doc-priya",
    name: "Dr. Priya Nair",
    specialization: "Neurologist",
    departmentId: "dept-neuro",
    hospitalId: "hosp-001",
    hospitalName: "City Care Hospital, Delhi",
    experience: "11 Years",
    rating: 4.8,
    reviewsCount: 245,
    averageConsultationMinutes: 10,
    avatar: "https://images.unsplash.com/photo-1594824813586-2a78187ff607?w=150&auto=format&fit=crop&q=80",
    roomNo: "OPD Room 301, 3rd Floor",
    consultationFee: "₹1000",
    availableDays: ["Mon", "Wed", "Fri"],
    slots: [
      "10:00 AM", "10:30 AM", "11:30 AM", "01:00 PM", "02:30 PM"
    ]
  },
  {
    id: "doc-rajesh",
    name: "Dr. Rajesh Verma",
    specialization: "Orthopedic Surgeon",
    departmentId: "dept-ortho",
    hospitalId: "hosp-001",
    hospitalName: "City Care Hospital, Delhi",
    experience: "18 Years",
    rating: 4.9,
    reviewsCount: 512,
    averageConsultationMinutes: 7,
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
    roomNo: "OPD Room 108, 1st Floor",
    consultationFee: "₹900",
    availableDays: ["Tue", "Thu", "Sat"],
    slots: [
      "09:00 AM", "09:30 AM", "10:00 AM", "11:00 AM", "12:30 PM"
    ]
  }
];

export const INITIAL_ACTIVE_APPOINTMENT = {
  id: "apt-103",
  tokenNumber: "TKN-103",
  numericToken: 103,
  doctor: MOCK_DOCTORS[0],
  hospital: MOCK_HOSPITAL,
  date: "16 May 2025",
  rawDate: "2025-05-16",
  time: "10:30 AM",
  status: "waiting", // waiting | in_consultation | completed | cancelled
  priority: "normal",
  createdAt: "2025-05-15T09:00:00Z",
  patientLocation: {
    lat: 28.6139,
    lng: 77.2090,
    address: "Connaught Place, New Delhi"
  }
};

export const INITIAL_QUEUE_DATA = [
  {
    id: "q-101",
    tokenNumber: "TKN-101",
    numericToken: 101,
    patientName: "Ramesh Sharma",
    status: "completed", // completed | in_progress | waiting | upcoming
    time: "10:00 AM",
    isUser: false,
    durationMinutes: 8
  },
  {
    id: "q-102",
    tokenNumber: "TKN-102",
    numericToken: 102,
    patientName: "Sita Verma",
    status: "in_progress",
    time: "10:15 AM",
    isUser: false,
    durationMinutes: 7
  },
  {
    id: "q-103",
    tokenNumber: "TKN-103",
    numericToken: 103,
    patientName: "Ramesh Kumar",
    status: "waiting",
    time: "10:30 AM",
    isUser: true,
    durationMinutes: 8
  },
  {
    id: "q-104",
    tokenNumber: "TKN-104",
    numericToken: 104,
    patientName: "Amit Singh",
    status: "waiting",
    time: "10:45 AM",
    isUser: false,
    durationMinutes: 8
  },
  {
    id: "q-105",
    tokenNumber: "TKN-105",
    numericToken: 105,
    patientName: "Pooja Shah",
    status: "upcoming",
    time: "11:00 AM",
    isUser: false,
    durationMinutes: 8
  },
  {
    id: "q-106",
    tokenNumber: "TKN-106",
    numericToken: 106,
    patientName: "Mohan Das",
    status: "upcoming",
    time: "11:15 AM",
    isUser: false,
    durationMinutes: 8
  }
];

export const MOCK_TRAVEL_INFO = {
  patientLocation: {
    lat: 28.6139,
    lng: 77.2090,
    address: "Connaught Place, Central Delhi"
  },
  clinicLocation: {
    lat: 28.5355,
    lng: 77.3910,
    address: "City Care Hospital, Sector 14, New Delhi"
  },
  distanceKm: 4.8,
  travelMinutes: 18,
  trafficLevel: "Medium", // Low | Medium | High | Severe
  speedMultiplier: 1.25,
  safetyBufferMinutes: 10,
  routeSteps: [
    { instruction: "Head south toward Outer Ring Road", distanceKm: 1.2, durationMinutes: 4 },
    { instruction: "Take flyover onto Hospital Link Road", distanceKm: 2.6, durationMinutes: 10 },
    { instruction: "Turn right into City Care Hospital Gate 2", distanceKm: 1.0, durationMinutes: 4 }
  ]
};

export const MOCK_PAST_APPOINTMENTS = [
  {
    id: "apt-098",
    tokenNumber: "TKN-098",
    doctorName: "Dr. Divyansh Sharma",
    specialization: "Cardiologist",
    date: "12 Apr 2025",
    time: "11:00 AM",
    status: "completed",
    diagnosis: "Routine ECG & Blood Pressure Check",
    prescriptionCount: 2
  },
  {
    id: "apt-082",
    tokenNumber: "TKN-082",
    doctorName: "Dr. Priya Nair",
    specialization: "Neurologist",
    date: "04 Jan 2025",
    time: "02:30 PM",
    status: "completed",
    diagnosis: "Migraine management consultation",
    prescriptionCount: 1
  }
];
