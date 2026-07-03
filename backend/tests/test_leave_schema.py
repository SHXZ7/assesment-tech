import pytest
from pydantic import ValidationError

from app.schemas.leave import CreateLeaveRequest


def test_create_leave_accepts_valid_payload():
    leave = CreateLeaveRequest(
        leaveType="Annual",
        startDate="2026-07-10",
        endDate="2026-07-12",
        reason="Family Function",
    )

    assert leave.leaveType == "Annual"


def test_create_leave_rejects_invalid_type():
    with pytest.raises(ValidationError):
        CreateLeaveRequest(
            leaveType="Holiday",
            startDate="2026-07-10",
            endDate="2026-07-12",
            reason="Family Function",
        )


def test_create_leave_rejects_blank_reason():
    with pytest.raises(ValidationError):
        CreateLeaveRequest(
            leaveType="Sick",
            startDate="2026-07-10",
            endDate="2026-07-12",
            reason="   ",
        )
