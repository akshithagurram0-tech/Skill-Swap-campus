from flask import Blueprint, request, jsonify
from database.db import users
from models.user_model import serialize_user, new_user_document
from utils.auth_utils import hash_password, check_password, generate_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "Name, email and password are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "Email already registered"}), 409

    password_hash = hash_password(password)
    user_doc = new_user_document(name, email, password_hash)
    result = users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = generate_token(result.inserted_id)

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": serialize_user(user_doc)
    })


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = users.find_one({"email": email})

    if not user or not check_password(password, user["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    token = generate_token(user["_id"])

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": serialize_user(user)
    })
