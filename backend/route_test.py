from fastapi import APIRouter, Depends, status, HTTPException
from models import TestResults
from helper import get_current_user
from database import users_collection

test_router = APIRouter()

@test_router.get("/test")
async def get_test(user: dict = Depends(get_current_user)):
    return user.get("TestResults", [])

@test_router.put("/test", status_code=status.HTTP_200_OK)
async def update_test(test_data: TestResults, user: dict = Depends(get_current_user)):

    # Filter to find the current user in the database
    user_id = user["_id"]
    module_name = test_data.module
    test_marks = test_data.marks

    if not module_name or not test_marks:
        raise HTTPException(status_code=400, detail="Module and at least one score are required.")
    
    update_result = await users_collection.update_one(
        {"_id": user_id, "TestResults.module": module_name},
        {"$push": {"TestResults.$.marks": {"$each": test_marks}}}
    )

    if update_result.modified_count == 0:
        await users_collection.update_one(
            {"_id": user_id},
            {"$push": {"TestResults": test_data.dict()}}
        )
    updated_user = await users_collection.find_one({"_id": user_id})
    return updated_user.get("TestResults", [])