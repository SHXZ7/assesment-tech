from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import require_manager
from app.schemas.leave import (
    LeaveStatus,
    ManagerDashboardResponse,
    RejectLeaveRequest,
)
from app.services.manager_service import (
    approve_leave,
    get_employee_leave_history,
    get_manager_dashboard,
    get_manager_leaves,
    get_pending_leaves,
    reject_leave,
    search_employees,
)


router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/dashboard", response_model=ManagerDashboardResponse)
async def manager_dashboard(current_user: dict = Depends(require_manager)):
    return await get_manager_dashboard()


@router.get("/pending")
async def pending_leaves(current_user: dict = Depends(require_manager)):
    return await get_pending_leaves()


@router.get("/leaves")
async def manager_leaves(
    status_filter: Optional[LeaveStatus] = Query(default=None, alias="status"),
    department: Optional[str] = Query(default=None),
    current_user: dict = Depends(require_manager),
):
    return await get_manager_leaves(
        leave_status=status_filter,
        department=department,
    )


@router.get("/search")
async def manager_search_employees(
    name: Optional[str] = Query(default=None),
    email: Optional[str] = Query(default=None),
    department: Optional[str] = Query(default=None),
    current_user: dict = Depends(require_manager),
):
    return await search_employees(name=name, email=email, department=department)


@router.get("/employee/{employee_id}/history")
async def employee_history(
    employee_id: str,
    current_user: dict = Depends(require_manager),
):
    return await get_employee_leave_history(employee_id)


@router.put("/approve/{leave_id}")
async def approve_employee_leave(
    leave_id: str,
    current_user: dict = Depends(require_manager),
):
    return await approve_leave(leave_id)


@router.put("/reject/{leave_id}")
async def reject_employee_leave(
    leave_id: str,
    payload: RejectLeaveRequest,
    current_user: dict = Depends(require_manager),
):
    return await reject_leave(leave_id, comment=payload.comment)
