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
    await users_collection.insert_one({"email": user.email, "password": hashed_password})
    return {"message": "User registered"}

@auth_router.post("/login")
async def login(user: UserLogin):
    valid_user = await authenticate_user(user.email, user.password)
    if not valid_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token(data={"id": str(valid_user["_id"])}, expires_delta=timedelta(minutes=60))
    return {"token": token, "userId": str(valid_user["_id"])}

'''
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from helper import hash_password, authenticate_user, create_access_token
from helper_email import send_reset_email
from database import users_collection
from models import UserSignup, UserLogin
from datetime import timedelta
from jose import jwt, JWTError
from bson import ObjectId
from pydantic import BaseModel, EmailStr
from helper import SECRET_KEY

auth_router = APIRouter()

# Models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    password: str

# API to send reset link
@auth_router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await users_collection.find_one({"email": req.email})
    if user:
        reset_token = create_access_token(data={"id": str(user["_id"])}, expires_delta=timedelta(minutes=15))
        reset_link = f"http://localhost:3000/reset-password/{reset_token}"
        background_tasks.add_task(send_reset_email, req.email, reset_link)
    return {"message": "If that email exists, a reset link has been sent."}

# API to reset password
@auth_router.post("/reset-password/{token}")
async def reset_password(token: str, data: ResetPasswordRequest):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("id")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token.")

    hashed_password = hash_password(data.password)
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"password": hashed_password}})
    return {"message": "Password reset successfully!"}
'''
