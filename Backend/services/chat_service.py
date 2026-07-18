from bson import ObjectId
from database.db import matches


def has_match_between(user_id_a, user_id_b):
    a = ObjectId(user_id_a)
    b = ObjectId(user_id_b)

    return matches.find_one({
        "$or": [
            {"user1_id": a, "user2_id": b},
            {"user1_id": b, "user2_id": a}
        ]
    }) is not None


def room_name(user_id_a, user_id_b):
    return "_".join(sorted([str(user_id_a), str(user_id_b)]))
