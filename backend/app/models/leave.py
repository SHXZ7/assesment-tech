from datetime import date, datetime, timezone
from typing import Literal, Optional, TypedDict


LeaveStatus = Literal["Pending", "Approved", "Rejected"]


class Leave(TypedDict):
    employeeId: str
    leaveType: str
    startDate: str
    endDate: str
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
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "reason": reason,
        "status": "Pending",
        "managerComment": None,
        "createdAt": now,
        "updatedAt": now,
    }
