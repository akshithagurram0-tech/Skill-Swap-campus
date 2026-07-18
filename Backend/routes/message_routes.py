import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from bson import ObjectId
from bson.errors import InvalidId
from config import UPLOAD_FOLDER, ALLOWED_UPLOAD_EXTENSIONS
from database.db import messages
from extensions import socketio
from models.message_model import serialize_message, new_file_message_document
from services.chat_service import has_match_between, room_name
from utils.auth_utils import token_required

message_bp = Blueprint("messages", __name__, url_prefix="/api/messages")


def is_allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_UPLOAD_EXTENSIONS


@message_bp.route("/<other_user_id>", methods=["GET"])
@token_required
def get_conversation(other_user_id):
    try:
        other_id = ObjectId(other_user_id)
        my_id = ObjectId(request.user_id)
    except InvalidId:
        return jsonify({"message": "Invalid id"}), 400

    if not has_match_between(my_id, other_id):
        return jsonify({"message": "You are not matched with this user"}), 403

    docs = messages.find({
        "$or": [
            {"sender_id": my_id, "receiver_id": other_id},
            {"sender_id": other_id, "receiver_id": my_id}
        ]
    }).sort("timestamp", 1)

    return jsonify([serialize_message(doc) for doc in docs])


@message_bp.route("/upload", methods=["POST"])
@token_required
def upload_file():
    receiver_id = request.form.get("to")
    uploaded_file = request.files.get("file")

    if not receiver_id or not uploaded_file or uploaded_file.filename == "":
        return jsonify({"message": "to and file are required"}), 400

    if not is_allowed_file(uploaded_file.filename):
        return jsonify({"message": "File type not allowed"}), 400

    try:
        receiver_object_id = ObjectId(receiver_id)
        sender_object_id = ObjectId(request.user_id)
    except InvalidId:
        return jsonify({"message": "Invalid id"}), 400

    if not has_match_between(sender_object_id, receiver_object_id):
        return jsonify({"message": "You are not matched with this user"}), 403

    original_name = secure_filename(uploaded_file.filename)
    extension = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{extension}"

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    uploaded_file.save(os.path.join(UPLOAD_FOLDER, stored_name))

    doc = new_file_message_document(
        sender_object_id,
        receiver_object_id,
        original_name,
        f"/uploads/{stored_name}"
    )
    result = messages.insert_one(doc)
    doc["_id"] = result.inserted_id

    serialized = serialize_message(doc)
    socketio.emit(
        "new_message",
        serialized,
        room=room_name(sender_object_id, receiver_object_id)
    )

    return jsonify(serialized)
