# HU-010 — Gestión de sesiones

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-010 |
| Título | Gestión de sesiones |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-010 |

---

## Historia

Como usuario de Lubix, quiero visualizar y gestionar mis sesiones activas, para controlar desde qué dispositivos está accediendo a mi cuenta y cerrar sesiones que ya no utilizo.

---

## Criterios de aceptación

### CA-010.1 — Lista de sesiones activas con información del dispositivo

**Dado que** el usuario accede a la sección de gestión de sesiones,

**cuando** se carga la información,

**entonces** debe visualizarse una lista de todas las sesiones activas en su cuenta, mostrando para cada una: tipo de dispositivo, sistema operativo, navegador o aplicación, ubicación aproximada y fecha y hora del último acceso.

---

### CA-010.2 — Sesión actual identificada

**Dado que** el usuario está en la sección de gestión de sesiones,

**cuando** se muestra la lista de sesiones activas,

**entonces** la sesión actual debe estar claramente diferenciada con una etiqueta o indicador visual que indique que corresponde al dispositivo y navegador que se está utilizando en ese momento.

---

### CA-010.3 — Cierre individual de sesión

**Dado que** el usuario visualiza la lista de sesiones activas,

**cuando** selecciona la opción de cerrar sesión en un dispositivo específico que no es el actual,

**entonces** el sistema debe cerrar esa sesión de forma inmediata y eliminarla de la lista, mostrando un mensaje de confirmación.

---

### CA-010.4 — Cierre de todas las sesiones

**Dado que** el usuario está en la sección de gestión de sesiones,

**cuando** selecciona la opción de cerrar todas las sesiones,

**entonces** el sistema debe cerrar todas las sesiones activas excepto la sesión actual, mostrando un mensaje de confirmación antes de ejecutar la acción.

---

### CA-010.5 — Confirmación antes de cerrar sesiones

**Dado que** el usuario selecciona cerrar una sesión individual o todas las sesiones,

**cuando** el sistema está procesando la solicitud,

**entonces** debe mostrarse un mensaje de confirmación que indique claramente qué sesión o sesiones se cerrarán, y el usuario debe confirmar la acción antes de que se ejecute.

---

### CA-010.6 — Conteo de sesiones activas

**Dado que** el usuario accede a la sección de gestión de sesiones,

**cuando** se muestra la información,

**entonces** debe visualizarse el número total de sesiones activas en su cuenta, actualizándose dinámicamente cuando se cierra alguna sesión.