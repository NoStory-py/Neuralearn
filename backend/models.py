from typing import Optional
from pydantic import BaseModel, conint

class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    gender: Optional[str] = None
    age: Optional[conint(ge=0)] = None 
    favoriteColor: Optional[str] = None
    favoriteAnimal: Optional[str] = None
    favoriteFood: Optional[str] = None
    favoriteCartoon: Optional[str] = None