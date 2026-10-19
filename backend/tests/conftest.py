import sys
from unittest.mock import MagicMock, patch


# This runs before any test in the tests/ directory
# Replace the minio module in sys.modules with a mock before any NasService import
_minio_patcher = None


def pytest_configure(config):
    global _minio_patcher
    
    # Create a complete mock minio module
    mock_minio = MagicMock()
    
    # Mock Minio class and its methods
    mock_minio.Minio = MagicMock()
    mock_minio.Minio.bucket_exists = MagicMock(return_value=True)
    mock_minio.Minio.make_bucket = MagicMock()
    mock_minio.Minio.put_object = MagicMock(return_value=None)
    mock_minio.Minio.get_object = MagicMock(return_value=MagicMock(read=MagicMock(return_value=b"data")))
    mock_minio.Minio.presigned_get_object = MagicMock(return_value="https://presigned.url")
    mock_minio.Minio.remove_object = MagicMock(return_value=None)
    
    # Mock minio.error.S3Error
    mock_minio.error = MagicMock()
    mock_minio.error.S3Error = type("S3Error", (Exception,), {})
    
    # Replace minio in sys.modules BEFORE any other imports
    # We do this at module level in conftest.py which runs before test files
    if "minio" in sys.modules:
        del sys.modules["minio"]
    if "minio.error" in sys.modules:
        del sys.modules["minio.error"]
    
    sys.modules["minio"] = mock_minio
    sys.modules["minio.error"] = mock_minio.error