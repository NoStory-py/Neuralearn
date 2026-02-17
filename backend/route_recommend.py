from fastapi import APIRouter, Depends
from helper import get_current_user
from database import test_results_collection

recommend_router = APIRouter()

MODULE_ROUTE_MAP = {
    "maths": "/learning-modules/maths",
    "alphabet": "/learning-modules/alphabets",
    "alphabets": "/learning-modules/alphabets",
    "colors": "/learning-modules/colors",
    "shapes": "/learning-modules/shapes",
    "social emotions": "/learning-modules/social-emotions",
    "speech training": "/learning-modules/VoiceRecognition",
}

DEFAULT_MODULES = ["maths", "colors"]


@recommend_router.get("/recommend")
async def recommend(user: dict = Depends(get_current_user)):

    user_id = str(user["_id"])

    results = await test_results_collection.find(
        {"user_id": user_id}
    ).to_list(100)

    module_scores = []

    # If no test results → default recommendations
    if not results:

        return {
            "recommended": [
                {
                    "module": module,
                    "route": MODULE_ROUTE_MAP[module]
                }
                for module in DEFAULT_MODULES
            ]
        }


    # Calculate average score per module
    for result in results:

        module = str(result.get("module", "")).strip().lower()
        marks = result.get("marks", [])

        if not module or not marks:
            continue

        avg = sum(marks) / len(marks)

        if module in MODULE_ROUTE_MAP:

            module_scores.append({
                "module": module,
                "route": MODULE_ROUTE_MAP[module],
                "avg": avg
            })


    # If still empty → fallback
    if not module_scores:

        return {
            "recommended": [
                {
                    "module": module,
                    "route": MODULE_ROUTE_MAP[module]
                }
                for module in DEFAULT_MODULES
            ]
        }


    # Sort by lowest average score
    module_scores.sort(key=lambda x: x["avg"])


    # Take lowest 2 modules
    lowest_two = module_scores[:2]


    # Remove avg before sending
    recommendations = []

    for item in lowest_two:

        recommendations.append({
            "module": item["module"],
            "route": item["route"]
        })


    return {
        "recommended": recommendations
    }
