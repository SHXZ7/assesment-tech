from datetime import date, datetime

from bson import ObjectId


def serialize_document(document):
    if document is None:
        return None

    serialized = {}

    for key, value in document.items():
        if key == "_id":
            serialized["id"] = str(value)
        elif isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, (date, datetime)):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value

    return serialized


def serialize_documents(documents):
    return [serialize_document(document) for document in documents]
