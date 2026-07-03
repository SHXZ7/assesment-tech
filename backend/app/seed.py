import asyncio
from datetime import datetime, timezone

from app.auth.password import hash_password
from app.database import client, users_collection


SEED_USERS = [
    {
        "name": "Test Employee",
        "email": "employee@test.com",
        "password": "employee123",
        "department": "Engineering",
        "role": "employee",
    },
    {
        "name": "Test Manager",
        "email": "manager@test.com",
        "password": "manager123",
        "department": "Engineering",
        "role": "manager",
    },
]


async def seed_users():
    for user in SEED_USERS:
        await users_collection.update_one(
            {"email": user["email"]},
            {
                "$set": {
                    "name": user["name"],
                    "password": hash_password(user["password"]),
                    "department": user["department"],
                    "role": user["role"],
                },
                "$setOnInsert": {
                    "createdAt": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )

    print("Seed users created successfully.")


if __name__ == "__main__":
    asyncio.run(seed_users())
    client.close()
