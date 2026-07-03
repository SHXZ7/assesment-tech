from datetime import datetime, timezone
from typing import Optional

from app.database import audit_logs_collection


async def create_audit_log(
    action: str,
    actor_id: str,
    actor_role: str,
    target_type: str,
    target_id: Optional[str] = None,
    metadata: Optional[dict] = None,
):
    await audit_logs_collection.insert_one(
        {
            "action": action,
            "actorId": actor_id,
            "actorRole": actor_role,
            "targetType": target_type,
            "targetId": target_id,
            "metadata": metadata or {},
            "createdAt": datetime.now(timezone.utc),
        }
    )
