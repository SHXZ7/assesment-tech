from datetime import datetime, timezone
from typing import Literal, TypedDict


UserRole = Literal["employee", "manager"]


class User(TypedDict):
    name: str
    email: str
    password: str
    department: str
    role: UserRole
    createdAt: datetime


def create_user_model(
    name: str,
    email: str,
    password: str,
    department: str,
    role: UserRole,
) -> User:
    return {
        "name": name,
        "email": email,
        "password": password,
        "department": department,
        "role": role,
        "createdAt": datetime.now(timezone.utc),
    }
