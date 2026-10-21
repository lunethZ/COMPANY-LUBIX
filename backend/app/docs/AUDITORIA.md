# Auditoría de Seguridad (pip-audit)

Guía para auditar dependencias del backend en busca de vulnerabilidades conocidas (CVE).

---

## Configuración inicial

### Instalar UV

```bash
curl -LsSf https://astral.sh | sh
```

### Crear entorno virtual e instalar pip-audit

```bash
uv venv
uv pip install pip-audit
```

---

## Ejecución

### Auditar dependencias

```bash
uv run pip-audit
```

Resultado esperado (sin vulnerabilidades):

```text
No known vulnerabilities found
```

### Generar reporte JSON

```bash
uvx pip-audit --format json -o reporte.json
```

### Ver dependencias instaladas

```bash
uv pip list
```

### Ver árbol de dependencias

```bash
uv tree
```

---

## Solución de vulnerabilidades

Si se encuentra una vulnerabilidad:

```text
Found x known vulnerabilities in x packages
```

Actualizar la dependencia afectada:

```bash
uv add "paquete>=version_segura"
uv lock --upgrade
uv sync
```

Volver a auditar:

```bash
uv run pip-audit
```

---

## Flujo recomendado

```bash
uv sync
uv run pip-audit
uv lock --upgrade
uv sync
uv run pip-audit
```