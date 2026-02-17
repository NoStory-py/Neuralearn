from fastapi import APIRouter, Depends, status, HTTPException
from models import TestResults
from helper import get_current_user
from database import users_collection, test_results_collection  # <-- new collection

test_router = APIRouter()


@test_router.get("/test")
async def get_test(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    tests = await test_results_collection.find({"user_id": user_id}).to_list(100)

    for test in tests:
        if '_id' in test:
            test['_id'] = str(test['_id'])
    return tests


@test_router.put("/test", status_code=status.HTTP_200_OK)
async def update_test(test_data: TestResults, user: dict = Depends(get_current_user)):

    user_id = str(user["_id"])
    module_name = test_data.module
    marks = test_data.marks
    timestamps = test_data.timestamps

    if not module_name or not marks or not timestamps:
        raise HTTPException(
            status_code=400,
            detail="Module, at least one mark, and corresponding timestamp are required."
        )

    if len(marks) != len(timestamps):
        raise HTTPException(
            status_code=400,
            detail="Number of marks must match number of timestamps."
        )

    # Check if module exists for this user
    existing = await test_results_collection.find_one({"user_id": user_id, "module": module_name})

    if existing:
        # Append new marks and timestamps
        await test_results_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$push": {
                    "marks": {"$each": marks},
                    "timestamps": {"$each": timestamps}
                }
            }
        )
    else:
        # Insert new document for this module
        await test_results_collection.insert_one({
            "user_id": user_id,
            "module": module_name,
            "marks": marks,
            "timestamps": timestamps
        })

    # Return all test results for this user
    updated_tests = await test_results_collection.find({"user_id": user_id}).to_list(100)

    
    for test in updated_tests:
        if '_id' in test:
            test['_id'] = str(test['_id'])

    return updated_tests


@test_router.get("/test/summary", status_code=status.HTTP_200_OK)
async def get_test_summary(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    test_results = await test_results_collection.find({"user_id": user_id}).to_list(100)

    for result in test_results:
        if '_id' in result:
            result['_id'] = str(result['_id'])

    summary = []
    max_tests = 10  # total number of tests expected per subject

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