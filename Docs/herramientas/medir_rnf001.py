"""Mide el p95 de endpoints del API para PNF-001 / RNF-001.

Ejemplos:
    python Docs/herramientas/medir_rnf001.py --base http://127.0.0.1:8010

    python Docs/herramientas/medir_rnf001.py --base http://127.0.0.1:8010 \
        --email rnf001@lubix.com --password "Secreta1!" --product-id <uuid>

Sin --email solo se mide GET /products/catalogs. Con --email se agrega
POST /auth/login-user y, si hay --product-id, POST /user/orders.
"""
import argparse
import json
import math
import time
import urllib.error
import urllib.request


def call(base, method, path, body=None, token=None):
    payload = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(base + path, data=payload, method=method)
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
            status = response.status
    except urllib.error.HTTPError as error:
        data = error.read()
        status = error.code
    return (time.perf_counter() - start) * 1000, status, data


def resumen(nombre, tiempos, estados):
    ordenados = sorted(tiempos)
    p95 = ordenados[max(0, math.ceil(0.95 * len(ordenados)) - 1)]
    print(
        f"{nombre}: n={len(ordenados)} min={ordenados[0]:.1f}ms "
        f"mediana={ordenados[len(ordenados) // 2]:.1f}ms p95={p95:.1f}ms "
        f"max={ordenados[-1]:.1f}ms promedio={sum(ordenados) / len(ordenados):.1f}ms "
        f"HTTP={sorted(estados)}"
    )


def serie(nombre, fn, calentamiento, repeticiones):
    for _ in range(calentamiento):
        fn()
    tiempos = []
    estados = set()
    for _ in range(repeticiones):
        ms, status, _ = fn()
        tiempos.append(ms)
        estados.add(status)
    resumen(nombre, tiempos, estados)


def main():
    parser = argparse.ArgumentParser(description="Medición PNF-001 / RNF-001")
    parser.add_argument("--base", default="http://127.0.0.1:8010")
    parser.add_argument("--n", type=int, default=30)
    parser.add_argument("--warmup", type=int, default=3)
    parser.add_argument("--email")
    parser.add_argument("--password")
    parser.add_argument("--product-id")
    args = parser.parse_args()

    base = args.base.rstrip("/")
    token = {"valor": None}

    def login():
        ms, status, data = call(
            base,
            "POST",
            "/auth/login-user",
            {"email": args.email, "password": args.password},
        )
        if status == 200:
            token["valor"] = json.loads(data)["access_token"]
        return ms, status, data

    def crear_pedido():
        pedido = {
            "items": [
                {
                    "product_id": args.product_id,
                    "name": "Producto RNF001",
                    "price": 1000.0,
                    "quantity": 1,
                }
            ],
            "subtotal": 1000.0,
            "shipping": 0.0,
            "total": 1000.0,
            "payment_method": "efectivo",
            "recipient": "RNF Uno",
            "address": "Calle 1 # 2-3",
            "city": "Bogota",
            "department": "Cundinamarca",
            "postal_code": "110111",
        }
        return call(base, "POST", "/user/orders", pedido, token["valor"])

    serie(
        "GET /products/catalogs",
        lambda: call(base, "GET", "/products/catalogs"),
        args.warmup,
        args.n,
    )

    if args.email and args.password:
        serie("POST /auth/login-user", login, args.warmup, args.n)
        if args.product_id and token["valor"]:
            serie("POST /user/orders", crear_pedido, args.warmup, args.n)


if __name__ == "__main__":
    main()
