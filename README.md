# Prototipo Backoffice — CRD de Farmacovigilancia (Strapi 5)

Prototipo backoffice **generado con IA** para el sistema CRD de farmacovigilancia. Implementa dos tareas del plan individual de la práctica profesional (Anexo A):

1. **Control de acceso por roles (RBAC):** roles *Administrador*, *Coordinador* e *Investigador* con matriz de permisos declarada en código y aplicada en el arranque, políticas de seguridad adicionales a nivel de ruta y auditoría automática (campos createdBy / updatedBy).
2. **Análisis estadístico con minería de datos:** detección de señales farmacológicas sobre los eventos adversos mediante **PRR** (razón de proporciones de notificación), **ROR** (razón de momios de notificación), **chi-cuadrado con corrección de Yates** y **criterios de Evans**; además, estadística descriptiva y serie temporal mensual.

> Prototipo con fines educativos. Generado con asistencia de IA (agente Vibe, modelo GLM — Mistral AI) a partir del dominio del sistema CRD real (Strapi + PostgreSQL + Next.js).

## Requisitos

- Node.js 20 o superior
- npm

## Instalación y arranque

```bash
git clone https://github.com/jonahSimonxx/prototipo-backoffice-crd.git
cd prototipo-backoffice-crd
npm install
cp .env.example .env   # edite los secretos (openssl rand -base64 32)
npm run develop
```

- Panel de administración: http://localhost:1337/admin (crear el usuario del panel la primera vez)
- **Al arrancar se crean automáticamente:** los 3 roles con su matriz de permisos, los usuarios de prueba y los datos de demostración.

## Usuarios de prueba

| Correo | Contraseña | Rol | Qué puede hacer |
| --- | --- | --- | --- |
| investigador@crd.cu | Invest123! | Investigador | Ver pacientes/medicamentos/administraciones, registrar eventos adversos. **No** ve el análisis, **no** elimina. |
| coordinador@crd.cu | Coord123! | Coordinador | Todo lo anterior + editar eventos y consultar el análisis estadístico. **No** elimina. |
| admin@crd.cu | Admin123! | Administrador | Acceso total: CRUD, análisis y gestión de usuarios. |

## Endpoints principales

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | /api/auth/local | Público (login, devuelve JWT) |
| GET/POST | /api/evento-adversos | Según rol (Investigador: crear; Coordinador: crear/editar) |
| DELETE | /api/evento-adversos/:documentId | Solo Administrador (política solo-admin) |
| GET | /api/analisis/resumen | Coordinador y Administrador |
| GET | /api/analisis/senales?evento=Hepatotoxicidad | Coordinador y Administrador |
| GET | /api/analisis/tendencia | Coordinador y Administrador |

### Ejemplo de uso

```bash
# 1. Login
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier": "coordinador@crd.cu", "password": "Coord123!"}'

# 2. Detección de señales con el JWT obtenido
curl "http://localhost:1337/api/analisis/senales?evento=Hepatotoxicidad" \
  -H "Authorization: Bearer <JWT>"

# Con el JWT del Investigador la misma llamada responde 403 Forbidden.
```

## Metodología estadística (minería de datos)

Para cada medicamento se construye la tabla de contingencia 2×2 frente al evento de interés:

- **PRR** = [a/(a+b)] / [c/(c+d)], con IC 95% = exp(ln PRR ± 1,96·√(1/a − 1/(a+b) + 1/c − 1/(c+d)))
- **ROR** = (a·d)/(b·c), con IC 95% = exp(ln ROR ± 1,96·√(1/a + 1/b + 1/c + 1/d))
- **χ²** con corrección de Yates = (|ad−bc| − N/2)² · N / [(a+b)(c+d)(a+c)(b+d)]
- **Señal (criterios de Evans):** PRR ≥ 2 **y** χ² ≥ 4 **y** a ≥ 3

donde *a*: eventos del tipo de interés con el medicamento; *b*: otros eventos con el medicamento; *c*: eventos del tipo con el resto de medicamentos; *d*: otros eventos con el resto.

## Datos de demostración

75 eventos adversos simulados sobre 5 medicamentos. **FármacoX 200** concentra intencionalmente los casos de *Hepatotoxicidad* (a=6, b=4, c=3, d=62), de modo que el análisis detecta la señal:

- PRR = **13,0** (IC 95%: 3,9–43,8)
- ROR = **31,0**
- χ² (Yates) = **20,2**
- Criterios de Evans: se cumplen los tres → **señal farmacológica** ✔

El resto de los medicamentos (p. ej., Paracetamol 500 con PRR 0,69) no genera señales falsas.

## Estructura del proyecto

```
config/                        Configuración Strapi 5 (SQLite en el prototipo)
src/
  index.ts                     Bootstrap: roles, permisos, usuarios y datos demo
  api/
    paciente/                  Content type + CRUD (permisos por rol)
    medicamento/
    administracion-medicamento/
    evento-adverso/            + policies/solo-admin.ts (eliminar → Administrador)
    analisis-estadistico/      API personalizada: resumen, señales, tendencia
      policies/es-analista.ts  Análisis → Coordinador y Administrador
```

## Notas de auditoría y trazabilidad

- Content types con *draft & publish* desactivado (un solo estado real de cada dato).
- Campos automáticos de auditoría (quién registró y quién modificó cada evento).
- La matriz de permisos se reescribe en cada arranque → configuración reproducible y auditable.

---

Jonathan Simón — Práctica Profesional y Tesis (sistema CRD de farmacovigilancia).
