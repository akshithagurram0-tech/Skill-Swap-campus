import certifi
from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

# Only Atlas (mongodb+srv://) connections need an explicit CA bundle - forcing
# tlsCAFile on a plain local mongodb:// connection breaks the (non-TLS) handshake.
client_options = {"tlsCAFile": certifi.where()} if MONGO_URI.startswith("mongodb+srv://") else {}

client = MongoClient(MONGO_URI, **client_options)

db = client[DB_NAME]

users = db["users"]
matches = db["matches"]
reviews = db["reviews"]
messages = db["messages"]