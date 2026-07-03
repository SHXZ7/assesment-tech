from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database import leaves_collection, users_collection
from app.utils.mongo import serialize_document, serialize_documents


async def get_manager_dashboard():
    total_employees = await users_collection.count_documents({"role": "employee"})
    pending = await leaves_collection.count_documents({"status": "Pending"})
    approved = await leaves_collection.count_documents({"status": "Approved"})
    rejected = await leaves_collection.count_documents({"status": "Rejected"})
    cursor = leaves_collection.find({}).sort("createdAt", -1).limit(10)
    recent = await cursor.to_list(length=10)

    return {
        "totalEmployees": total_employees,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "recent": await enrich_leaves_with_employee(recent),
    }


async def get_pending_leaves():
    cursor = leaves_collection.find({"status": "Pending"}).sort("createdAt", -1)

    leaves = await cursor.to_list(length=None)

    return await enrich_leaves_with_employee(leaves)


async def get_manager_leaves(
    leave_status: str | None = None,
    department: str | None = None,
):
    query = {}

    if leave_status:
        query["status"] = leave_status

    if department:
        employees = await users_collection.find(
            {"role": "employee", "department": department}
        ).to_list(length=None)
        employee_ids = [str(employee["_id"]) for employee in employees]
        query["employeeId"] = {"$in": employee_ids}

    cursor = leaves_collection.find(query).sort("createdAt", -1)
    leaves = await cursor.to_list(length=None)

    return await enrich_leaves_with_employee(leaves)


async def get_leave_for_manager(leave_id: str):
    object_id = parse_leave_id(leave_id)
    leave = await leaves_collection.find_one({"_id": object_id})

    if leave is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found",
        )

    enriched = await enrich_leaves_with_employee([leave])

    return enriched[0]


async def approve_leave(leave_id: str):
    object_id = parse_leave_id(leave_id)
    leave = await leaves_collection.find_one({"_id": object_id})

    if leave is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found",
        )

    if leave["status"] != "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pending leave requests can be approved.",
        )

    result = await leaves_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": "Approved",
                "managerComment": None,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found",
        )

    leave = await leaves_collection.find_one({"_id": object_id})

    return (await enrich_leaves_with_employee([leave]))[0]


async def reject_leave(leave_id: str, comment: str):
    object_id = parse_leave_id(leave_id)
    leave = await leaves_collection.find_one({"_id": object_id})

    if leave is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found",
        )

    if leave["status"] != "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pending leave requests can be rejected.",
        )

    result = await leaves_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": "Rejected",
                "managerComment": comment,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found",
        )

    leave = await leaves_collection.find_one({"_id": object_id})

    return (await enrich_leaves_with_employee([leave]))[0]


async def search_employees(
    name: str | None = None,
    email: str | None = None,
    department: str | None = None,
):
    query = {"role": "employee"}

    if name:
        query["name"] = {"$regex": name, "$options": "i"}

    if email:
        query["email"] = {"$regex": email, "$options": "i"}

    if department:
        query["department"] = {"$regex": department, "$options": "i"}

    cursor = users_collection.find(query).sort("name", 1)
    employees = await cursor.to_list(length=None)
    serialized = serialize_documents(employees)

    for employee in serialized:
        employee.pop("password", None)

    return serialized


async def get_employee_leave_history(employee_id: str):
    employee = await get_employee_or_404(employee_id)
    cursor = leaves_collection.find({"employeeId": employee_id}).sort("createdAt", -1)
    leaves = await cursor.to_list(length=None)

    return {
        "employee": serialize_employee(employee),
        "leaves": serialize_documents(leaves),
    }


def parse_leave_id(leave_id: str):
    try:
        return ObjectId(leave_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave id",
        )


async def enrich_leaves_with_employee(leaves):
    enriched = []

    for leave in leaves:
        serialized_leave = serialize_document(leave)
        employee = await find_employee_by_string_id(serialized_leave["employeeId"])
        serialized_leave["employee"] = serialize_employee(employee) if employee else None
        enriched.append(serialized_leave)

    return enriched


async def find_employee_by_string_id(employee_id: str):
    try:
        object_id = ObjectId(employee_id)
    except InvalidId:
        return None

    return await users_collection.find_one({"_id": object_id, "role": "employee"})


async def get_employee_or_404(employee_id: str):
    employee = await find_employee_by_string_id(employee_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    return employee


def serialize_employee(employee):
    serialized = serialize_document(employee)
    serialized.pop("password", None)

    return serialized
