from sqlalchemy.orm import Session
from app.models.peru_geo import Department, City
from app.database import engine, Base

DEPARTMENTS_DATA = [
    {"name": "Amazonas", "code": "AMA", "capital": "Chachapoyas", "latitude": -6.2317, "longitude": -77.8690, "region_natural": "Selva", "description": "Departamento del nororiente peruano, caracterizado por sus bosques de neblina y la fortaleza de Kuélap."},
    {"name": "Áncash", "code": "ANC", "capital": "Huaraz", "latitude": -9.5278, "longitude": -77.5278, "region_natural": "Sierra", "description": "Hogar del Huascarán, nevados imponentes y valles interandinos."},
    {"name": "Apurímac", "code": "APU", "capital": "Abancay", "latitude": -13.6339, "longitude": -72.8814, "region_natural": "Sierra", "description": "Ubicado en la sierra sur, con cañones profundos y riqueza minera y agrícola."},
    {"name": "Arequipa", "code": "ARE", "capital": "Arequipa", "latitude": -16.4090, "longitude": -71.5375, "region_natural": "Sierra", "description": "La Ciudad Blanca, al pie del volcán Misti y el Cañón del Colca."},
    {"name": "Ayacucho", "code": "AYA", "capital": "Ayacucho", "latitude": -13.1588, "longitude": -74.2239, "region_natural": "Sierra", "description": "Famosa por sus 33 iglesias coloniales, retablos y rica historia libertadora."},
    {"name": "Cajamarca", "code": "CAJ", "capital": "Cajamarca", "latitude": -7.1638, "longitude": -78.5128, "region_natural": "Sierra", "description": "Tierra de los Baños del Inca, cuenca lechera y paisajes verdes andinos."},
    {"name": "Callao", "code": "CAL", "capital": "Callao", "latitude": -12.0565, "longitude": -77.1181, "region_natural": "Costa", "description": "Primer puerto marítimo del Perú y provincia constitucional."},
    {"name": "Cusco", "code": "CUS", "capital": "Cusco", "latitude": -13.5319, "longitude": -71.9675, "region_natural": "Sierra", "description": "Capital histórica del Imperio Incaico y puerta de entrada a Machu Picchu."},
    {"name": "Huancavelica", "code": "HUV", "capital": "Huancavelica", "latitude": -12.7864, "longitude": -74.9727, "region_natural": "Sierra", "description": "Zona altoandina de minas históricas de azogue y bellos paisajes."},
    {"name": "Huánuco", "code": "HUC", "capital": "Huánuco", "latitude": -9.9306, "longitude": -76.2422, "region_natural": "Sierra", "description": "Ciudad de clima templado primaveral y templos precerámicos como Kotosh."},
    {"name": "Ica", "code": "ICA", "capital": "Ica", "latitude": -14.0678, "longitude": -75.7286, "region_natural": "Costa", "description": "Desiertos, viñedos de pisco de calidad, el oasis de Huacachina y Líneas de Nazca."},
    {"name": "Junín", "code": "JUN", "capital": "Huancayo", "latitude": -12.0651, "longitude": -75.2049, "region_natural": "Sierra", "description": "El fértil Valle del Mantaro y la puerta de acceso a la selva central."},
    {"name": "La Libertad", "code": "LAL", "capital": "Trujillo", "latitude": -8.1160, "longitude": -79.0300, "region_natural": "Costa", "description": "Capital de la marinera, Chan Chan y playas de surf como Huanchaco."},
    {"name": "Lambayeque", "code": "LAM", "capital": "Chiclayo", "latitude": -6.7714, "longitude": -79.8409, "region_natural": "Costa", "description": "Cuna del Señor de Sipán, pirámides de Túcume y rica gastronomía norteña."},
    {"name": "Lima", "code": "LIM", "capital": "Lima", "latitude": -12.0464, "longitude": -77.0428, "region_natural": "Costa", "description": "Capital de la República del Perú y centro económico, cultural y gastronómico."},
    {"name": "Loreto", "code": "LOR", "capital": "Iquitos", "latitude": -3.7491, "longitude": -73.2538, "region_natural": "Selva", "description": "El departamento más extenso del Perú, corazón de la Amazonía y el Río Amazonas."},
    {"name": "Madre de Dios", "code": "MDD", "capital": "Puerto Maldonado", "latitude": -12.5933, "longitude": -69.1891, "region_natural": "Selva", "description": "Capital de la biodiversidad, con el Parque Nacional del Manu y Tambopata."},
    {"name": "Moquegua", "code": "MOQ", "capital": "Moquegua", "latitude": -17.1983, "longitude": -70.9356, "region_natural": "Costa", "description": "Valle apacible productor de uva, palta y minerales en el sur del país."},
    {"name": "Pasco", "code": "PAS", "capital": "Cerro de Pasco", "latitude": -10.6833, "longitude": -76.2500, "region_natural": "Sierra", "description": "Ciudad minera más alta del mundo y reserva de biosfera Oxapampa-Asháninka."},
    {"name": "Piura", "code": "PIU", "capital": "Piura", "latitude": -5.1945, "longitude": -80.6328, "region_natural": "Costa", "description": "Tierra de sol eterno, hermosas playas como Máncora y producción agrícola."},
    {"name": "Puno", "code": "PUN", "capital": "Puno", "latitude": -15.8402, "longitude": -70.0219, "region_natural": "Sierra", "description": "A orillas del Lago Titicaca, el lago navegable más alto del mundo y capital del folklore."},
    {"name": "San Martín", "code": "SAM", "capital": "Moyobamba", "latitude": -6.0342, "longitude": -76.9717, "region_natural": "Selva", "description": "La ciudad de las orquídeas y Tarapoto, centro vibrante de la selva alta."},
    {"name": "Tacna", "code": "TAC", "capital": "Tacna", "latitude": -18.0146, "longitude": -70.2536, "region_natural": "Costa", "description": "La Ciudad Heroica en la frontera sur de Perú, con gran comercio y sol."},
    {"name": "Tumbes", "code": "TUM", "capital": "Tumbes", "latitude": -3.5669, "longitude": -80.4515, "region_natural": "Costa", "description": "Manglares únicos, playas de aguas cálidas y cocina marina exquisita."},
    {"name": "Ucayali", "code": "UCA", "capital": "Pucallpa", "latitude": -8.3791, "longitude": -74.5539, "region_natural": "Selva", "description": "Puerto fluvial amazónico a orillas del río Ucayali y la Laguna de Yarinacocha."}
]

CITIES_DATA = [
    # Lima & Callao
    {"name": "Lima", "dept_code": "LIM", "province": "Lima", "latitude": -12.0464, "longitude": -77.0428, "altitude": 154, "is_featured": True, "is_capital": True},
    {"name": "Callao", "dept_code": "CAL", "province": "Callao", "latitude": -12.0565, "longitude": -77.1181, "altitude": 5, "is_featured": True, "is_capital": True},
    {"name": "Miraflores", "dept_code": "LIM", "province": "Lima", "latitude": -12.1219, "longitude": -77.0297, "altitude": 79, "is_featured": False, "is_capital": False},
    {"name": "San Isidro", "dept_code": "LIM", "province": "Lima", "latitude": -12.0977, "longitude": -77.0347, "altitude": 109, "is_featured": False, "is_capital": False},
    {"name": "Huacho", "dept_code": "LIM", "province": "Huaura", "latitude": -11.1067, "longitude": -77.6050, "altitude": 30, "is_featured": False, "is_capital": False},
    {"name": "Cañete", "dept_code": "LIM", "province": "Cañete", "latitude": -13.0769, "longitude": -76.3861, "altitude": 144, "is_featured": False, "is_capital": False},

    # Arequipa
    {"name": "Arequipa", "dept_code": "ARE", "province": "Arequipa", "latitude": -16.4090, "longitude": -71.5375, "altitude": 2325, "is_featured": True, "is_capital": True},
    {"name": "Camaná", "dept_code": "ARE", "province": "Camaná", "latitude": -16.6231, "longitude": -72.7111, "altitude": 15, "is_featured": False, "is_capital": False},
    {"name": "Chivay (Colca)", "dept_code": "ARE", "province": "Caylloma", "latitude": -15.6383, "longitude": -71.6011, "altitude": 3635, "is_featured": False, "is_capital": False},

    # Cusco
    {"name": "Cusco", "dept_code": "CUS", "province": "Cusco", "latitude": -13.5319, "longitude": -71.9675, "altitude": 3399, "is_featured": True, "is_capital": True},
    {"name": "Urubamba", "dept_code": "CUS", "province": "Urubamba", "latitude": -13.3044, "longitude": -72.1158, "altitude": 2871, "is_featured": False, "is_capital": False},
    {"name": "Sicuani", "dept_code": "CUS", "province": "Canchis", "latitude": -14.2694, "longitude": -71.2261, "altitude": 3550, "is_featured": False, "is_capital": False},

    # Piura
    {"name": "Piura", "dept_code": "PIU", "province": "Piura", "latitude": -5.1945, "longitude": -80.6328, "altitude": 29, "is_featured": True, "is_capital": True},
    {"name": "Sullana", "dept_code": "PIU", "province": "Sullana", "latitude": -4.9039, "longitude": -80.6853, "altitude": 60, "is_featured": False, "is_capital": False},
    {"name": "Talara (Máncora)", "dept_code": "PIU", "province": "Talara", "latitude": -4.5772, "longitude": -81.2719, "altitude": 15, "is_featured": False, "is_capital": False},

    # La Libertad
    {"name": "Trujillo", "dept_code": "LAL", "province": "Trujillo", "latitude": -8.1160, "longitude": -79.0300, "altitude": 34, "is_featured": True, "is_capital": True},
    {"name": "Huamachuco", "dept_code": "LAL", "province": "Sánchez Carrión", "latitude": -7.8142, "longitude": -78.0489, "altitude": 3169, "is_featured": False, "is_capital": False},

    # Lambayeque
    {"name": "Chiclayo", "dept_code": "LAM", "province": "Chiclayo", "latitude": -6.7714, "longitude": -79.8409, "altitude": 27, "is_featured": True, "is_capital": True},
    {"name": "Lambayeque", "dept_code": "LAM", "province": "Lambayeque", "latitude": -6.7028, "longitude": -79.9042, "altitude": 18, "is_featured": False, "is_capital": False},

    # Loreto
    {"name": "Iquitos", "dept_code": "LOR", "province": "Maynas", "latitude": -3.7491, "longitude": -73.2538, "altitude": 106, "is_featured": True, "is_capital": True},
    {"name": "Yurimaguas", "dept_code": "LOR", "province": "Alto Amazonas", "latitude": -5.9018, "longitude": -76.1082, "altitude": 182, "is_featured": False, "is_capital": False},

    # Junín
    {"name": "Huancayo", "dept_code": "JUN", "province": "Huancayo", "latitude": -12.0651, "longitude": -75.2049, "altitude": 3259, "is_featured": True, "is_capital": True},
    {"name": "Tarma", "dept_code": "JUN", "province": "Tarma", "latitude": -11.4190, "longitude": -75.6897, "altitude": 3053, "is_featured": False, "is_capital": False},
    {"name": "La Merced (Chanchamayo)", "dept_code": "JUN", "province": "Chanchamayo", "latitude": -11.0558, "longitude": -75.3283, "altitude": 751, "is_featured": False, "is_capital": False},

    # Tacna
    {"name": "Tacna", "dept_code": "TAC", "province": "Tacna", "latitude": -18.0146, "longitude": -70.2536, "altitude": 562, "is_featured": True, "is_capital": True},

    # Puno
    {"name": "Puno", "dept_code": "PUN", "province": "Puno", "latitude": -15.8402, "longitude": -70.0219, "altitude": 3827, "is_featured": True, "is_capital": True},
    {"name": "Juliaca", "dept_code": "PUN", "province": "San Román", "latitude": -15.4988, "longitude": -70.1332, "altitude": 3825, "is_featured": True, "is_capital": False},

    # Cajamarca
    {"name": "Cajamarca", "dept_code": "CAJ", "province": "Cajamarca", "latitude": -7.1638, "longitude": -78.5128, "altitude": 2750, "is_featured": True, "is_capital": True},
    {"name": "Jaén", "dept_code": "CAJ", "province": "Jaén", "latitude": -5.7078, "longitude": -78.8078, "altitude": 729, "is_featured": False, "is_capital": False},

    # Ayacucho
    {"name": "Ayacucho", "dept_code": "AYA", "province": "Huamanga", "latitude": -13.1588, "longitude": -74.2239, "altitude": 2761, "is_featured": True, "is_capital": True},

    # Áncash
    {"name": "Huaraz", "dept_code": "ANC", "province": "Huaraz", "latitude": -9.5278, "longitude": -77.5278, "altitude": 3052, "is_featured": True, "is_capital": True},
    {"name": "Chimbote", "dept_code": "ANC", "province": "Santa", "latitude": -9.0745, "longitude": -78.5936, "altitude": 4, "is_featured": True, "is_capital": False},

    # Tumbes
    {"name": "Tumbes", "dept_code": "TUM", "province": "Tumbes", "latitude": -3.5669, "longitude": -80.4515, "altitude": 6, "is_featured": True, "is_capital": True},
    {"name": "Zorritos", "dept_code": "TUM", "province": "Contralmirante Villar", "latitude": -3.6806, "longitude": -80.6783, "altitude": 6, "is_featured": False, "is_capital": False},

    # Madre de Dios
    {"name": "Puerto Maldonado", "dept_code": "MDD", "province": "Tambopata", "latitude": -12.5933, "longitude": -69.1891, "altitude": 183, "is_featured": True, "is_capital": True},

    # San Martín
    {"name": "Tarapoto", "dept_code": "SAM", "province": "San Martín", "latitude": -6.4869, "longitude": -76.3686, "altitude": 333, "is_featured": True, "is_capital": False},
    {"name": "Moyobamba", "dept_code": "SAM", "province": "Moyobamba", "latitude": -6.0342, "longitude": -76.9717, "altitude": 860, "is_featured": False, "is_capital": True},

    # Ucayali
    {"name": "Pucallpa", "dept_code": "UCA", "province": "Coronel Portillo", "latitude": -8.3791, "longitude": -74.5539, "altitude": 154, "is_featured": True, "is_capital": True},

    # Ica
    {"name": "Ica", "dept_code": "ICA", "province": "Ica", "latitude": -14.0678, "longitude": -75.7286, "altitude": 406, "is_featured": True, "is_capital": True},
    {"name": "Chincha Alta", "dept_code": "ICA", "province": "Chincha", "latitude": -13.4167, "longitude": -76.1333, "altitude": 97, "is_featured": False, "is_capital": False},
    {"name": "Nazca", "dept_code": "ICA", "province": "Nazca", "latitude": -14.8289, "longitude": -74.9436, "altitude": 588, "is_featured": False, "is_capital": False},

    # Huánuco
    {"name": "Huánuco", "dept_code": "HUC", "province": "Huánuco", "latitude": -9.9306, "longitude": -76.2422, "altitude": 1894, "is_featured": True, "is_capital": True},
    {"name": "Tingo María", "dept_code": "HUC", "province": "Leoncio Prado", "latitude": -9.2978, "longitude": -75.9986, "altitude": 660, "is_featured": False, "is_capital": False},

    # Moquegua
    {"name": "Moquegua", "dept_code": "MOQ", "province": "Mariscal Nieto", "latitude": -17.1983, "longitude": -70.9356, "altitude": 1410, "is_featured": True, "is_capital": True},
    {"name": "Ilo", "dept_code": "MOQ", "province": "Ilo", "latitude": -17.6394, "longitude": -71.3375, "altitude": 15, "is_featured": False, "is_capital": False},

    # Amazonas
    {"name": "Chachapoyas", "dept_code": "AMA", "province": "Chachapoyas", "latitude": -6.2317, "longitude": -77.8690, "altitude": 2335, "is_featured": True, "is_capital": True},

    # Apurímac
    {"name": "Abancay", "dept_code": "APU", "province": "Abancay", "latitude": -13.6339, "longitude": -72.8814, "altitude": 2378, "is_featured": True, "is_capital": True},
    {"name": "Andahuaylas", "dept_code": "APU", "province": "Andahuaylas", "latitude": -13.6556, "longitude": -73.3872, "altitude": 2926, "is_featured": False, "is_capital": False},

    # Huancavelica
    {"name": "Huancavelica", "dept_code": "HUV", "province": "Huancavelica", "latitude": -12.7864, "longitude": -74.9727, "altitude": 3676, "is_featured": True, "is_capital": True},

    # Pasco
    {"name": "Cerro de Pasco", "dept_code": "PAS", "province": "Pasco", "latitude": -10.6833, "longitude": -76.2500, "altitude": 4338, "is_featured": True, "is_capital": True},
    {"name": "Oxapampa", "dept_code": "PAS", "province": "Oxapampa", "latitude": -10.5775, "longitude": -75.4017, "altitude": 1814, "is_featured": False, "is_capital": False}
]

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    try:
        # Check if already seeded
        dept_count = db.query(Department).count()
        if dept_count == 0:
            print("Poblando 25 departamentos del Perú...")
            dept_map = {}
            for d in DEPARTMENTS_DATA:
                dept = Department(
                    name=d["name"],
                    code=d["code"],
                    capital=d["capital"],
                    latitude=d["latitude"],
                    longitude=d["longitude"],
                    region_natural=d["region_natural"],
                    description=d.get("description", "")
                )
                db.add(dept)
                db.flush()
                dept_map[d["code"]] = dept.id

            print("Poblando ciudades del Perú...")
            for c in CITIES_DATA:
                dept_id = dept_map.get(c["dept_code"])
                if dept_id:
                    city = City(
                        department_id=dept_id,
                        name=c["name"],
                        province=c.get("province", ""),
                        latitude=c["latitude"],
                        longitude=c["longitude"],
                        altitude=c["altitude"],
                        is_featured=c.get("is_featured", False),
                        is_capital=c.get("is_capital", False)
                    )
                    db.add(city)
            db.commit()
            print("Datos geográficos del Perú inicializados con éxito.")
        else:
            print("Base de datos ya cuenta con datos del Perú.")
    except Exception as e:
        db.rollback()
        print(f"Error sembrando datos del Perú: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
