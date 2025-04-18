from fastapi import APIRouter, Depends
from helper import get_current_user

protected_router = APIRouter()

@protected_router.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"message": "Welcome!", "email": user["email"]}
