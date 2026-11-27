#!/usr/bin/env bash
# Instala unattended-upgrades con la configuración versionada en este directorio.
# Uso: sudo ./install.sh
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Ejecutar como root: sudo ./install.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades

install -m 0644 "${SCRIPT_DIR}/20auto-upgrades" /etc/apt/apt.conf.d/20auto-upgrades
install -m 0644 "${SCRIPT_DIR}/50unattended-upgrades" /etc/apt/apt.conf.d/50unattended-upgrades

systemctl enable --now unattended-upgrades

echo "== Configuracion activa =="
apt-config dump APT::Periodic
echo "== Simulacion de parches =="
unattended-upgrade --dry-run --debug
