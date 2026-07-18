from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from database.db import users
from models.user_model import serialize_user
from utils.auth_utils import token_required

user_bp = Blueprint("user", __name__, url_prefix="/api/users")


@user_bp.route("/me", methods=["GET"])
@token_required
def get_profile():
    try:
        user = users.find_one({"_id": ObjectId(request.user_id)})
    except InvalidId:
        return jsonify({"message": "Invalid token"}), 401

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify(serialize_user(user))


@user_bp.route("/me", methods=["PUT"])
@token_required
def update_profile():
    data = request.json or {}

    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]

    if "skills_offered" in data:
        update_fields["skills_offered"] = [
            s.strip().lower() for s in data["skills_offered"] if s.strip()
        ]

    if "skills_required" in data:
        update_fields["skills_required"] = [
            s.strip().lower() for s in data["skills_required"] if s.strip()
        ]

    if not update_fields:
        return jsonify({"message": "No valid fields to update"}), 400

    try:
        user_object_id = ObjectId(request.user_id)
    except InvalidId:
        return jsonify({"message": "Invalid token"}), 401

    users.update_one({"_id": user_object_id}, {"$set": update_fields})

    user = users.find_one({"_id": user_object_id})
    return jsonify(serialize_user(user))
