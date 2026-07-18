def new_user_document(name, email, password_hash):
    return {
        "name": name,
        "email": email,
        "password": password_hash,
        "skills_offered": [],
        "skills_required": [],
        "rating": 0,
        "reviews": []
    }


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "skills_offered": user.get("skills_offered", []),
        "skills_required": user.get("skills_required", []),
        "rating": user.get("rating", 0),
        "reviews": [str(review_id) for review_id in user.get("reviews", [])]
    }
