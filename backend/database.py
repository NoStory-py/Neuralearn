from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client["auth_db"]
users_collection = db["users"]

async def check_mongo_connection():
    try:
        await client.admin.command("ping")
        print("MongoDB Connected")
    except Exception as e:
        print(f"MongoDB Connection Failed: {e}")

async def close_mongo_connection():
    client.close()
    print("MongoDB Connection Closed")

