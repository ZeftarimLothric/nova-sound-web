# Nova Sound MES / SCADA - Backend API

API REST construida con **Node.js, Express y TypeScript** para el sistema de control de calidad y manufactura **Nova Sound**.

---

## 🏗️ Arquitectura por Capas

El backend sigue el patrón arquitectónico en capas para garantizar la separación de responsabilidades y alta capacidad de prueba (*Testability*):

```
nova-sound-ui-BACKEND/
├── src/
│   ├── config/
│   │   └── db.ts             # Pool de conexiones a PostgreSQL
│   ├── types/
│   │   └── index.ts          # Tipos e interfaces basados en Tablas.sql
│   ├── repositories/         # Capa de Acceso a Datos (Consultas SQL directas)
│   │   ├── catalogos.repository.ts
│   │   └── unidades.repository.ts
│   ├── services/             # Lógica de Negocio y Reglas de Calidad (ISO-9001)
│   │   └── unidades.service.ts
│   ├── controllers/          # Controladores HTTP y validaciones con Zod
│   │   ├── catalogos.controller.ts
│   │   └── unidades.controller.ts
│   ├── routes/               # Definición de rutas y endpoints REST
│   │   ├── catalogos.routes.ts
│   │   ├── unidades.routes.ts
│   │   └── index.ts
│   ├── app.ts                # Configuración de Express, CORS y Middlewares
│   └── server.ts             # Arranque del servidor y healthcheck
├── tests/                    # Pruebas Unitarias de Reglas de Calidad con Vitest
│   └── unidades.service.test.ts
├── .env.example              # Plantilla de variables de entorno
└── package.json
```

---

## 🚀 Puesta en Marcha

### 1. Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Asegúrate de que `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` coincidan con tu base de datos PostgreSQL local donde importaste `Tablas.sql` e `INSERTS_NOVA_SOUND.txt`.

### 2. Modo Desarrollo (Recarga en caliente)
```bash
npm run dev
```
El servidor arrancará en: `http://localhost:4000`

---

## 🧪 Pruebas Automatizadas (Materia de Calidad de Software)
Para ejecutar la suite de pruebas unitarias que validan las reglas de calidad:
```bash
npm test
```
Las pruebas cubren:
* Registro exitoso de unidades serializadas.
* Rechazo y error `409 Conflict` ante números de serie duplicados (trazabilidad única).
* Violación de calidad: Bloqueo de dictamen `Aprobada` si una prueba funcional acústica/eléctrica es reprobada.
* Dictamen formal exitoso y registro en `historial_unidades`.

---

## 📡 Endpoints Principales

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor y hora del sistema |
| `GET` | `/api/catalogos/lineas` | Catálogo de líneas de ensamble (`L1`, `L2`, `L3`) |
| `GET` | `/api/catalogos/turnos` | Catálogo de turnos de planta |
| `GET` | `/api/catalogos/modelos` | Catálogo de modelos de bocina (`NS-PRO`, etc.) |
| `GET` | `/api/catalogos/defectos` | Catálogo clasificado de fallas |
| `POST` | `/api/unidades/ensamble` | Registro de bocina en estación de Ensamble |
| `POST` | `/api/unidades/calidad/dictamen` | Evaluación y dictamen en estación de Calidad |
| `GET` | `/api/unidades/recientes` | Últimas unidades serializadas en planta |
| `GET` | `/api/unidades/historial` | Trazabilidad histórica de dictámenes |
