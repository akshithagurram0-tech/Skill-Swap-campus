from datetime import datetime, timezone


def new_message_document(sender_id, receiver_id, message):
    return {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "message": message,
        "message_type": "text",
        "file_name": None,
        "file_url": None,
        "timestamp": datetime.now(timezone.utc)
    }


def new_file_message_document(sender_id, receiver_id, file_name, file_url):
    return {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "message": "",
        "message_type": "file",
        "file_name": file_name,
        "file_url": file_url,
        "timestamp": datetime.now(timezone.utc)
    }


def serialize_message(doc):
    return {
        "id": str(doc["_id"]),
        "sender_id": str(doc["sender_id"]),
        "receiver_id": str(doc["receiver_id"]),
        "message": doc.get("message", ""),
        "message_type": doc.get("message_type", "text"),
        "file_name": doc.get("file_name"),
        "file_url": doc.get("file_url"),
        "timestamp": doc["timestamp"].isoformat() if doc.get("timestamp") else None
    }
