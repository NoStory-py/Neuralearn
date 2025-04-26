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
    user_id = user["_id"]
    module_name = test_data.module
    test_marks = test_data.marks

    if not module_name or not test_marks:
        raise HTTPException(status_code=400, detail="Module and at least one score are required.")

    # Try to update existing module's marks
    update_result = await users_collection.update_one(
        {"_id": user_id, "TestResults.module": module_name},
        {"$push": {"TestResults.$.marks": {"$each": test_marks}}}
    )

    # If no existing module found, create a new one
    if update_result.modified_count == 0:
        await users_collection.update_one(
            {"_id": user_id},
            {"$push": {"TestResults": test_data.dict()}}
        )

    updated_user = await users_collection.find_one({"_id": user_id})
    return updated_user.get("TestResults", [])


@test_router.get("/test/summary", status_code=status.HTTP_200_OK)
async def get_test_summary(user: dict = Depends(get_current_user)):
    user_id = user["_id"]
    user_data = await users_collection.find_one({"_id": user_id})

    test_results = user_data.get("TestResults", [])
    summary = []

    max_tests = 10  # total number of tests expected per subject (adjust if needed)

    for result in test_results:
        marks = result.get("marks", [])
        module = result.get("module", "Unknown")

        if not marks:
            continue

        average_marks = sum(marks) / len(marks)
        progress = min((len(marks) / max_tests) * 100, 100)

        summary.append({
            "subject": module,
            "averageMarks": round(average_marks, 2),
            "progress": round(progress, 2)
        })

    return summary
    