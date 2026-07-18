from bson import ObjectId
from database.db import users, matches


def upsert_match(learner_id, teacher_id, skill):
    matches.update_one(
        {"user1_id": learner_id, "user2_id": teacher_id, "matched_skill": skill},
        {"$setOnInsert": {"status": "pending"}},
        upsert=True
    )


def sync_matches_for_user(user_id):
    user = users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return

    my_offered = set(user.get("skills_offered", []))
    my_wanted = set(user.get("skills_required", []))

    if not my_offered and not my_wanted:
        return

    other_users = users.find({"_id": {"$ne": user["_id"]}})

    for other in other_users:
        other_offered = set(other.get("skills_offered", []))
        other_wanted = set(other.get("skills_required", []))

        for skill in my_wanted & other_offered:
            upsert_match(user["_id"], other["_id"], skill)

        for skill in other_wanted & my_offered:
            upsert_match(other["_id"], user["_id"], skill)
