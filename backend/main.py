from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import check_mongo_connection, close_mongo_connection

from route_auth import auth_router
from route_model import model_router
from route_profile import profile_router
from protected import protected_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_mongo_connection() 
    yield 
    await close_mongo_connection()  

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/auth")
app.include_router(model_router, prefix="/model")
app.include_router(profile_router)
app.include_router(protected_router)

if __name__ == "__main__":
    import asyncio, uvicorn
    asyncio.run(uvicorn.run("main:app", host="127.0.0.1", port=8000))
