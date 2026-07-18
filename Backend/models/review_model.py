from database.db import users


def serialize_review(review_doc):
    reviewer = users.find_one({"_id": review_doc["reviewer_id"]})

    return {
        "id": str(review_doc["_id"]),
        "rating": review_doc["rating"],
        "comment": review_doc.get("comment", ""),
        "created_at": review_doc["created_at"].isoformat() if review_doc.get("created_at") else None,
        "reviewer": {
            "id": str(reviewer["_id"]),
            "name": reviewer.get("name")
        } if reviewer else None
    }
