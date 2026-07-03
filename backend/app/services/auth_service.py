from fastapi import HTTPException, status

from app.auth.jwt_handler import create_access_token
from app.auth.password import verify_password
from app.database import users_collection
from app.schemas.auth import LoginRequest
from app.utils.mongo import serialize_document


async def login_user(payload: LoginRequest):
    user = await users_collection.find_one({"email": payload.email})

    if user is None or not verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    serialized_user = serialize_document(user)
    serialized_user.pop("password", None)
    access_token = create_access_token(
        {
            "sub": serialized_user["email"],
            "role": serialized_user["role"],
            "id": serialized_user["id"],
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": serialized_user["role"],
    }


async def logout_user():
    return {"message": "Logout service endpoint"}
