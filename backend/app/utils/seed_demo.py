"""Seed de datos demo para visualizar la app móvil.

Ejecutar dentro del contenedor backend:
    docker compose exec backend python app/utils/seed_demo.py

Credenciales demo:
    Usuario cliente:  cliente@lubix.com  /  Cliente123!
    Empresa:          tienda@lubix.com   /  Tienda123!   (empresa aprobada)
"""
import uuid
from sqlalchemy.orm import Session
from app.database.Connection import SessionLocal
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.models.ModelCompany import Company
from app.models.ModelProduct import Product, Catalog
from app.utils.Security import hash_password


def get_or_create_role(database: Session, name: str) -> Role:
    role = database.query(Role).filter(Role.name == name).first()
    if not role:
        role = Role(name=name)
        database.add(role)
        database.flush()
    return role


def ensure_user(database: Session, email: str, name: str, tell: str, password: str, role_name: str) -> Users:
    user = database.query(Users).filter(Users.email == email).first()
    if not user:
        role = get_or_create_role(database, role_name)
        user = Users(
            id=uuid.uuid4(),
            fullName=name,
            email=email,
            tell=tell,
            hashed_password=hash_password(password),
            role_id=role.id,
            verified=True,
        )
        database.add(user)
        database.flush()
    return user


def get_or_create_catalogs(database: Session):
    names = [
        "Celulares", "Computadores", "Audio", "Wearables",
        "Gaming", "Televisores", "Cámaras", "Accesorios",
    ]
    catalogs = {}
    for name in names:
        catalog = database.query(Catalog).filter(Catalog.name == name).first()
        if not catalog:
            catalog = Catalog(name=name)
            database.add(catalog)
            database.flush()
        catalogs[name] = catalog
    return catalogs


PRODUCT_LIST = [
    # (nombre, catalogo, precio, stock, descuento%, descripcion, specs)
    ("Smartphone Galaxy A55", "Celulares", 1899900, 25, 10,
     "Smartphone de gama media con pantalla AMOLED 6.6\", 8 GB de RAM y cámara triple de 50 MP.",
     {"Pantalla": "6.6\" AMOLED", "RAM": "8 GB", "Almacenamiento": "256 GB", "Cámara": "50 MP"}),
    ("iPhone 15 128GB", "Celulares", 4899900, 10, 0,
     "iPhone 15 con chip A16 Bionic, Dynamic Island y cámara principal de 48 MP.",
     {"Pantalla": "6.1\" OLED", "Chip": "A16 Bionic", "Almacenamiento": "128 GB", "Cámara": "48 MP"}),
    ("Xiaomi Redmi Note 13", "Celulares", 899900, 40, 15,
     "Redmi Note 13 con pantalla 120 Hz, batería de 5000 mAh y carga rápida de 33 W.",
     {"Pantalla": "6.67\" 120 Hz", "RAM": "8 GB", "Batería": "5000 mAh", "Cámara": "108 MP"}),
    ("Laptop Lenovo IdeaPad 15", "Computadores", 2799900, 15, 5,
     "Portátil con procesador Ryzen 7, 16 GB de RAM y SSD de 512 GB, ideal para estudios y trabajo.",
     {"Procesador": "Ryzen 7 7730U", "RAM": "16 GB", "Almacenamiento": "512 GB SSD", "Pantalla": "15.6\" Full HD"}),
    ("Computador All-in-One HP", "Computadores", 3499900, 8, 0,
     "PC todo-en-uno con pantalla táctil de 23.8\", 16 GB de RAM y disco SSD de 1 TB.",
     {"Pantalla": "23.8\" táctil", "RAM": "16 GB", "Almacenamiento": "1 TB SSD", "Procesador": "Core i5"}),
    ("MacBook Air M2", "Computadores", 6999900, 6, 0,
     "MacBook Air con chip M2, 8 GB de RAM unificada y 256 GB de almacenamiento SSD.",
     {"Chip": "Apple M2", "RAM": "8 GB", "Almacenamiento": "256 GB SSD", "Pantalla": "13.6\" Liquid Retina"}),
    ("Audífonos Bluetooth JBL", "Audio", 249900, 60, 20,
     "Audífonos over-ear inalámbricos con cancelación de ruido y 40 horas de batería.",
     {"Tipo": "Over-ear", "Batería": "40 horas", "Bluetooth": "5.3", "Cancelación": "Sí"}),
    ("Parlante Bose SoundLink", "Audio", 1299900, 20, 0,
     "Parlante portátil con sonido 360°, resistencia al agua IP67 y 16 horas de batería.",
     {"Batería": "16 horas", "IP": "IP67", "Potencia": "30 W", "Bluetooth": "5.0"}),
    ("Smartwatch Apple Watch SE", "Wearables", 1699900, 18, 5,
     "Smartwatch con pantalla Retina, monitoreo de ritmo cardíaco y GPS.",
     {"Pantalla": "Retina", "GPS": "Sí", "Resistencia": "Agua 50m", "Batería": "18 horas"}),
    ("Reloj Huawei Watch Fit 3", "Wearables", 649900, 30, 25,
     "Smartwatch ligero con pantalla AMOLED, más de 100 modos deportivos y 10 días de batería.",
     {"Pantalla": "AMOLED", "Batería": "10 días", "Modos": "100+", "GPS": "Sí"}),
    ("Consola PlayStation 5 Slim", "Gaming", 2999900, 9, 0,
     "Consola PS5 con SSD ultrarrápido, gráficos en 4K y mando DualSense incluido.",
     {"Resolución": "4K", "Almacenamiento": "1 TB SSD", "Mando": "DualSense"}),
    ("Control inalámbrico Xbox", "Gaming", 269900, 35, 10,
     "Control Xbox inalámbrico con conexión Bluetooth y textura ergonómica.",
     {"Conexión": "Bluetooth/USB-C", "Batería": "2xAA", "Compatibilidad": "PC, Xbox, Móvil"}),
    ('Televisor Samsung 55" Crystal 4K', "Televisores", 2149900, 14, 12,
     "Smart TV 4K UHD con panel Crystal Processor 4K y sistema Tizen.",
     {"Pantalla": "55\" 4K", "Sistema": "Tizen", "HDR": "HDR10+", "Conectividad": "Wi-Fi + BT"}),
    ('Smart TV LG 50" UHD', "Televisores", 1599900, 22, 0,
     "Smart TV 50 pulgadas 4K UHD con webOS 23 y altavoces de 20 W.",
     {"Pantalla": "50\" 4K", "Sistema": "webOS 23", "Altavoces": "20 W", "Conectividad": "Wi-Fi + BT"}),
    ("Cámara Canon EOS R50", "Cámaras", 3999900, 12, 0,
     "Cámara sin espejo con sensor APS-C de 24.2 MP, enfoque automático por IA y video 4K.",
     {"Sensor": "APS-C 24.2 MP", "Video": "4K 30fps", "Enfoque": "IA Dual Pixel"}),
    ("Teléfono inalámbrico Panasonic", "Accesorios", 149900, 45, 0,
     "Teléfono inalámbrico DECT con contestador digital y agenda de 50 contactos.",
     {"Tipo": "DECT", "Contestador": "Sí", "Autonomía": "15 horas"}),
]


def seed_demo(database: Session):
    catalogs = get_or_create_catalogs(database)

    company_user = ensure_user(
        database, "tienda@lubix.com", "Tech Store Lubix", "3000000001",
        "Tienda123!", "company",
    )
    company = database.query(Company).filter(Company.user_id == company_user.id).first()
    if not company:
        company = Company(
            nameCompany="Tech Store Lubix",
            addressCompany="Calle 100 # 15-23, Bogotá",
            CompanyNIT="900123456",
            CompanyNITDV="7",
            user_id=company_user.id,
        )
        database.add(company)
        database.flush()

    ensure_user(
        database, "cliente@lubix.com", "Cliente Demo Lubix", "3000000002",
        "Cliente123!", "user",
    )

    created = 0
    existing = database.query(Product).count()
    if existing > 0:
        print(f"Ya existen {existing} productos. Seed demo omitido.")
        return

    for name, catalog_name, price, stock, discount, descripcion, specs in PRODUCT_LIST:
        product = Product(
            id=uuid.uuid4(),
            name=name,
            price=price,
            images=[],
            status="active",
            discount_enable=discount > 0,
            discount_value=discount,
            stock=stock,
            descripcion=descripcion,
            technical_spec=specs,
            company_id=company.id,
            catalog_id=catalogs[catalog_name].id,
        )
        database.add(product)
        created += 1

    database.commit()
    print(f"Seed demo completado: {created} productos, 8 catálogos.")
    print("Cliente:  cliente@lubix.com / Cliente123!")
    print("Empresa:  tienda@lubix.com  / Tienda123!")


if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed_demo(session)
    finally:
        session.close()