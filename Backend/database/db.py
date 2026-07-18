from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)

db = client[DB_NAME]

users = db["users"]
matches = db["matches"]
reviews = db["reviews"]
messages = db["messages"]