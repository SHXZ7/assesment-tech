from datetime import date, datetime, timezone
from typing import Literal, Optional, TypedDict


LeaveStatus = Literal["Pending", "Approved", "Rejected"]


class Leave(TypedDict):
    employeeId: str
    leaveType: str
    startDate: date
    endDate: date
    reason: str
    status: LeaveStatus
    managerComment: Optional[str]
    createdAt: datetime
    updatedAt: datetime


def create_leave_model(
    employee_id: str,
    leave_type: str,
    start_date: date,
    end_date: date,
    reason: str,
) -> Leave:
    now = datetime.now(timezone.utc)

    return {
        "employeeId": employee_id,
        "leaveType": leave_type,
        "startDate": start_date,
        "endDate": end_date,
        "reason": reason,
        "status": "Pending",
        "managerComment": None,
        "createdAt": now,
        "updatedAt": now,
    }
