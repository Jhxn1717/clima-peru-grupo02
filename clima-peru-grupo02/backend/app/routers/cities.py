from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.peru_geo import City, Department
from app.schemas.city import CityResponse

router = APIRouter(prefix="/cities", tags=["Ciudades del Perú"])

@router.get("", response_model=List[CityResponse])
def get_cities(
    query: Optional[str] = Query(None, description="Búsqueda por nombre de ciudad o provincia"),
    department_id: Optional[int] = Query(None, description="Filtrar por ID de departamento"),
    region: Optional[str] = Query(None, description="Filtrar por región natural: Costa, Sierra, Selva"),
    featured_only: bool = Query(False, description="Mostrar solo ciudades destacadas"),
    db: Session = Depends(get_db)
):
    q = db.query(City).join(Department)

    if query:
        term = f"%{query.strip()}%"
        q = q.filter(City.name.ilike(term) | City.province.ilike(term) | Department.name.ilike(term))

    if department_id:
        q = q.filter(City.department_id == department_id)

    if region:
        q = q.filter(Department.region_natural.ilike(region))

    if featured_only:
        q = q.filter(City.is_featured == True)

    cities = q.order_by(City.is_featured.desc(), City.name.asc()).all()

    result = []
    for c in cities:
        c_dict = {
            "id": c.id,
            "department_id": c.department_id,
            "name": c.name,
            "province": c.province,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "altitude": c.altitude,
            "is_featured": c.is_featured,
            "is_capital": c.is_capital,
            "department_name": c.department.name if c.department else None,
            "region_natural": c.department.region_natural if c.department else None
        }
        result.append(CityResponse(**c_dict))
    return result

@router.get("/{city_id}", response_model=CityResponse)
def get_city_by_id(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada")

    return CityResponse(
        id=city.id,
        department_id=city.department_id,
        name=city.name,
        province=city.province,
        latitude=city.latitude,
        longitude=city.longitude,
        altitude=city.altitude,
        is_featured=city.is_featured,
        is_capital=city.is_capital,
        department_name=city.department.name if city.department else None,
        region_natural=city.department.region_natural if city.department else None
    )
