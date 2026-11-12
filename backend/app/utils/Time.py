# Utilidades centralizadas para manejar fechas y horas en UTC.
# Evita el uso de `datetime.utcnow`, que está obsoleto desde Python 3.12
# y devuelve fechas "naive" (sin zona horaria).
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Fecha/hora actual en UTC con zona horaria (aware).

    Usar para payloads JWT, cálculos y comparaciones en memoria.
    """
    return datetime.now(timezone.utc)


def utcnow_naive() -> datetime:
    """Fecha/hora actual en UTC sin zona horaria (naive).

    Usar para columnas `DateTime` de SQLAlchemy que no declaran
    `timezone=True`, de modo que lo almacenado siga siendo UTC "de reloj"
    y sea comparable con los valores leídos de la base de datos.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
