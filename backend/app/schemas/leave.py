from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


LeaveStatus = Literal["Pending", "Approved", "Rejected"]
LeaveType = Literal["Sick", "Casual", "Annual", "Work From Home", "Other"]


class CreateLeaveRequest(BaseModel):
    leaveType: LeaveType
    startDate: date
    endDate: date
    reason: str = Field(..., min_length=1)

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Reason is required")

        return value


class UpdateLeaveRequest(BaseModel):
    leaveType: LeaveType
    startDate: date
    endDate: date
    reason: str = Field(..., min_length=1)

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Reason is required")

        return value


class UpdateLeaveStatusRequest(BaseModel):
    status: Literal["Approved", "Rejected"]
    managerComment: Optional[str] = None


class RejectLeaveRequest(BaseModel):
    comment: str = Field(..., min_length=1)

    @field_validator("comment")
    @classmethod
    def comment_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Comment is required")

        return value


class LeaveResponse(BaseModel):
    id: str
    employeeId: str
    leaveType: LeaveType
    startDate: date
    endDate: date
    reason: str
    status: LeaveStatus
    managerComment: Optional[str]
    createdAt: datetime
    updatedAt: datetime


class LeaveDashboardResponse(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int
    recent: list[LeaveResponse]


class ManagerDashboardResponse(BaseModel):
    totalEmployees: int
    pending: int
    approved: int
    rejected: int
    recent: list[dict]
