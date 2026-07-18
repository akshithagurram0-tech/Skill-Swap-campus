import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "SkillSwapCampus")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

# "threading" is the reliable default on Windows dev machines - eventlet has
# known Windows compatibility issues. Render (Linux) overrides this to
# "eventlet" via env var to pair with the gunicorn eventlet worker.
SOCKETIO_ASYNC_MODE = os.getenv("SOCKETIO_ASYNC_MODE", "threading")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
MAX_CONTENT_LENGTH = 10 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "txt"}
