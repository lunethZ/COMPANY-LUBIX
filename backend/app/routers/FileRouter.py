from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.NasService import subir
import mimetypes

router = APIRouter(prefix="/files", tags=["files"])

NOT_FOUND_CODES = {"NoSuchKey", "NoSuchBucket", "NoSuchObject", "NoSuchVersion"}


def _is_not_found(exc: Exception) -> bool:
    return getattr(exc, "code", None) in NOT_FOUND_CODES


@router.get("/{file_path:path}")
def get_file(file_path: str):
    response = None
    try:
        ctype, _ = mimetypes.guess_type(file_path)
        if not ctype:
            ctype = "application/octet-stream"
        response = subir.client.get_object("uploads", file_path)
        data = response.read()
        return StreamingResponse(
            iter([data]),
            media_type=ctype,
            headers={
                "Content-Disposition": f'inline; filename="{file_path.split("/")[-1]}"',
                "Cache-Control": "public, max-age=86400",
            },
        )
    except Exception as primer_error:
        try:
            return subir.download_stream(file_path)
        except Exception as segundo_error:
            if _is_not_found(primer_error) and _is_not_found(segundo_error):
                raise HTTPException(status_code=404, detail="Archivo no encontrado")
            raise HTTPException(status_code=503, detail="Almacenamiento no disponible")
    finally:
        if response:
            try:
                response.close()
                response.release_conn()
            except Exception:
                pass
