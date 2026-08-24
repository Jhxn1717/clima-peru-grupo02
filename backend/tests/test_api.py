import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.seed.seed_data import init_db_and_seed

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db_and_seed()

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Online"

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_departments():
    response = client.get("/api/departments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 24
    dept_names = [d["name"] for d in data]
    assert "Lima" in dept_names
    assert "Cusco" in dept_names
    assert "Arequipa" in dept_names
    assert "Loreto" in dept_names

def test_get_cities():
    response = client.get("/api/cities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 20
    city_names = [c["name"] for c in data]
    assert "Lima" in city_names
    assert "Huancayo" in city_names

def test_search_city():
    response = client.get("/api/cities?query=cusco")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Cusco"

def test_weather_forecast():
    response = client.get("/api/weather/forecast?city_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "current" in data
    assert "hourly" in data
    assert "daily" in data
    assert "temperature" in data["current"]
    assert "uv_index" in data["current"]
    assert len(data["hourly"]) >= 12
    assert len(data["daily"]) >= 5

def test_alerts():
    response = client.get("/api/alerts?city_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "total_alerts" in data

def test_compare_cities():
    response = client.get("/api/compare?city_ids=1,7")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["cities"]) == 2

def test_history():
    response = client.get("/api/history?city_id=1&start_date=2026-07-01&end_date=2026-07-15&variable=temperature")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "data" in data
    assert len(data["data"]) >= 10
