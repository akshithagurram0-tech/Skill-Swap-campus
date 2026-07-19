import jwt
from bson import ObjectId
from flask import request
from flask_socketio import join_room

from config import JWT_SECRET_KEY
from extensions import socketio
from database.db import messages, users
from models.message_model import new_message_document, serialize_message
from services.chat_service import has_match_between, room_name

sid_to_user = {}


@socketio.on("connect")
def handle_connect(auth):
    token = (auth or {}).get("token")

    if not token:
        return False

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return False

    sid_to_user[request.sid] = payload["user_id"]
    # Personal room, keyed by user id, so notifications can reach this user
    # regardless of which conversation/call rooms they've joined.
    join_room(payload["user_id"])


@socketio.on("disconnect")
def handle_disconnect():
    sid_to_user.pop(request.sid, None)


@socketio.on("join_conversation")
def handle_join_conversation(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("with_user_id")

    if not my_id or not other_id or not has_match_between(my_id, other_id):
        return

    join_room(room_name(my_id, other_id))


@socketio.on("send_message")
def handle_send_message(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("to")
    text = ((data or {}).get("message") or "").strip()

    if not my_id or not other_id or not text:
        return

    if not has_match_between(my_id, other_id):
        return

    doc = new_message_document(ObjectId(my_id), ObjectId(other_id), text)
    result = messages.insert_one(doc)
    doc["_id"] = result.inserted_id

    socketio.emit("new_message", serialize_message(doc), room=room_name(my_id, other_id))

    sender = users.find_one({"_id": ObjectId(my_id)})
    socketio.emit("message_notification", {
        "from": my_id,
        "from_name": sender.get("name") if sender else "Someone",
        "preview": text[:80]
    }, room=other_id)
