from typing import Optional, List
from pydantic import BaseModel, conint

class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    username: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[conint(ge=0)] = None 
    favoriteColor: Optional[str] = None
    favoriteAnimal: Optional[str] = None
    favoriteFood: Optional[str] = None
    favoriteCartoon: Optional[str] = None

class TestResults(BaseModel):
    module: Optional[str]
    marks: List[int]