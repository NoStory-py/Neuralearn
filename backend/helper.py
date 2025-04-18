import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from database import users_collection
from bson import ObjectId

# JWT Secret Key & Config
SECRET_KEY = "f8a4c0b5c3e1d2a9f6b7d4e8c0a3f5e2b4c1d7a9f8b5e6c3d2a7f0b1e9c4d8a"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Hashing function using bcrypt
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

# Verify password function
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# Authenticate user
async def authenticate_user(email: str, password: str):
    user = await users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        return None
    return user

# Create JWT token
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    # expire = datetime.utcnow() + expires_delta
    # to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Get current user from JWT token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        print(user)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        print(e)
