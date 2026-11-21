#!/usr/bin/env python3
"""Respaldo cifrado y restauración verificable de PostgreSQL para LUBIX.

Comandos:
  backup   Volcado lógico (pg_dump -Fc), cifrado simétrico con GPG (AES-256),
           manifiesto con checksums y conteos por tabla, y rotación por retención.
  restore  Descifra y restaura un respaldo en un contenedor, servicio Compose o DSN.
  verify   Prueba real de restauración: levanta un PostgreSQL desechable,
           restaura el respaldo ahí y compara el contenido contra el manifiesto.
  decrypt  Descifra un respaldo a un archivo plano (uso manual/excepcional).
  list     Lista los respaldos disponibles.

Solo usa la biblioteca estándar de Python y el binario `gpg`.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import json
import os
import platform
import re
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

try:  # Python 3.11+
    from datetime import UTC  # type: ignore[attr-defined]

    def _utcnow() -> datetime:
        return datetime.now(UTC)

except ImportError:  # pragma: no cover - compatibilidad con 3.9/3.10
    def _utcnow() -> datetime:
        return datetime.now(timezone.utc)


FORMAT_VERSION = 1
MANIFEST_SUFFIX = ".manifest.json"
SHA256_SUFFIX = ".sha256"
DUMP_SUFFIX = ".dump.gpg"
DEFAULT_PREFIX = "lubix_db"
DEFAULT_IMAGE = "postgres:16"
GPG_CIPHER = "AES256"
GPG_S2K_DIGEST = "SHA512"
GPG_S2K_COUNT = "65011712"

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BACKUP_DIR = REPO_ROOT / "backups" / "db"
DEFAULT_REPORT_DIR = REPO_ROOT / "backups" / "reports"
DEFAULT_COMPOSE_FILE = REPO_ROOT / "docker-compose.yml"
DEFAULT_ENV_FILE = REPO_ROOT / ".env"


class BackupError(RuntimeError):
    """Error controlado: se muestra al usuario sin traza completa."""


# ---------------------------------------------------------------------------
# Utilidades generales
# ---------------------------------------------------------------------------


def log(message: str) -> None:
    print(f"[lubix-backup] {message}", flush=True)


def warn(message: str) -> None:
    print(f"[lubix-backup] ADVERTENCIA: {message}", file=sys.stderr, flush=True)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def human_size(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ("B", "KiB", "MiB", "GiB", "TiB"):
        if size < 1024 or unit == "TiB":
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{num_bytes} B"


def parse_env_file(path: Path) -> dict[str, str]:
    """Lector mínimo de .env (KEY=VALUE) sin dependencias externas."""
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value
    return values


def env_value(name: str, env: dict[str, str], default: str | None = None) -> str | None:
    return os.environ.get(name) or env.get(name) or default


def strip_password(dsn: str) -> str:
    return re.sub(r"(://[^:/@]+):[^@/]*@", r"\1:***@", dsn)


def database_from_dsn(dsn: str) -> str:
    try:
        path = urlsplit(dsn).path.lstrip("/")
        return path.split("/")[0] or "postgres"
    except ValueError:
        return "postgres"


def run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    capture: bool = True,
    check: bool = True,
    stdin=None,
    stdout=None,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            stdin=stdin,
            stdout=stdout if stdout is not None else (subprocess.PIPE if capture else None),
            stderr=subprocess.PIPE,
            env=env,
        )
    except FileNotFoundError as exc:
        raise BackupError(f"No se encontró el ejecutable: {cmd[0]}") from exc

    if check and proc.returncode != 0:
        stderr = (proc.stderr or b"").decode("utf-8", errors="replace").strip()
        stdout_text = (proc.stdout or b"").decode("utf-8", errors="replace").strip()
        detail = stderr or stdout_text or "(sin salida)"
        raise BackupError(
            f"Falló el comando: {' '.join(cmd[:4])} ...\n{detail}"
        )
    return proc


def which_or_none(*names: str) -> str | None:
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    return None


def find_pg_tool(name: str) -> str | None:
    """Busca pg_dump/psql/pg_restore en PATH y en instalaciones típicas."""
    exe = f"{name}.exe" if os.name == "nt" else name
    found = which_or_none(exe, name)
    if found:
        return found
    candidates: list[Path] = []
    if os.name == "nt":
        for base in (Path(r"C:\Program Files\PostgreSQL"), Path(r"C:\Program Files (x86)\PostgreSQL")):
            if base.is_dir():
                candidates.extend(sorted(base.glob(f"*/bin/{exe}"), reverse=True))
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return None


def find_gpg(explicit: str | None = None) -> str:
    candidates = [
        explicit,
        os.environ.get("GPG_BIN"),
        which_or_none("gpg", "gpg2", "gpg.exe"),
        r"C:\Program Files\Git\usr\bin\gpg.exe",
        r"C:\Program Files (x86)\GnuPG\bin\gpg.exe",
        r"C:\Program Files\GnuPG\bin\gpg.exe",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate)
        if path.is_file() or shutil.which(candidate):
            proc = subprocess.run(
                [candidate, "--version"], capture_output=True, text=True
            )
            if proc.returncode == 0:
                return candidate
    raise BackupError(
        "No se encontró GPG. Instala GnuPG (https://gnupg.org/download/) o define "
        "GPG_BIN con la ruta al ejecutable. En Windows, Git for Windows incluye "
        "gpg en 'C:\\Program Files\\Git\\usr\\bin\\gpg.exe'."
    )


def compose_prefix(explicit: str | None = None) -> list[str]:
    candidates: list[list[str]] = []
    if explicit:
        candidates.append(explicit.split())
    candidates.append(["docker", "compose"])
    candidates.append(["docker-compose"])
    for candidate in candidates:
        if shutil.which(candidate[0]) is None and not Path(candidate[0]).is_file():
            continue
        proc = subprocess.run(candidate + ["version"], capture_output=True, text=True)
        if proc.returncode == 0:
            return candidate
    raise BackupError(
        "No se encontró 'docker compose' ni 'docker-compose'. Instala Docker Desktop "
        "o Docker Engine + el plugin Compose."
    )


def docker_ready() -> None:
    proc = subprocess.run(
        ["docker", "info", "--format", "{{.ServerVersion}}"],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise BackupError(
            "El daemon de Docker no está disponible. Inicia Docker Desktop / Docker "
            f"Engine.\n{(proc.stderr or '').strip()}"
        )


# ---------------------------------------------------------------------------
# Cifrado simétrico con GPG
# ---------------------------------------------------------------------------


def resolve_passphrase(args: argparse.Namespace, *, confirm: bool) -> str:
    env_name = getattr(args, "passphrase_env", "BACKUP_PASSPHRASE") or "BACKUP_PASSPHRASE"
    passphrase: str | None = None

    if getattr(args, "passphrase_file", None):
        path = Path(args.passphrase_file)
        if not path.is_file():
            raise BackupError(f"No existe el archivo de frase de paso: {path}")
        passphrase = path.read_text(encoding="utf-8").rstrip("\r\n")
    elif os.environ.get("BACKUP_PASSPHRASE_FILE"):
        path = Path(os.environ["BACKUP_PASSPHRASE_FILE"])
        if not path.is_file():
            raise BackupError(f"No existe BACKUP_PASSPHRASE_FILE: {path}")
        passphrase = path.read_text(encoding="utf-8").rstrip("\r\n")
    elif os.environ.get(env_name):
        passphrase = os.environ[env_name]
    elif sys.stdin.isatty():
        passphrase = getpass.getpass("Frase de paso del respaldo: ")
        if confirm:
            again = getpass.getpass("Repite la frase de paso: ")
            if passphrase != again:
                raise BackupError("Las frases de paso no coinciden.")
    else:
        raise BackupError(
            "No hay frase de paso. Define la variable de entorno "
            f"{env_name}, usa --passphrase-file o ejecuta en una terminal interactiva."
        )

    if not passphrase:
        raise BackupError("La frase de paso está vacía; se rechaza por seguridad.")
    if "\n" in passphrase or "\r" in passphrase:
        raise BackupError("La frase de paso no puede contener saltos de línea.")
    return passphrase


class PassphraseFile:
    """Escribe la frase de paso en un archivo temporal con permisos restrictivos."""

    def __init__(self, passphrase: str):
        self._passphrase = passphrase
        self._path: Path | None = None

    def __enter__(self) -> Path:
        fd, raw_path = tempfile.mkstemp(prefix="lubix-gpg-", suffix=".txt")
        self._path = Path(raw_path)
        try:
            os.chmod(raw_path, 0o600)
        except OSError:
            pass
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(self._passphrase)
            handle.write("\n")
        return self._path

    def __exit__(self, *_exc) -> None:
        if self._path and self._path.exists():
            try:
                self._path.unlink()
            except OSError:
                pass


def gpg_common(gpg_bin: str, passphrase_file: Path) -> list[str]:
    return [
        gpg_bin,
        "--batch",
        "--yes",
        "--quiet",
        "--pinentry-mode",
        "loopback",
        "--passphrase-file",
        str(passphrase_file),
    ]


def encrypt_file(plain: Path, encrypted: Path, passphrase: str, gpg_bin: str) -> None:
    # El archivo se pasa como argumento posicional: algunas builds de GPG en
    # Windows ignoran --input y leen de stdin, generando un cifrado vacío.
    with PassphraseFile(passphrase) as pass_file:
        cmd = gpg_common(gpg_bin, pass_file) + [
            "--symmetric",
            "--cipher-algo",
            GPG_CIPHER,
            "--s2k-digest-algo",
            GPG_S2K_DIGEST,
            "--s2k-count",
            GPG_S2K_COUNT,
            "--output",
            str(encrypted),
            str(plain),
        ]
        run(cmd)


def decrypt_file(encrypted: Path, plain: Path, passphrase: str, gpg_bin: str) -> None:
    with PassphraseFile(passphrase) as pass_file:
        cmd = gpg_common(gpg_bin, pass_file) + [
            "--decrypt",
            "--output",
            str(plain),
            str(encrypted),
        ]
        run(cmd)


# ---------------------------------------------------------------------------
# Origen de datos (Compose o DSN)
# ---------------------------------------------------------------------------


COUNT_QUERY = """
SELECT tablename,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', schemaname, tablename),
                           false, true, '')))[1]::text::bigint
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
""".strip()


class ComposeSource:
    """Origen accesible mediante docker compose exec."""

    def __init__(self, args: argparse.Namespace, env: dict[str, str]):
        self.compose = compose_prefix(getattr(args, "compose_cmd", None))
        self.compose_file = Path(getattr(args, "compose_file", None) or DEFAULT_COMPOSE_FILE)
        self.service = getattr(args, "service", None) or "postgres"
        self.user = getattr(args, "db_user", None) or env_value("POSTGRES_USER", env, "postgres")
        self.database = getattr(args, "db_name", None) or env_value("POSTGRES_DB", env, "lubix")
        self.mode = "docker-compose"
        self.host = f"docker-compose:{self.service}"

    def _base(self) -> list[str]:
        return self.compose + ["-f", str(self.compose_file), "exec", "-T", self.service]

    def dump_to(self, destination: Path) -> None:
        cmd = self._base() + [
            "pg_dump",
            "-U",
            str(self.user),
            "-d",
            str(self.database),
            "--format=custom",
            "--compress=6",
            "--no-owner",
            "--no-acl",
        ]
        with destination.open("wb") as handle:
            run(cmd, cwd=REPO_ROOT, stdout=handle)

    def psql(self, sql: str) -> str:
        cmd = self._base() + [
            "psql",
            "-U",
            str(self.user),
            "-d",
            str(self.database),
            "-tA",
            "-F",
            "|",
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            sql,
        ]
        proc = run(cmd, cwd=REPO_ROOT)
        return (proc.stdout or b"").decode("utf-8", errors="replace")

    def info(self) -> dict[str, str | None]:
        return {
            "mode": self.mode,
            "host": self.host,
            "database": self.database,
            "user": self.user,
            "server_version": self.psql("SHOW server_version;").strip().splitlines()[0],
        }


class DsnSource:
    """Origen accesible mediante pg_dump/psql locales contra un DSN."""

    def __init__(self, args: argparse.Namespace):
        self.dsn = getattr(args, "source_dsn", None)
        if not self.dsn:
            raise BackupError("--source-dsn requiere una cadena de conexión.")
        self.dsn = self.dsn.replace("postgresql+psycopg2://", "postgresql://", 1)
        self.pg_dump = find_pg_tool("pg_dump")
        self.psql_bin = find_pg_tool("psql")
        if not self.pg_dump:
            raise BackupError(
                "No se encontró 'pg_dump'. Instala el cliente de PostgreSQL 16+ o "
                "usa el modo Compose (sin --source-dsn)."
            )
        if not self.psql_bin:
            raise BackupError(
                "No se encontró 'psql'; se necesita para recolectar los conteos del "
                "manifiesto. Instala el cliente de PostgreSQL 16+."
            )
        self.mode = "dsn"
        self.host = strip_password(self.dsn)
        self.database = database_from_dsn(self.dsn)
        self.user = self._user_from_dsn()

    def _user_from_dsn(self) -> str:
        try:
            return urlsplit(self.dsn).username or "postgres"
        except ValueError:
            return "postgres"

    def dump_to(self, destination: Path) -> None:
        cmd = [
            self.pg_dump,
            "--dbname",
            self.dsn,
            "--format=custom",
            "--compress=6",
            "--no-owner",
            "--no-acl",
        ]
        with destination.open("wb") as handle:
            run(cmd, stdout=handle)

    def psql(self, sql: str) -> str:
        if not self.psql_bin:
            raise BackupError("No se encontró 'psql' para consultar el origen DSN.")
        cmd = [
            self.psql_bin,
            "--dbname",
            self.dsn,
            "-tA",
            "-F",
            "|",
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            sql,
        ]
        proc = run(cmd)
        return (proc.stdout or b"").decode("utf-8", errors="replace")

    def info(self) -> dict[str, str | None]:
        return {
            "mode": self.mode,
            "host": self.host,
            "database": self.database,
            "user": self.user,
            "server_version": self.psql("SHOW server_version;").strip().splitlines()[0],
        }


def parse_counts(raw: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line or "|" not in line:
            continue
        table, value = line.rsplit("|", 1)
        try:
            counts[table] = int(value)
        except ValueError:
            continue
    return counts


def fetch_snapshot(source) -> tuple[dict[str, str | None], dict[str, int], str | None]:
    info = source.info()
    counts = parse_counts(source.psql(COUNT_QUERY))
    revision: str | None
    try:
        revision = source.psql(
            "SELECT version_num FROM alembic_version ORDER BY version_num DESC LIMIT 1;"
        ).strip().splitlines()
        revision = revision[0] if revision else None
    except BackupError:
        revision = None
    return info, counts, revision


# ---------------------------------------------------------------------------
# Comando: backup
# ---------------------------------------------------------------------------


def cmd_backup(args: argparse.Namespace) -> int:
    env = parse_env_file(Path(args.env_file or DEFAULT_ENV_FILE))
    output_dir = Path(args.output_dir or DEFAULT_BACKUP_DIR).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.source_dsn:
        source = DsnSource(args)
    else:
        source = ComposeSource(args, env)

    gpg_bin = find_gpg(args.gpg_bin)
    passphrase = resolve_passphrase(args, confirm=True)

    timestamp = _utcnow().strftime("%Y%m%dT%H%M%SZ")
    base_name = f"{args.prefix}_{timestamp}"
    encrypted_path = output_dir / f"{base_name}{DUMP_SUFFIX}"
    manifest_path = output_dir / f"{base_name}{MANIFEST_SUFFIX}"
    sha_path = output_dir / f"{base_name}{DUMP_SUFFIX}{SHA256_SUFFIX}"

    workdir = Path(tempfile.mkdtemp(prefix=".lubix-backup-", dir=output_dir))
    dump_path = workdir / f"{base_name}.dump"
    encrypted_tmp = workdir / f"{base_name}{DUMP_SUFFIX}"

    try:
        log(f"Origen: {source.mode} ({source.host})")
        log("Ejecutando pg_dump (formato custom, compresión nivel 6)...")
        source.dump_to(dump_path)
        if not dump_path.is_file() or dump_path.stat().st_size == 0:
            raise BackupError("pg_dump generó un archivo vacío.")

        plain_sha = sha256_file(dump_path)
        plain_size = dump_path.stat().st_size
        log(f"Volcado: {human_size(plain_size)} | SHA-256 {plain_sha}")

        log("Recolectando metadatos (conteos por tabla y revisión de Alembic)...")
        info, counts, revision = fetch_snapshot(source)

        log("Cifrando con GPG (AES-256)...")
        encrypt_file(dump_path, encrypted_tmp, passphrase, gpg_bin)
        encrypted_sha = sha256_file(encrypted_tmp)
        encrypted_size = encrypted_tmp.stat().st_size
        if encrypted_size == 0:
            raise BackupError("La cifra generó un archivo vacío.")

        # Control de ida y vuelta: garantiza que el respaldo se puede descifrar y
        # que el contenido coincide antes de publicarlo como válido.
        log("Verificando el cifrado (descifrado de control)...")
        control_dump = workdir / "control.dump"
        decrypt_file(encrypted_tmp, control_dump, passphrase, gpg_bin)
        control_sha = sha256_file(control_dump)
        control_dump.unlink(missing_ok=True)
        if control_sha != plain_sha:
            raise BackupError(
                "El descifrado de control no coincide con el volcado original. "
                f"Esperado {plain_sha}, obtenido {control_sha}."
            )
        log("Cifrado verificado: el respaldo descifra correctamente.")

        os.replace(encrypted_tmp, encrypted_path)
        for path in (encrypted_path, manifest_path, sha_path):
            try:
                os.chmod(path, 0o600)
            except OSError:
                pass

        manifest = {
            "format_version": FORMAT_VERSION,
            "created_at": _utcnow().isoformat().replace("+00:00", "Z"),
            "backup_name": base_name,
            "source": info,
            "dump": {
                "format": "pg_dump custom (-Fc)",
                "compression": 6,
                "size_bytes": plain_size,
                "sha256": plain_sha,
            },
            "encrypted": {
                "file": encrypted_path.name,
                "size_bytes": encrypted_size,
                "sha256": encrypted_sha,
                "tool": "gpg",
                "cipher": GPG_CIPHER,
                "s2k_digest": GPG_S2K_DIGEST,
                "s2k_count": int(GPG_S2K_COUNT),
            },
            "alembic_revision": revision,
            "tables": counts,
            "table_count": len(counts),
            "row_count": sum(counts.values()),
            "created_by": {
                "hostname": socket.gethostname(),
                "platform": platform.platform(),
            },
        }
        manifest_path.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        sha_path.write_text(f"{encrypted_sha}  {encrypted_path.name}\n", encoding="utf-8")

        log(f"Respaldo cifrado: {encrypted_path}")
        log(f"Manifiesto:        {manifest_path}")
        log(f"Checksum:          {sha_path}")
        log(
            f"Contenido:         {len(counts)} tablas, {sum(counts.values())} filas, "
            f"revisión Alembic {revision or 'n/d'}"
        )

        if args.retention_days and args.retention_days > 0:
            removed = apply_retention(output_dir, args.retention_days)
            if removed:
                log(f"Retención: {removed} respaldo(s) anterior(es) eliminado(s).")

        return 0
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def apply_retention(output_dir: Path, days: int) -> int:
    cutoff = _utcnow() - timedelta(days=days)
    removed = 0
    for dump in sorted(output_dir.glob(f"*{DUMP_SUFFIX}")):
        try:
            mtime = datetime.fromtimestamp(dump.stat().st_mtime, tz=timezone.utc)
        except OSError:
            continue
        if mtime >= cutoff:
            continue
        base_name = dump.name[: -len(DUMP_SUFFIX)]
        siblings = [
            dump,
            output_dir / f"{base_name}{MANIFEST_SUFFIX}",
            output_dir / f"{dump.name}{SHA256_SUFFIX}",
        ]
        for path in siblings:
            try:
                if path.exists():
                    path.unlink()
            except OSError as exc:
                warn(f"No se pudo eliminar {path.name}: {exc}")
        removed += 1
    return removed


# ---------------------------------------------------------------------------
# Comando: decrypt
# ---------------------------------------------------------------------------


def load_manifest_for(encrypted: Path) -> tuple[Path, dict]:
    if encrypted.name.endswith(DUMP_SUFFIX):
        base_name = encrypted.name[: -len(DUMP_SUFFIX)]
    else:
        base_name = encrypted.stem
    manifest_path = encrypted.parent / f"{base_name}{MANIFEST_SUFFIX}"
    if not manifest_path.is_file():
        raise BackupError(f"No se encontró el manifiesto: {manifest_path}")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BackupError(f"Manifiesto inválido ({manifest_path}): {exc}") from exc
    return manifest_path, manifest


def verify_encrypted_file(encrypted: Path, manifest: dict) -> None:
    expected = (manifest.get("encrypted") or {}).get("sha256")
    if not expected:
        raise BackupError("El manifiesto no contiene el checksum del archivo cifrado.")
    actual = sha256_file(encrypted)
    if actual != expected:
        raise BackupError(
            "El checksum del respaldo cifrado NO coincide con el manifiesto. "
            f"Esperado {expected}, obtenido {actual}. El archivo pudo corromperse o "
            "haber sido alterado."
        )
    log("Checksum del archivo cifrado verificado contra el manifiesto.")


def decrypt_to(encrypted: Path, destination: Path, args: argparse.Namespace) -> dict:
    if not encrypted.is_file():
        raise BackupError(f"No existe el respaldo: {encrypted}")
    manifest_path, manifest = load_manifest_for(encrypted)
    verify_encrypted_file(encrypted, manifest)

    gpg_bin = find_gpg(args.gpg_bin)
    passphrase = resolve_passphrase(args, confirm=False)
    log(f"Descifrando {encrypted.name}...")
    decrypt_file(encrypted, destination, passphrase, gpg_bin)

    expected_plain = (manifest.get("dump") or {}).get("sha256")
    actual_plain = sha256_file(destination)
    if expected_plain and actual_plain != expected_plain:
        destination.unlink(missing_ok=True)
        raise BackupError(
            "El volcado descifrado no coincide con el SHA-256 del manifiesto. "
            f"Esperado {expected_plain}, obtenido {actual_plain}."
        )
    log(f"Integridad del volcado verificada (SHA-256 {actual_plain}).")
    log(f"Manifiesto: {manifest_path}")
    return manifest


def cmd_decrypt(args: argparse.Namespace) -> int:
    encrypted = Path(args.file).resolve()
    output = Path(args.output).resolve() if args.output else encrypted.with_suffix("")
    if output.exists() and not args.force:
        raise BackupError(f"El destino ya existe: {output}. Usa --force para sobrescribir.")
    output.parent.mkdir(parents=True, exist_ok=True)
    workdir = Path(tempfile.mkdtemp(prefix=".lubix-decrypt-", dir=output.parent))
    tmp = workdir / "dump"
    try:
        decrypt_to(encrypted, tmp, args)
        os.replace(tmp, output)
        log(f"Volcado descifrado: {output}")
        return 0
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Restauración
# ---------------------------------------------------------------------------


def psql_container(name: str, user: str, db: str, sql: str) -> str:
    proc = run(
        [
            "docker",
            "exec",
            name,
            "psql",
            "-U",
            user,
            "-d",
            db,
            "-tA",
            "-F",
            "|",
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            sql,
        ]
    )
    return (proc.stdout or b"").decode("utf-8", errors="replace")


def psql_dsn(dsn: str, sql: str) -> str:
    psql_bin = find_pg_tool("psql")
    if not psql_bin:
        raise BackupError("No se encontró 'psql' para validar el destino DSN.")
    proc = run(
        [psql_bin, "--dbname", dsn, "-tA", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql]
    )
    return (proc.stdout or b"").decode("utf-8", errors="replace")


def validate_restore(psql_fn, manifest: dict) -> list[dict]:
    checks: list[dict] = []
    expected_counts: dict[str, int] = manifest.get("tables") or {}
    actual_counts = parse_counts(psql_fn(COUNT_QUERY))

    for table in sorted(expected_counts):
        expected = expected_counts[table]
        if table not in actual_counts:
            checks.append(
                {"check": f"tabla:{table}", "expected": expected, "actual": "AUSENTE", "ok": False}
            )
        else:
            actual = actual_counts[table]
            checks.append(
                {"check": f"tabla:{table}", "expected": expected, "actual": actual, "ok": actual == expected}
            )

    extra = sorted(set(actual_counts) - set(expected_counts))
    for table in extra:
        checks.append(
            {
                "check": f"tabla_extra:{table}",
                "expected": "no presente",
                "actual": actual_counts[table],
                "ok": False,
            }
        )

    expected_revision = manifest.get("alembic_revision")
    if expected_revision:
        try:
            raw = psql_fn(
                "SELECT version_num FROM alembic_version ORDER BY version_num DESC LIMIT 1;"
            ).strip()
            actual_revision = raw.splitlines()[0] if raw else None
        except BackupError:
            actual_revision = None
        checks.append(
            {
                "check": "alembic_revision",
                "expected": expected_revision,
                "actual": actual_revision,
                "ok": actual_revision == expected_revision,
            }
        )

    if not expected_counts:
        checks.append(
            {
                "check": "manifiesto_tiene_tablas",
                "expected": ">0",
                "actual": len(expected_counts),
                "ok": False,
            }
        )
    return checks


def cmd_restore(args: argparse.Namespace) -> int:
    encrypted = Path(args.file).resolve()
    manifest = load_manifest_for(encrypted)[1]
    env = parse_env_file(Path(args.env_file or DEFAULT_ENV_FILE))

    if args.target_container:
        args.target_user = args.target_user or "postgres"
        args.target_db = args.target_db or "lubix"
    elif args.target_dsn:
        args.target_user = args.target_user or "postgres"
    else:
        args.target_user = args.target_user or env_value("POSTGRES_USER", env, "postgres")
        args.target_db = args.target_db or env_value("POSTGRES_DB", env, "lubix")

    target_label = args.target_dsn or args.target_container or (
        f"docker-compose:{args.target_service}"
    )

    if not args.yes:
        raise BackupError(
            "Restaurar sobrescribe datos. Revisa el destino e indica --yes para confirmar.\n"
            f"  Destino: {strip_password(str(target_label)) if target_label else 'n/d'}\n"
            f"  Respaldo: {encrypted.name} ({manifest.get('created_at')})"
        )

    workdir = Path(tempfile.mkdtemp(prefix=".lubix-restore-"))
    dump = workdir / "restore.dump"
    try:
        manifest = decrypt_to(encrypted, dump, args)
        log(f"Restaurando en: {strip_password(str(target_label))}")

        if args.target_dsn:
            dsn = str(args.target_dsn).replace("postgresql+psycopg2://", "postgresql://", 1)
            pg_restore = find_pg_tool("pg_restore")
            if not pg_restore:
                raise BackupError(
                    "No se encontró 'pg_restore' para restaurar contra --target-dsn."
                )
            cmd = [
                pg_restore,
                "--dbname",
                dsn,
                "--no-owner",
                "--no-acl",
                "--exit-on-error",
                "--single-transaction",
            ]
            if args.replace:
                cmd.extend(["--clean", "--if-exists"])
            with dump.open("rb") as handle:
                run(cmd, stdin=handle)

            if args.validate:
                checks = validate_restore(lambda sql: psql_dsn(dsn, sql), manifest)
                return report_checks(checks, title="Validación posterior a la restauración")

        elif args.target_container:
            if args.create:
                run(
                    [
                        "docker",
                        "exec",
                        args.target_container,
                        "createdb",
                        "-U",
                        args.target_user,
                        args.target_db,
                    ]
                )
            cmd = [
                "docker",
                "exec",
                "-i",
                args.target_container,
                "pg_restore",
                "-U",
                args.target_user,
                "-d",
                args.target_db,
                "--no-owner",
                "--no-acl",
                "--exit-on-error",
                "--single-transaction",
            ]
            if args.replace:
                cmd.extend(["--clean", "--if-exists"])
            with dump.open("rb") as handle:
                run(cmd, stdin=handle)

            if args.validate:
                checks = validate_restore(
                    lambda sql: psql_container(
                        args.target_container, args.target_user, args.target_db, sql
                    ),
                    manifest,
                )
                return report_checks(checks, title="Validación posterior a la restauración")
        else:
            compose = compose_prefix(args.compose_cmd)
            cmd = compose + [
                "-f",
                str(Path(args.compose_file or DEFAULT_COMPOSE_FILE)),
                "exec",
                "-T",
                args.target_service,
                "pg_restore",
                "-U",
                args.target_user,
                "-d",
                args.target_db,
                "--no-owner",
                "--no-acl",
                "--exit-on-error",
                "--single-transaction",
            ]
            if args.replace:
                cmd.extend(["--clean", "--if-exists"])
            with dump.open("rb") as handle:
                run(cmd, cwd=REPO_ROOT, stdin=handle)

            if args.validate:
                source = ComposeSource(
                    argparse.Namespace(
                        compose_cmd=args.compose_cmd,
                        compose_file=args.compose_file,
                        service=args.target_service,
                        db_user=args.target_user,
                        db_name=args.target_db,
                    ),
                    {},
                )
                checks = validate_restore(source.psql, manifest)
                return report_checks(checks, title="Validación posterior a la restauración")

        log("Restauración completada.")
        return 0
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def report_checks(checks: list[dict], *, title: str) -> int:
    failed = [check for check in checks if not check["ok"]]
    log(title)
    for check in checks:
        mark = "OK  " if check["ok"] else "FALLA"
        log(f"  [{mark}] {check['check']}: esperado={check['expected']} obtenido={check['actual']}")
    if failed:
        warn(f"{len(failed)} validación(es) fallaron.")
        return 1
    log(f"{len(checks)} validación(es) correctas.")
    return 0


# ---------------------------------------------------------------------------
# Comando: verify (prueba real de restauración)
# ---------------------------------------------------------------------------


def wait_for_postgres(container: str, timeout: int = 180) -> None:
    """Espera a que el PostgreSQL definitivo acepte consultas.

    La imagen oficial inicia un servidor temporal durante la inicialización y
    luego lo apaga. Exigimos dos consultas correctas separadas por 2 segundos
    para no confundir ese servidor temporal con el definitivo.
    """
    deadline = time.time() + timeout
    consecutive = 0
    last_error = ""
    while time.time() < deadline:
        inspect = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}}", container],
            capture_output=True,
            text=True,
        )
        if inspect.returncode != 0 or inspect.stdout.strip() != "true":
            logs = subprocess.run(
                ["docker", "logs", "--tail", "60", container], capture_output=True, text=True
            )
            raise BackupError(
                "El contenedor de prueba se detuvo antes de estar listo.\n"
                f"{(logs.stderr or logs.stdout or last_error).strip()}"
            )

        proc = subprocess.run(
            [
                "docker",
                "exec",
                container,
                "psql",
                "-U",
                "postgres",
                "-d",
                "postgres",
                "-tAc",
                "SELECT 1;",
            ],
            capture_output=True,
            text=True,
        )
        if proc.returncode == 0 and proc.stdout.strip() == "1":
            consecutive += 1
            if consecutive >= 2:
                return
        else:
            consecutive = 0
            last_error = (proc.stderr or proc.stdout or "").strip()
        time.sleep(2)

    logs = subprocess.run(
        ["docker", "logs", "--tail", "60", container], capture_output=True, text=True
    )
    raise BackupError(
        f"PostgreSQL no estuvo listo en {timeout}s.\n"
        f"{(logs.stderr or logs.stdout or last_error).strip()}"
    )


def write_verify_report(
    report_dir: Path,
    *,
    status: str,
    encrypted: Path,
    manifest_path: Path,
    manifest: dict,
    checks: list[dict],
    container: str,
    server_version: str | None,
    started_at: datetime,
    finished_at: datetime,
    error: str | None = None,
) -> tuple[Path, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    stamp = finished_at.strftime("%Y%m%dT%H%M%SZ")
    base = f"restore-test_{stamp}"
    payload = {
        "status": status,
        "started_at": started_at.isoformat().replace("+00:00", "Z"),
        "finished_at": finished_at.isoformat().replace("+00:00", "Z"),
        "duration_seconds": round((finished_at - started_at).total_seconds(), 2),
        "backup": {
            "file": str(encrypted),
            "manifest": str(manifest_path),
            "created_at": manifest.get("created_at"),
            "source": manifest.get("source"),
            "encrypted_sha256": (manifest.get("encrypted") or {}).get("sha256"),
            "dump_sha256": (manifest.get("dump") or {}).get("sha256"),
            "row_count": manifest.get("row_count"),
            "table_count": manifest.get("table_count"),
        },
        "restore_environment": {
            "hostname": socket.gethostname(),
            "platform": platform.platform(),
            "container": container,
            "server_version": server_version,
        },
        "checks": checks,
        "error": error,
    }
    json_path = report_dir / f"{base}.json"
    md_path = report_dir / f"{base}.md"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# Prueba de restauración de respaldo — LUBIX",
        "",
        f"- **Resultado:** {'PASS' if status == 'PASS' else 'FAIL'}",
        f"- **Fecha (UTC):** {payload['finished_at']}",
        f"- **Duración:** {payload['duration_seconds']} s",
        f"- **Respaldo:** `{encrypted.name}`",
        f"- **Máquina de restauración:** `{socket.gethostname()}` ({platform.platform()})",
        f"- **Contenedor desechable:** `{container}` (PostgreSQL {server_version or 'n/d'})",
        f"- **Origen registrado en el respaldo:** `{(manifest.get('source') or {}).get('host')}` / "
        f"BD `{(manifest.get('source') or {}).get('database')}`",
        f"- **Filas esperadas:** {manifest.get('row_count')} en {manifest.get('table_count')} tablas",
        "",
        "## Validaciones",
        "",
        "| Validación | Esperado | Obtenido | Resultado |",
        "|------------|----------|----------|-----------|",
    ]
    for check in checks:
        lines.append(
            f"| `{check['check']}` | {check['expected']} | {check['actual']} | "
            f"{'OK' if check['ok'] else 'FALLA'} |"
        )
    if error:
        lines += ["", "## Error", "", "```", error, "```"]
    lines += [
        "",
        "> Generado automáticamente por `scripts/pg_backup.py verify`.",
        "",
    ]
    md_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, md_path


def cmd_verify(args: argparse.Namespace) -> int:
    encrypted = Path(args.file).resolve()
    manifest_path, manifest = load_manifest_for(encrypted)
    docker_ready()

    report_dir = Path(args.report_dir or DEFAULT_REPORT_DIR).resolve()
    image = args.image or os.environ.get("POSTGRES_IMAGE") or DEFAULT_IMAGE
    container = f"lubix-restore-test-{secrets.token_hex(4)}"
    test_db = "lubix_restore_test"
    test_user = "postgres"
    test_password = secrets.token_urlsafe(24)
    started_at = _utcnow()
    checks: list[dict] = []
    server_version: str | None = None
    error_text: str | None = None
    started_container = False

    workdir = Path(tempfile.mkdtemp(prefix=".lubix-verify-"))
    dump = workdir / "restore.dump"

    try:
        log("Verificando checksum y descifrando el respaldo...")
        decrypt_to(encrypted, dump, args)
        verify_encrypted_plain = sha256_file(dump)
        expected_plain = (manifest.get("dump") or {}).get("sha256")
        checks.append(
            {
                "check": "checksum_volcado_descifrado",
                "expected": expected_plain,
                "actual": verify_encrypted_plain,
                "ok": expected_plain == verify_encrypted_plain,
            }
        )

        log(f"Levantando PostgreSQL desechable ({image}) en la máquina de restauración...")
        run(
            [
                "docker",
                "run",
                "-d",
                "--rm",
                "--name",
                container,
                "-e",
                f"POSTGRES_PASSWORD={test_password}",
                "-e",
                f"POSTGRES_DB={test_db}",
                image,
            ]
        )
        started_container = True
        wait_for_postgres(container)
        log("PostgreSQL listo. Restaurando el volcado...")

        with dump.open("rb") as handle:
            run(
                [
                    "docker",
                    "exec",
                    "-i",
                    container,
                    "pg_restore",
                    "-U",
                    test_user,
                    "-d",
                    test_db,
                    "--no-owner",
                    "--no-acl",
                    "--exit-on-error",
                    "--single-transaction",
                ],
                stdin=handle,
            )
        checks.append(
            {"check": "pg_restore", "expected": "sin errores", "actual": "sin errores", "ok": True}
        )

        server_version = psql_container(container, test_user, test_db, "SHOW server_version;").strip()
        checks.extend(
            validate_restore(
                lambda sql: psql_container(container, test_user, test_db, sql), manifest
            )
        )

        failed = [check for check in checks if not check["ok"]]
        status = "FAIL" if failed else "PASS"
        finished_at = _utcnow()
        json_path, md_path = write_verify_report(
            report_dir,
            status=status,
            encrypted=encrypted,
            manifest_path=manifest_path,
            manifest=manifest,
            checks=checks,
            container=container,
            server_version=server_version,
            started_at=started_at,
            finished_at=finished_at,
        )

        report_checks(checks, title="Resultado de la prueba de restauración")
        log(f"Reporte JSON: {json_path}")
        log(f"Reporte MD:   {md_path}")

        if failed:
            warn("La prueba de restauración FALLÓ. No uses este respaldo hasta investigar.")
            return 1
        log("PRUEBA DE RESTAURACIÓN EXITOSA (PASS).")
        return 0
    except BackupError as exc:
        error_text = str(exc)
        finished_at = _utcnow()
        if not checks:
            checks = [
                {"check": "prueba_restauracion", "expected": "PASS", "actual": error_text, "ok": False}
            ]
        else:
            checks.append(
                {"check": "prueba_restauracion", "expected": "PASS", "actual": error_text, "ok": False}
            )
        json_path, md_path = write_verify_report(
            report_dir,
            status="FAIL",
            encrypted=encrypted,
            manifest_path=manifest_path,
            manifest=manifest,
            checks=checks,
            container=container,
            server_version=server_version,
            started_at=started_at,
            finished_at=finished_at,
            error=error_text,
        )
        warn(error_text)
        log(f"Reporte JSON: {json_path}")
        log(f"Reporte MD:   {md_path}")
        return 1
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
        if started_container:
            if args.keep_container:
                log(f"Contenedor conservado para inspección: {container}")
            else:
                subprocess.run(
                    ["docker", "rm", "-f", container], capture_output=True, text=True
                )


# ---------------------------------------------------------------------------
# Comando: list
# ---------------------------------------------------------------------------


def cmd_list(args: argparse.Namespace) -> int:
    output_dir = Path(args.output_dir or DEFAULT_BACKUP_DIR).resolve()
    files = sorted(output_dir.glob(f"*{DUMP_SUFFIX}"))
    if not files:
        log(f"No hay respaldos en {output_dir}")
        return 0
    log(f"Respaldos en {output_dir}:")
    for item in files:
        size = human_size(item.stat().st_size)
        created = datetime.fromtimestamp(item.stat().st_mtime, tz=timezone.utc).strftime(
            "%Y-%m-%d %H:%M:%SZ"
        )
        detail = ""
        try:
            _, manifest = load_manifest_for(item)
            detail = (
                f" | {manifest.get('table_count')} tablas, "
                f"{manifest.get('row_count')} filas, rev {manifest.get('alembic_revision') or 'n/d'}"
            )
        except BackupError:
            detail = " | (sin manifiesto)"
        print(f"  {item.name}  {created}  {size}{detail}")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def add_common_crypto(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--passphrase-file", help="Archivo con la frase de paso (recomendado).")
    parser.add_argument(
        "--passphrase-env",
        default="BACKUP_PASSPHRASE",
        help="Variable de entorno con la frase de paso (default: BACKUP_PASSPHRASE).",
    )
    parser.add_argument("--gpg-bin", help="Ruta explícita al ejecutable gpg.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pg_backup.py",
        description="Respaldo cifrado y prueba de restauración de PostgreSQL para LUBIX.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # backup
    p = sub.add_parser("backup", help="Crea un respaldo cifrado con manifiesto y checksums.")
    p.set_defaults(func=cmd_backup)
    p.add_argument("--output-dir", help=f"Directorio de respaldos (default: {DEFAULT_BACKUP_DIR})")
    p.add_argument("--prefix", default=DEFAULT_PREFIX, help="Prefijo del archivo de respaldo.")
    p.add_argument(
        "--retention-days",
        type=int,
        default=0,
        help="Elimina respaldos más antiguos que N días (0 = sin rotación).",
    )
    p.add_argument("--env-file", help="Archivo .env con credenciales (default: raíz/.env).")
    p.add_argument("--compose-file", help="docker-compose.yml a usar.")
    p.add_argument("--compose-cmd", help="Comando Compose (ej. 'docker compose').")
    p.add_argument("--service", default="postgres", help="Servicio PostgreSQL de Compose.")
    p.add_argument("--db-user", help="Usuario de PostgreSQL (default: POSTGRES_USER).")
    p.add_argument("--db-name", help="Base de datos (default: POSTGRES_DB).")
    p.add_argument(
        "--source-dsn",
        help="Respalda un PostgreSQL externo (Neon/Supabase/Render) usando pg_dump local.",
    )
    add_common_crypto(p)

    # restore
    p = sub.add_parser("restore", help="Descifra y restaura un respaldo en un destino.")
    p.set_defaults(func=cmd_restore)
    p.add_argument("--file", required=True, help="Archivo .dump.gpg a restaurar.")
    p.add_argument("--target-dsn", help="DSN del destino (requiere pg_restore local).")
    p.add_argument("--target-container", help="Contenedor Docker destino.")
    p.add_argument("--target-service", default="postgres", help="Servicio Compose destino.")
    p.add_argument("--target-db", help="Base de datos destino (default: POSTGRES_DB).")
    p.add_argument("--target-user", help="Usuario destino (default: POSTGRES_USER).")
    p.add_argument("--env-file", help="Archivo .env del destino (default: raíz/.env).")
    p.add_argument("--compose-file", help="docker-compose.yml del destino.")
    p.add_argument("--compose-cmd", help="Comando Compose del destino.")
    p.add_argument("--create", action="store_true", help="Crea la BD destino (solo contenedor).")
    p.add_argument("--replace", action="store_true", help="Limpia objetos existentes antes de restaurar.")
    p.add_argument(
        "--validate",
        action="store_true",
        help="Compara conteos y revisión de Alembic contra el manifiesto tras restaurar.",
    )
    p.add_argument("--yes", action="store_true", help="Confirma la restauración (obligatorio).")
    add_common_crypto(p)

    # verify
    p = sub.add_parser(
        "verify",
        help="Prueba real: restaura en un PostgreSQL desechable y valida contra el manifiesto.",
    )
    p.set_defaults(func=cmd_verify)
    p.add_argument("--file", required=True, help="Archivo .dump.gpg a probar.")
    p.add_argument("--image", help=f"Imagen PostgreSQL para la prueba (default: {DEFAULT_IMAGE}).")
    p.add_argument("--report-dir", help=f"Directorio de reportes (default: {DEFAULT_REPORT_DIR})")
    p.add_argument("--keep-container", action="store_true", help="No elimina el contenedor de prueba.")
    add_common_crypto(p)

    # decrypt
    p = sub.add_parser("decrypt", help="Descifra un respaldo a un archivo plano.")
    p.set_defaults(func=cmd_decrypt)
    p.add_argument("--file", required=True, help="Archivo .dump.gpg.")
    p.add_argument("--output", help="Archivo de salida (default: mismo nombre sin .gpg).")
    p.add_argument("--force", action="store_true", help="Sobrescribe el archivo de salida.")
    add_common_crypto(p)

    # list
    p = sub.add_parser("list", help="Lista los respaldos disponibles.")
    p.set_defaults(func=cmd_list)
    p.add_argument("--output-dir", help="Directorio de respaldos.")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except BackupError as exc:
        print(f"[lubix-backup] ERROR: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\n[lubix-backup] Cancelado por el usuario.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
