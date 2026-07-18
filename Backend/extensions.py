from flask_socketio import SocketIO
from config import FRONTEND_URL, SOCKETIO_ASYNC_MODE

socketio = SocketIO(cors_allowed_origins=FRONTEND_URL, async_mode=SOCKETIO_ASYNC_MODE)
