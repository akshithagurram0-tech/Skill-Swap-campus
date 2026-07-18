import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
from config import JWT_SECRET_KEY

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def generate_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"message": "Authorization token is missing"}), 401

        token = auth_header.split(" ", 1)[1]

        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401

        request.user_id = payload["user_id"]
        return f(*args, **kwargs)

    return decorated
