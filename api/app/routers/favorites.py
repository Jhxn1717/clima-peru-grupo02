from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.peru_geo import City
from app.models.favorite import FavoriteCity
from app.schemas.city import CityResponse

router = APIRouter(prefix="/favorites", tags=["Ciudades Favoritas"])

@router.get("", response_model=List[CityResponse])
def get_favorites(db: Session = Depends(get_db)):
    favs = db.query(FavoriteCity).join(City).all()
    result = []
    for f in favs:
        c = f.city
        result.append(CityResponse(
            id=c.id,
            department_id=c.department_id,
            name=c.name,
            province=c.province,
            latitude=c.latitude,
            longitude=c.longitude,
            altitude=c.altitude,
            is_featured=c.is_featured,
            is_capital=c.is_capital,
            department_name=c.department.name if c.department else None,
            region_natural=c.department.region_natural if c.department else None
        ))
    return result

@router.post("/{city_id}")
def add_favorite(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada")

    existing = db.query(FavoriteCity).filter(FavoriteCity.city_id == city_id).first()
    if not existing:
        fav = FavoriteCity(city_id=city_id)
        db.add(fav)
        db.commit()
    return {"message": f"{city.name} agregada a favoritos"}

@router.delete("/{city_id}")
def remove_favorite(city_id: int, db: Session = Depends(get_db)):
    existing = db.query(FavoriteCity).filter(FavoriteCity.city_id == city_id).first()
    if existing:
        db.delete(existing)
        db.commit()
    return {"message": "Ciudad eliminada de favoritos"}
