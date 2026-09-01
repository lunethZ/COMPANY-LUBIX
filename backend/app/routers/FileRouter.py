from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.NasService import subir
import mimetypes

router = APIRouter(prefix="/files", tags=["files"])

@router.get("/{file_path:path}")
def get_file(file_path: str):
    try:
        ctype, _ = mimetypes.guess_type(file_path)
        if not ctype:
            ctype = "application/octet-stream"
        response = subir.client.get_object("uploads", file_path)
        data = response.read()
        response.close()
        response.release_conn()
        return StreamingResponse(
            iter([data]),
            media_type=ctype,
            headers={"Content-Disposition": f'inline; filename="{file_path.split("/")[-1]}"'},
        )
    except Exception as e:
        try:
            return subir.download_stream(file_path)
        except Exception:
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
