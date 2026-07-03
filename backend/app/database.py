import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError


APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env", override=False)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "darexai")

client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
database = client[MONGODB_DB_NAME]

users_collection = database["users"]
leaves_collection = database["leaves"]

USER_ROLES = ("employee", "manager")
LEAVE_STATUSES = ("Pending", "Approved", "Rejected")


def get_database():
    return database


async def create_indexes():
    try:
        await users_collection.create_index("email", unique=True)
        await leaves_collection.create_index("employeeId")
        await leaves_collection.create_index("status")
    except PyMongoError as error:
        print(f"MongoDB index setup skipped: {error}")


async def is_database_connected():
    try:
        await client.admin.command("ping")
        return True
    except PyMongoError:
        return False
