from typing import Any, Generic, TypeVar

from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, database: Session) -> None:
        self.database = database

    def create(self, **values: Any) -> ModelT:
        instance = self.model(**values)
        self.database.add(instance)
        self.database.flush()
        return instance

    def get_by_id(self, id_: Any) -> ModelT | None:
        return self.database.query(self.model).filter(self.model.id == id_).first()

    def get_by(self, **filters: Any) -> ModelT | None:
        return self.database.query(self.model).filter_by(**filters).first()

    def list(self, **filters: Any) -> list[ModelT]:
        query = self.database.query(self.model)
        if filters:
            query = query.filter_by(**filters)
        return query.all()

    def update(self, instance: ModelT, **values: Any) -> ModelT:
        for key, value in values.items():
            setattr(instance, key, value)
        self.database.flush()
        return instance

    def delete(self, instance: ModelT) -> None:
        self.database.delete(instance)
        self.database.flush()

    def count(self, **filters: Any) -> int:
        query = self.database.query(self.model)
        if filters:
            query = query.filter_by(**filters)
        return query.count()
