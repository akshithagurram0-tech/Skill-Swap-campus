import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import FLASK_DEBUG, UPLOAD_FOLDER, MAX_CONTENT_LENGTH, FRONTEND_URL
from extensions import socketio
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.match_routes import match_bp
from routes.review_routes import review_bp
from routes.message_routes import message_bp
import sockets.chat_socket  # noqa: F401  (registers Socket.IO event handlers)
import sockets.call_socket  # noqa: F401  (registers Socket.IO event handlers)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
CORS(app, origins=FRONTEND_URL)
socketio.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(match_bp)
app.register_blueprint(review_bp)
app.register_blueprint(message_bp)


@app.route("/")
def home():
    return "SkillSwap Exchange Backend + MongoDB Connected Successfully!"


@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=FLASK_DEBUG)
