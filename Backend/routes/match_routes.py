from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from database.db import matches
from models.match_model import serialize_match
from services.matching_service import sync_matches_for_user
from utils.auth_utils import token_required

match_bp = Blueprint("matches", __name__, url_prefix="/api/matches")

VALID_STATUSES = {"pending", "accepted", "declined"}


@match_bp.route("", methods=["GET"])
@token_required
def get_matches():
    sync_matches_for_user(request.user_id)

    my_id = ObjectId(request.user_id)
    docs = matches.find({"$or": [{"user1_id": my_id}, {"user2_id": my_id}]})

    return jsonify([serialize_match(doc, my_id) for doc in docs])


@match_bp.route("/<match_id>/status", methods=["PATCH"])
@token_required
def update_match_status(match_id):
    data = request.json or {}
    new_status = data.get("status")

    if new_status not in VALID_STATUSES:
        return jsonify({"message": "Status must be one of: pending, accepted, declined"}), 400

    try:
        match_object_id = ObjectId(match_id)
        my_id = ObjectId(request.user_id)
    except InvalidId:
        return jsonify({"message": "Invalid id"}), 400

    match = matches.find_one({"_id": match_object_id})

    if not match:
        return jsonify({"message": "Match not found"}), 404

    if my_id not in (match["user1_id"], match["user2_id"]):
        return jsonify({"message": "Not authorized to update this match"}), 403

    matches.update_one({"_id": match_object_id}, {"$set": {"status": new_status}})
    updated = matches.find_one({"_id": match_object_id})

    return jsonify(serialize_match(updated, my_id))
