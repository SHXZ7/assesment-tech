from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import leaves_collection
from app.models.leave import create_leave_model
from app.schemas.leave import CreateLeaveRequest, UpdateLeaveRequest
from app.utils.mongo import serialize_document, serialize_documents


async def get_employee_leaves(
    employee_id: str,
    search: str | None = None,
    leave_status: str | None = None,
    leave_type: str | None = None,
):
    query = {"employeeId": employee_id}

    if leave_status:
        query["status"] = leave_status

    if leave_type:
        query["leaveType"] = leave_type

    if search:
        query["$or"] = [
            {"leaveType": {"$regex": search, "$options": "i"}},
            {"reason": {"$regex": search, "$options": "i"}},
        ]

    cursor = leaves_collection.find(query).sort("createdAt", -1)
    leaves = await cursor.to_list(length=None)

    return serialize_documents(leaves)


async def get_employee_dashboard(employee_id: str):
    base_filter = {"employeeId": employee_id}
    total = await leaves_collection.count_documents(base_filter)
    approved = await leaves_collection.count_documents(
        {**base_filter, "status": "Approved"}
    )
    pending = await leaves_collection.count_documents(
        {**base_filter, "status": "Pending"}
    )
    rejected = await leaves_collection.count_documents(
        {**base_filter, "status": "Rejected"}
    )
    cursor = leaves_collection.find(base_filter).sort("createdAt", -1).limit(5)
    recent = await cursor.to_list(length=5)

    return {
        "total": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "recent": serialize_documents(recent),
    }


async def create_employee_leave(employee_id: str, payload: CreateLeaveRequest):
    if payload.startDate > payload.endDate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date",
        )

    leave = create_leave_model(
        employee_id=employee_id,
        leave_type=payload.leaveType,
        start_date=payload.startDate,
        end_date=payload.endDate,
        reason=payload.reason,
    )
    result = await leaves_collection.insert_one(leave)

    leave = await leaves_collection.find_one({"_id": result.inserted_id})

    return serialize_document(leave)


async def get_leave_by_id(leave_id: str, employee_id: str):
    leave = await find_employee_leave_or_404(leave_id, employee_id)

    return serialize_document(leave)


async def update_employee_leave(
    leave_id: str,
    employee_id: str,
    payload: UpdateLeaveRequest,
):
    if payload.startDate > payload.endDate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date",
        )

    leave = await find_employee_leave_or_404(leave_id, employee_id)

    if leave["status"] != "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pending leave requests can be edited.",
        )

    object_id = leave["_id"]
    await leaves_collection.update_one(
        {"_id": object_id, "employeeId": employee_id},
        {
            "$set": {
                "leaveType": payload.leaveType,
                "startDate": payload.startDate,
                "endDate": payload.endDate,
                "reason": payload.reason,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    updated_leave = await leaves_collection.find_one(
        {"_id": object_id, "employeeId": employee_id}
    )

    return serialize_document(updated_leave)


async def delete_employee_leave(leave_id: str, employee_id: str):
    leave = await find_employee_leave_or_404(leave_id, employee_id)

    if leave["status"] != "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pending leave requests can be cancelled.",
        )

    await leaves_collection.delete_one({"_id": leave["_id"], "employeeId": employee_id})

    return {"message": "Leave request cancelled successfully."}


async def find_employee_leave_or_404(leave_id: str, employee_id: str):
    try:
        object_id = ObjectId(leave_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave id",
        )

    leave = await leaves_collection.find_one(
        {"_id": object_id, "employeeId": employee_id}
    )

    if leave is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found",
        )

    return leave
