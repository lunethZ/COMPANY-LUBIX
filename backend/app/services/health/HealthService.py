from dataclasses import dataclass
from typing import Protocol


class DatabaseProbe(Protocol):
    def __call__(self) -> bool: ...


@dataclass(frozen=True)
class HealthReport:
    status: str
    service: str
    environment: str
    database: str

    def to_dict(self) -> dict[str, str]:
        return {
            "status": self.status,
            "service": self.service,
            "environment": self.environment,
            "database": self.database,
        }


class HealthService:
    def __init__(
        self,
        database_probe: DatabaseProbe,
        environment: str,
        service: str = "lubix-api",
    ) -> None:
        self._database_probe = database_probe
        self._environment = environment
        self._service = service

    def check(self) -> HealthReport:
        database_ok = bool(self._database_probe())
        status = "ok" if database_ok else "unavailable"
        database = "ok" if database_ok else "error"
        return HealthReport(
            status=status,
            service=self._service,
            environment=self._environment,
            database=database,
        )
