"""
test_prediction.py
------------------
Unit tests for the Smart Queue Prediction Engine.

Run with:
    python -m pytest test_prediction.py -v
or simply:
    python -m unittest test_prediction
"""

import sys
import os
import math
import unittest
from datetime import datetime

# Make sure the package is importable when running from the project root
sys.path.insert(0, os.path.dirname(__file__))

from prediction import predict_queue
from prediction.schemas import PredictionOutput


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

FIXED_NOW = datetime(2026, 8, 23, 15, 54)  # 15:54 — fixed reference time


def run(current_token, patient_token, average_consultation_time,
        doctor_delay, consultation_count):
    """Shortcut that always uses the fixed reference time."""
    return predict_queue(
        current_token=current_token,
        patient_token=patient_token,
        average_consultation_time=average_consultation_time,
        doctor_delay=doctor_delay,
        consultation_count=consultation_count,
        now=FIXED_NOW,
    )


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

class TestNormalQueue(unittest.TestCase):
    """TC-01: Normal waiting scenario."""

    def setUp(self):
        # current=19, patient=27, avg=8, delay=5, count=20
        # patients_ahead = 27 - 19 - 1 = 7
        # wait = 7 * 8 + 5 = 61 min
        # appointment = 15:54 + 61 min = 16:55
        self.result = run(
            current_token=19,
            patient_token=27,
            average_consultation_time=8,
            doctor_delay=5,
            consultation_count=20,
        )

    def test_returns_prediction_output(self):
        self.assertIsInstance(self.result, PredictionOutput)

    def test_patients_ahead(self):
        self.assertEqual(self.result.patients_ahead, 7)

    def test_estimated_wait_minutes(self):
        self.assertEqual(self.result.estimated_wait_minutes, 61.0)

    def test_estimated_appointment_time(self):
        self.assertEqual(self.result.estimated_appointment_time, "16:55")

    def test_confidence_medium(self):
        # consultation_count=20 → medium
        self.assertEqual(self.result.confidence, "medium")

    def test_status_waiting(self):
        self.assertEqual(self.result.status, "waiting")

    def test_to_dict_keys(self):
        d = self.result.to_dict()
        self.assertSetEqual(
            set(d.keys()),
            {"patients_ahead", "estimated_wait_minutes",
             "estimated_appointment_time", "confidence", "status"},
        )


class TestCurrentlyServing(unittest.TestCase):
    """TC-02: Patient is the one currently being served."""

    def setUp(self):
        self.result = run(
            current_token=27,
            patient_token=27,
            average_consultation_time=8,
            doctor_delay=0,
            consultation_count=27,
        )

    def test_status(self):
        self.assertEqual(self.result.status, "currently_serving")

    def test_patients_ahead_zero(self):
        self.assertEqual(self.result.patients_ahead, 0)

    def test_wait_zero(self):
        self.assertEqual(self.result.estimated_wait_minutes, 0.0)

    def test_appointment_time_is_now(self):
        self.assertEqual(self.result.estimated_appointment_time, "15:54")


class TestTokenPassed(unittest.TestCase):
    """TC-03: Patient's token was already called."""

    def setUp(self):
        self.result = run(
            current_token=30,
            patient_token=27,
            average_consultation_time=8,
            doctor_delay=0,
            consultation_count=30,
        )

    def test_status(self):
        self.assertEqual(self.result.status, "token_passed")

    def test_patients_ahead_zero(self):
        self.assertEqual(self.result.patients_ahead, 0)

    def test_wait_zero(self):
        self.assertEqual(self.result.estimated_wait_minutes, 0.0)


class TestZeroDoctorDelay(unittest.TestCase):
    """TC-04: No accumulated delay."""

    def setUp(self):
        # current=10, patient=15, avg=10, delay=0, count=10
        # patients_ahead = 15 - 10 - 1 = 4
        # wait = 4 * 10 + 0 = 40 min
        self.result = run(
            current_token=10,
            patient_token=15,
            average_consultation_time=10,
            doctor_delay=0,
            consultation_count=10,
        )

    def test_wait_minutes(self):
        self.assertEqual(self.result.estimated_wait_minutes, 40.0)

    def test_status(self):
        self.assertEqual(self.result.status, "waiting")

    def test_no_negative_wait(self):
        self.assertGreaterEqual(self.result.estimated_wait_minutes, 0.0)


class TestConfidenceLevels(unittest.TestCase):
    """TC-05: Confidence thresholds (low / medium / high)."""

    def _confidence(self, consultation_count):
        return run(
            current_token=1,
            patient_token=5,
            average_consultation_time=5,
            doctor_delay=0,
            consultation_count=consultation_count,
        ).confidence

    def test_confidence_low_zero(self):
        self.assertEqual(self._confidence(0), "low")

    def test_confidence_low_boundary(self):
        self.assertEqual(self._confidence(14), "low")

    def test_confidence_medium_boundary_low(self):
        self.assertEqual(self._confidence(15), "medium")

    def test_confidence_medium_boundary_high(self):
        self.assertEqual(self._confidence(49), "medium")

    def test_confidence_high_boundary(self):
        self.assertEqual(self._confidence(50), "high")

    def test_confidence_high_large(self):
        self.assertEqual(self._confidence(200), "high")


class TestImmediateNextPatient(unittest.TestCase):
    """TC-06: Patient is next in line (patients_ahead = 0, only delay applies)."""

    def setUp(self):
        # current=10, patient=11 -> patients_ahead=0, wait = 0*8 + 10 = 10
        self.result = run(
            current_token=10,
            patient_token=11,
            average_consultation_time=8,
            doctor_delay=10,
            consultation_count=20,
        )

    def test_patients_ahead(self):
        self.assertEqual(self.result.patients_ahead, 0)

    def test_wait_equals_delay_only(self):
        self.assertEqual(self.result.estimated_wait_minutes, 10.0)

    def test_status_waiting(self):
        self.assertEqual(self.result.status, "waiting")


class TestNegativeInputs(unittest.TestCase):
    """TC-07: Negative inputs must raise ValueError."""

    def test_negative_current_token(self):
        with self.assertRaises(ValueError):
            run(current_token=-1, patient_token=5,
                average_consultation_time=8, doctor_delay=0,
                consultation_count=10)

    def test_negative_patient_token(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=-1,
                average_consultation_time=8, doctor_delay=0,
                consultation_count=10)

    def test_zero_avg_consultation_time(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=10,
                average_consultation_time=0, doctor_delay=0,
                consultation_count=10)

    def test_negative_avg_consultation_time(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=10,
                average_consultation_time=-5, doctor_delay=0,
                consultation_count=10)

    def test_negative_doctor_delay(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=10,
                average_consultation_time=8, doctor_delay=-1,
                consultation_count=10)

    def test_negative_consultation_count(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=10,
                average_consultation_time=8, doctor_delay=0,
                consultation_count=-1)


class TestInvalidTypes(unittest.TestCase):
    """TC-08: Non-numeric inputs must raise ValueError."""

    def test_string_current_token(self):
        with self.assertRaises((ValueError, TypeError)):
            run(current_token="abc", patient_token=10,
                average_consultation_time=8, doctor_delay=0,
                consultation_count=10)

    def test_none_patient_token(self):
        with self.assertRaises((ValueError, TypeError)):
            run(current_token=5, patient_token=None,
                average_consultation_time=8, doctor_delay=0,
                consultation_count=10)

    def test_nan_avg_consultation_time(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=10,
                average_consultation_time=float("nan"), doctor_delay=0,
                consultation_count=10)

    def test_inf_doctor_delay(self):
        with self.assertRaises(ValueError):
            run(current_token=5, patient_token=10,
                average_consultation_time=8,
                doctor_delay=float("inf"),
                consultation_count=10)


class TestOutputNeverNegative(unittest.TestCase):
    """TC-09: Output sanity — wait_minutes is always >= 0."""

    def test_large_delay_with_zero_ahead(self):
        result = run(
            current_token=10,
            patient_token=11,
            average_consultation_time=5,
            doctor_delay=0,
            consultation_count=10,
        )
        self.assertGreaterEqual(result.estimated_wait_minutes, 0.0)

    def test_not_nan(self):
        result = run(
            current_token=5, patient_token=10,
            average_consultation_time=7, doctor_delay=3,
            consultation_count=50,
        )
        self.assertFalse(math.isnan(result.estimated_wait_minutes))

    def test_not_inf(self):
        result = run(
            current_token=5, patient_token=10,
            average_consultation_time=7, doctor_delay=3,
            consultation_count=50,
        )
        self.assertFalse(math.isinf(result.estimated_wait_minutes))

    def test_appointment_time_valid_format(self):
        result = run(
            current_token=5, patient_token=10,
            average_consultation_time=7, doctor_delay=3,
            consultation_count=50,
        )
        # Must match HH:MM
        parts = result.estimated_appointment_time.split(":")
        self.assertEqual(len(parts), 2)
        self.assertTrue(parts[0].isdigit())
        self.assertTrue(parts[1].isdigit())


if __name__ == "__main__":
    unittest.main(verbosity=2)
