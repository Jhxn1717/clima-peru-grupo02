from pydantic import BaseModel
from typing import Optional, List

class CityBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    altitude: int
    is_featured: bool = False
    is_capital: bool = False
    province: Optional[str] = None

class DepartmentBase(BaseModel):
    name: str
    code: str
    capital: str
    latitude: float
    longitude: float
    region_natural: str
    description: Optional[str] = None

class CityResponse(CityBase):
    id: int
    department_id: int
    department_name: Optional[str] = None
    region_natural: Optional[str] = None

    model_config = {"from_attributes": True}

class DepartmentResponse(DepartmentBase):
    id: int
    cities: List[CityResponse] = []

    model_config = {"from_attributes": True}

class CitySearchQuery(BaseModel):
    query: Optional[str] = None
    department_id: Optional[int] = None
    region_natural: Optional[str] = None
