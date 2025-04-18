from fastapi import APIRouter, HTTPException, Depends, status
from database import users_collection
from helper import hash_password, authenticate_user, create_access_token
from models import UserSignup, UserLogin
from datetime import timedelta

auth_router = APIRouter()

@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignup):
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(user.password)
    await users_collection.insert_one({"username": user.username, "email": user.email, "password": hashed_password})
    return {"message": "User registered"}

@auth_router.post("/login")
async def login(user: UserLogin):
    valid_user = await authenticate_user(user.email, user.password)
    if not valid_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token(data={"id": str(valid_user["_id"])}, expires_delta=timedelta(minutes=60))
    return {"token": token, "userId": str(valid_user["_id"])}
