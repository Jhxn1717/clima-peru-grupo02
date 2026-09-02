from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.peru_geo import Department, City
from app.schemas.city import DepartmentResponse, CityResponse

router = APIRouter(prefix="/departments", tags=["Departamentos del Perú"])

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).order_by(Department.name.asc()).all()
    result = []
    for d in departments:
        cities = [
            CityResponse(
                id=c.id,
                department_id=c.department_id,
                name=c.name,
                province=c.province,
                latitude=c.latitude,
                longitude=c.longitude,
                altitude=c.altitude,
                is_featured=c.is_featured,
                is_capital=c.is_capital,
                department_name=d.name,
                region_natural=d.region_natural
            )
            for c in d.cities
        ]
        result.append(
            DepartmentResponse(
                id=d.id,
                name=d.name,
                code=d.code,
                capital=d.capital,
                latitude=d.latitude,
                longitude=d.longitude,
                region_natural=d.region_natural,
                description=d.description,
                cities=cities
            )
        )
    return result

@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department_by_id(dept_id: int, db: Session = Depends(get_db)):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    cities = [
        CityResponse(
            id=c.id,
            department_id=c.department_id,
            name=c.name,
            province=c.province,
            latitude=c.latitude,
            longitude=c.longitude,
            altitude=c.altitude,
            is_featured=c.is_featured,
            is_capital=c.is_capital,
            department_name=d.name,
            region_natural=d.region_natural
        )
        for c in d.cities
    ]
    return DepartmentResponse(
        id=d.id,
        name=d.name,
        code=d.code,
        capital=d.capital,
        latitude=d.latitude,
        longitude=d.longitude,
        region_natural=d.region_natural,
        description=d.description,
        cities=cities
    )
