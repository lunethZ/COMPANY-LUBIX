import io
import logging
import uuid

from fastapi.responses import StreamingResponse
from minio import Minio
from minio.error import S3Error

from app.Config import config

logger = logging.getLogger(__name__)

STORAGE_HINTS = {
    "StorageNotConfigured": "Completa las variables MINIO_* en Render.",
    "NoSuchBucket": "MINIO_BUCKET debe ser el nombre del bucket, no el ID.",
    "SignatureDoesNotMatch": "Revisa MINIO_ROOT_PASSWORD y MINIO_REGION.",
    "AuthorizationHeaderMalformed": "Revisa MINIO_REGION (B2: us-east-005).",
    "InvalidAccessKeyId": "Revisa MINIO_ROOT_USER (keyID).",
    "AccessDenied": "La Application Key necesita permiso Read and Write sobre el bucket.",
    "EndpointConnectionError": "Revisa MINIO_ENDPOINT y MINIO_SECURE.",
    "MaxRetryError": "Revisa MINIO_ENDPOINT y MINIO_SECURE.",
}

client = Minio(
    config.MINIO_ENDPOINT,
    access_key=config.MINIO_ROOT_USER,
    secret_key=config.MINIO_ROOT_PASSWORD,
    secure=config.MINIO_SECURE,
    region=config.MINIO_REGION or None,
)

bucket = config.MINIO_BUCKET


def _config_issues() -> list[str]:
    issues = []
    if not config.MINIO_ROOT_USER:
        issues.append("Falta MINIO_ROOT_USER (keyID/Access Key).")
    if not config.MINIO_ROOT_PASSWORD:
        issues.append("Falta MINIO_ROOT_PASSWORD (applicationKey/Secret Key).")
    endpoint = config.MINIO_ENDPOINT
    if config.ENVIRONMENT == "production" and endpoint in {
        "minio:9000",
        "localhost:9000",
        "127.0.0.1:9000",
    }:
        issues.append(
            "MINIO_ENDPOINT apunta al MinIO local; configura el host S3 del proveedor."
        )
    if "backblazeb2.com" in endpoint and not config.MINIO_REGION:
        issues.append("Backblaze B2 requiere MINIO_REGION (por ejemplo us-east-005).")
    return issues


def _storage_error(exc: Exception, unexpected: bool = False) -> dict:
    code = getattr(exc, "code", None) or exc.__class__.__name__
    message = getattr(exc, "message", None) or str(exc) or code
    if unexpected:
        logger.exception(
            "Fallo inesperado de almacenamiento bucket=%s endpoint=%s",
            bucket,
            config.MINIO_ENDPOINT,
        )
    else:
        logger.error(
            "Fallo de almacenamiento bucket=%s endpoint=%s code=%s: %s",
            bucket,
            config.MINIO_ENDPOINT,
            code,
            message,
        )
    payload = {"success": False, "code": code, "message": message}
    hint = STORAGE_HINTS.get(code)
    if hint:
        payload["hint"] = hint
    return payload


def _config_error() -> dict:
    issues = _config_issues()
    logger.error("Almacenamiento sin configurar: %s", "; ".join(issues))
    return {
        "success": False,
        "code": "StorageNotConfigured",
        "message": "; ".join(issues),
        "hint": STORAGE_HINTS["StorageNotConfigured"],
    }


def upload_error_detail(result: dict | None, default: str) -> str:
    """Convierte el resultado del storage en un detalle accionable para la API."""
    if not result:
        return default
    code = result.get("code")
    message = result.get("message")
    parts = [str(code)] if code else []
    if message and str(message) != str(code):
        parts.append(str(message))
    if not parts:
        return default
    detail = f"{default}: " + " - ".join(parts)
    hint = result.get("hint")
    if hint:
        detail = f"{detail}. {hint}"
    return detail


def storage_status() -> dict:
    """Estado del almacenamiento para diagnosticar Render sin exponer secretos."""
    issues = _config_issues()
    status = {
        "configured": not issues,
        "endpoint": config.MINIO_ENDPOINT,
        "bucket": bucket,
        "region": config.MINIO_REGION,
        "secure": config.MINIO_SECURE,
        "auto_create_bucket": config.MINIO_AUTO_CREATE_BUCKET,
        "credentials_present": bool(
            config.MINIO_ROOT_USER and config.MINIO_ROOT_PASSWORD
        ),
        "reachable": False,
        "bucket_exists": False,
        "error_code": None,
        "error_message": None,
        "hint": None,
    }
    if issues:
        status.update(
            error_code="StorageNotConfigured",
            error_message="; ".join(issues),
            hint=STORAGE_HINTS["StorageNotConfigured"],
        )
        return status

    try:
        exists = client.bucket_exists(bucket)
    except Exception as exc:
        payload = _storage_error(exc)
        status.update(
            error_code=payload["code"],
            error_message=payload["message"],
            hint=payload.get("hint"),
        )
        return status

    status["reachable"] = True
    status["bucket_exists"] = bool(exists)
    if not exists:
        status.update(
            error_code="NoSuchBucket",
            error_message=f"El bucket '{bucket}' no existe o la key no lo ve.",
            hint=STORAGE_HINTS["NoSuchBucket"],
        )
    return status


def _ensure_bucket():
    """Crea el bucket si hace falta, sin impedir el arranque de la API.

    En producción el almacenamiento puede ser un MinIO/S3 externo. Si no está
    disponible, la API debe seguir levantando y solo fallarán los endpoints de
    archivos; de lo contrario Render no podría iniciar el servicio.
    """
    if not config.MINIO_AUTO_CREATE_BUCKET:
        return

    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
    except Exception as exc:
        logger.warning(
            "No se pudo verificar el bucket '%s' en %s: %s",
            bucket,
            config.MINIO_ENDPOINT,
            exc,
        )


_ensure_bucket()

logger.info(
    "Almacenamiento: endpoint=%s bucket=%s region=%s secure=%s credenciales=%s auto_create=%s",
    config.MINIO_ENDPOINT,
    bucket,
    config.MINIO_REGION,
    config.MINIO_SECURE,
    "sí" if config.MINIO_ROOT_USER and config.MINIO_ROOT_PASSWORD else "no",
    config.MINIO_AUTO_CREATE_BUCKET,
)
for _issue in _config_issues():
    logger.warning("Almacenamiento: %s", _issue)


class NasService:

    def __init__(self, client, bucket):
        self.client = client
        self.bucket = bucket

    def upload_stream(self, file):
        if not file:
            return None
        issues = _config_issues()
        if issues:
            return _config_error()

        try:
            ext = file.filename.split(".")[-1]
            object_name = f"{uuid.uuid4()}.{ext}"

            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type,
            )

            return {
                "success": True,
                "object_name": object_name,
                "path": f"{self.bucket}/{object_name}",
            }

        except S3Error as exc:
            return _storage_error(exc)

        except Exception as exc:
            return _storage_error(exc, unexpected=True)

    def upload_file(self, file, PATH: str):
        if not file:
            return None
        issues = _config_issues()
        if issues:
            return _config_error()

        try:
            ext = file.filename.split(".")[-1]

            object_name = f"{PATH}{uuid.uuid4()}.{ext}"

            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type,
            )

            return {
                "success": True,
                "object_name": object_name,
                "path": f"{self.bucket}/{object_name}",
            }

        except S3Error as exc:
            return _storage_error(exc)

        except Exception as exc:
            return _storage_error(exc, unexpected=True)

    def download_stream(self, object_name: str):
        response = None
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            return StreamingResponse(
                io.BytesIO(data),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f"attachment; filename={object_name.split('/')[-1]}"
                },
            )
        except S3Error:
            raise
        finally:
            if response:
                try:
                    response.close()
                    response.release_conn()
                except Exception:
                    pass

    def get_presigned_url(self, object_name: str, expires: int = 3600):

        try:
            url = self.client.presigned_get_object(
                self.bucket, object_name, expires=expires
            )

            return {"success": True, "url": url}

        except S3Error as e:
            return {"success": False, "message": str(e)}

    def delete_file(self, object_name: str):

        try:
            self.client.remove_object(self.bucket, object_name)

            return {"success": True}

        except S3Error as e:
            return {"success": False, "message": str(e)}


subir = NasService(client, bucket)
