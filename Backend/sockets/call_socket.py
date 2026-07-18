from flask import request
from flask_socketio import emit, join_room, leave_room

from extensions import socketio
from services.chat_service import has_match_between, room_name
from sockets.chat_socket import sid_to_user


def call_room(user_id_a, user_id_b):
    return "call_" + room_name(user_id_a, user_id_b)


@socketio.on("join_call")
def handle_join_call(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("with_user_id")

    if not my_id or not other_id or not has_match_between(my_id, other_id):
        return

    join_room(call_room(my_id, other_id))
    emit("peer_joined", {"from": my_id}, room=call_room(my_id, other_id), skip_sid=request.sid)


@socketio.on("call_offer")
def handle_call_offer(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("to")
    offer = (data or {}).get("offer")

    if not my_id or not other_id or not has_match_between(my_id, other_id):
        return

    emit("call_offer", {"from": my_id, "offer": offer}, room=call_room(my_id, other_id), skip_sid=request.sid)


@socketio.on("call_answer")
def handle_call_answer(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("to")
    answer = (data or {}).get("answer")

    if not my_id or not other_id or not has_match_between(my_id, other_id):
        return

    emit("call_answer", {"from": my_id, "answer": answer}, room=call_room(my_id, other_id), skip_sid=request.sid)


@socketio.on("ice_candidate")
def handle_ice_candidate(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("to")
    candidate = (data or {}).get("candidate")

    if not my_id or not other_id:
        return

    emit("ice_candidate", {"from": my_id, "candidate": candidate}, room=call_room(my_id, other_id), skip_sid=request.sid)


@socketio.on("leave_call")
def handle_leave_call(data):
    my_id = sid_to_user.get(request.sid)
    other_id = (data or {}).get("with_user_id")

    if not my_id or not other_id:
        return

    emit("peer_left", {"from": my_id}, room=call_room(my_id, other_id), skip_sid=request.sid)
    leave_room(call_room(my_id, other_id))
