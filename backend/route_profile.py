from fastapi import APIRouter, Depends, status
from models import UserProfile
from helper import get_current_user
from database import users_collection

profile_router = APIRouter()

@profile_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return UserProfile(**user)

@profile_router.put("/profile", status_code=status.HTTP_200_OK)
async def update_profile(
    profile_data: UserProfile, user: dict = Depends(get_current_user)
):
    """Update the current user's profile details."""
    
    # Filter to find the current user in the database
    user_id = user["_id"]

    # Convert Pydantic model to dictionary, removing None values
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Update the user document in MongoDB
    await users_collection.update_one(
        {"_id": user_id}, {"$set": update_data}
    )

    # Return the updated profile
    updated_user = await users_collection.find_one({"_id": user_id})
    return UserProfile(**updated_user)