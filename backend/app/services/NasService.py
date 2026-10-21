from minio import Minio
from minio.error import S3Error
from app.Config import config

from fastapi.responses import StreamingResponse
import io
import uuid

client = Minio(
    "minio:9000",
    access_key=config.MINIO_ROOT_USER,
    secret_key=config.MINIO_ROOT_PASSWORD,
    secure=False,
)

bucket = "uploads"

if not client.bucket_exists(bucket):
    client.make_bucket(bucket)


class NasService:

    def __init__(self, client, bucket):
        self.client = client
        self.bucket = bucket

    def upload_stream(self, file):
        try:
            if not file:
                return None

            ext = file.filename.split(".")[-1]
            object_name = f"{uuid.uuid4()}.{ext}"

            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type
            )

            return {
                "success": True,
                "object_name": object_name,
                "path": f"{self.bucket}/{object_name}"
            }

        except S3Error as e:
            return {"success": False, "message": str(e)}

        except Exception as e:
            return {"success": False, "message": str(e)}

    def upload_file(self, file, PATH: str):
        try:
            if not file:
                return None

            ext = file.filename.split(".")[-1]

            object_name = (
                f"{PATH}"
                f"{uuid.uuid4()}.{ext}"
            )

            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type
            )

            return {
                "success": True,
                "object_name": object_name,
                "path": f"{self.bucket}/{object_name}"
            }

        except S3Error as e:
            return {"success": False, "message": str(e)}

        except Exception as e:
            return {"success": False, "message": str(e)}

    def download_stream(self, object_name: str):
        response = None
        try:
            response = self.client.get_object(
                self.bucket,
                object_name
            )
            data = response.read()
            return StreamingResponse(
                io.BytesIO(data),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f"attachment; filename={object_name.split('/')[-1]}"
                }
            )
        except S3Error as e:
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
                self.bucket,
                object_name,
                expires=expires
            )

            return {
                "success": True,
                "url": url
            }

        except S3Error as e:
            return {"success": False, "message": str(e)}

    def delete_file(self, object_name: str):

        try:
            self.client.remove_object(
                self.bucket,
                object_name
            )

            return {"success": True}

        except S3Error as e:
            return {"success": False, "message": str(e)}


subir = NasService(client, bucket)