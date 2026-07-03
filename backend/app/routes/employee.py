from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.auth.dependencies import get_current_user, require_employee
from app.schemas.leave import (
    CreateLeaveRequest,
    LeaveDashboardResponse,
    LeaveStatus,
    LeaveType,
    UpdateLeaveRequest,
)
from app.services.leave_service import (
    create_employee_leave,
    delete_employee_leave,
    get_employee_dashboard,
    get_employee_leaves,
    get_leave_by_id,
    update_employee_leave,
)
from app.services.manager_service import get_leave_for_manager


router = APIRouter(tags=["Employee Leaves"])


@router.get("/leaves/dashboard", response_model=LeaveDashboardResponse)
async def get_dashboard(current_user: dict = Depends(require_employee)):
    return await get_employee_dashboard(employee_id=current_user["id"])


@router.get("/leaves")
async def get_my_leaves(
    search: Optional[str] = Query(default=None),
    status_filter: Optional[LeaveStatus] = Query(default=None, alias="status"),
    leave_type: Optional[LeaveType] = Query(default=None, alias="type"),
    current_user: dict = Depends(require_employee),
):
    return await get_employee_leaves(
        employee_id=current_user["id"],
        search=search,
        leave_status=status_filter,
        leave_type=leave_type,
    )


@router.post("/leaves", status_code=status.HTTP_201_CREATED)
async def create_leave(
    payload: CreateLeaveRequest,
    current_user: dict = Depends(require_employee),
):
    return await create_employee_leave(employee_id=current_user["id"], payload=payload)


@router.get("/leaves/{leave_id}")
async def get_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "manager":
        return await get_leave_for_manager(leave_id)

    return await get_leave_by_id(leave_id, employee_id=current_user["id"])


@router.put("/leaves/{leave_id}")
async def update_leave(
    leave_id: str,
    payload: UpdateLeaveRequest,
    current_user: dict = Depends(require_employee),
):
    return await update_employee_leave(
        leave_id=leave_id,
        employee_id=current_user["id"],
        payload=payload,
    )


@router.delete("/leaves/{leave_id}")
async def delete_leave(leave_id: str, current_user: dict = Depends(require_employee)):
    return await delete_employee_leave(leave_id, employee_id=current_user["id"])
