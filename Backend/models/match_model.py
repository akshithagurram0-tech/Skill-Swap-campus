from database.db import users, reviews


def serialize_match(match_doc, my_id):
    is_learner = match_doc["user1_id"] == my_id
    other_id = match_doc["user2_id"] if is_learner else match_doc["user1_id"]
    other = users.find_one({"_id": other_id})

    already_reviewed = reviews.find_one({
        "match_id": match_doc["_id"],
        "reviewer_id": my_id
    }) is not None

    return {
        "id": str(match_doc["_id"]),
        "matched_skill": match_doc["matched_skill"],
        "status": match_doc.get("status", "pending"),
        "direction": "learning" if is_learner else "teaching",
        "already_reviewed": already_reviewed,
        "with_user": {
            "id": str(other["_id"]),
            "name": other.get("name"),
            "email": other.get("email")
        } if other else None
    }
