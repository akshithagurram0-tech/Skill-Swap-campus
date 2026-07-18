from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from database.db import reviews, matches, users
from models.review_model import serialize_review
from utils.auth_utils import token_required

review_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


def recalculate_rating(user_id):
    user_reviews = list(reviews.find({"reviewed_user_id": user_id}))

    average = round(sum(r["rating"] for r in user_reviews) / len(user_reviews), 2) if user_reviews else 0

    users.update_one(
        {"_id": user_id},
        {"$set": {
            "rating": average,
            "reviews": [r["_id"] for r in user_reviews]
        }}
    )


@review_bp.route("", methods=["POST"])
@token_required
def create_review():
    data = request.json or {}

    match_id = data.get("match_id")
    rating = data.get("rating")
    comment = data.get("comment", "")

    if not match_id or rating is None:
        return jsonify({"message": "match_id and rating are required"}), 400

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({"message": "Rating must be a number"}), 400

    if rating < 1 or rating > 5:
        return jsonify({"message": "Rating must be between 1 and 5"}), 400

    try:
        match_object_id = ObjectId(match_id)
        my_id = ObjectId(request.user_id)
    except InvalidId:
        return jsonify({"message": "Invalid id"}), 400

    match = matches.find_one({"_id": match_object_id})

    if not match:
        return jsonify({"message": "Match not found"}), 404

    if my_id not in (match["user1_id"], match["user2_id"]):
        return jsonify({"message": "Not authorized for this match"}), 403

    if match.get("status") != "accepted":
        return jsonify({"message": "You can only review an accepted match"}), 400

    if reviews.find_one({"match_id": match_object_id, "reviewer_id": my_id}):
        return jsonify({"message": "You already reviewed this match"}), 409

    reviewed_user_id = match["user2_id"] if match["user1_id"] == my_id else match["user1_id"]

    review_doc = {
        "reviewer_id": my_id,
        "reviewed_user_id": reviewed_user_id,
        "match_id": match_object_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc)
    }
    result = reviews.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id

    recalculate_rating(reviewed_user_id)

    return jsonify(serialize_review(review_doc))


@review_bp.route("/user/<user_id>", methods=["GET"])
@token_required
def get_reviews_for_user(user_id):
    try:
        target_id = ObjectId(user_id)
    except InvalidId:
        return jsonify({"message": "Invalid id"}), 400

    docs = reviews.find({"reviewed_user_id": target_id}).sort("created_at", -1)

    return jsonify([serialize_review(doc) for doc in docs])
