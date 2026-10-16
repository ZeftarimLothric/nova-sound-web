# Nova Sound MES — Sistema de Manufactura y Control de Calidad

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8+-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon.tech-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)

Sistema integral de **Ejecución de Manufactura (MES / SCADA Industrial)** desarrollado para la trazabilidad completa, control de calidad bajo protocolo **ISO-9001**, empaque por contenedores, despacho logístico y auditoría en tiempo real para líneas de producción de bocinas inteligentes.

Proyecto desarrollado para la materia de **Calidad y Pruebas de Software**.

---

## Tabla de Contenidos

1. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
2. [Requisitos Previos](#-requisitos-previos)
3. [Guía de Instalación y Puesta en Marcha](#-guía-de-instalación-y-puesta-en-marcha)
   - [Paso 1: Clonar el Repositorio](#paso-1-clonar-el-repositorio)
   - [Paso 2: Base de Datos (Neon PostgreSQL)](#paso-2-base-de-datos-neon-postgresql)
   - [Paso 3: Configurar y Correr el Backend](#paso-3-configurar-y-correr-el-backend)
   - [Paso 4: Configurar y Correr el Frontend](#paso-4-configurar-y-correr-el-frontend)
4. [Credenciales de Acceso y Roles](#-credenciales-de-acceso-y-roles)
5. [Recorrido del Flujo Operativo (Estaciones)](#-recorrido-del-flujo-operativo-estaciones)
6. [Pruebas Automatizadas](#-pruebas-automatizadas)
7. [Guía para Subir a GitHub](#-guía-para-subir-a-github-por-primera-vez)
8. [Solución de Problemas Frecuentes](#-solución-de-problemas-frecuentes)

---

## Arquitectura del Proyecto

El repositorio está organizado como un monorepositorio modular:

```text
WEB/
├── database/                          # Scripts DDL y semillas SQL
│   ├── Tablas.sql                     # Creación de tablas, llaves foráneas y constraints
│   └── INSERTS_NOVA_SOUND.txt         # Datos maestros (catálogos, 50 usuarios, órdenes, etc.)
│
├── nova-sound-ui-BACKEND/             # API REST (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/db.ts               # Pool de conexiones a PostgreSQL
│   │   ├── controllers/               # Controladores HTTP y validaciones con Zod
│   │   ├── services/                  # Reglas de negocio e ISO-9001
│   │   ├── repositories/              # Consultas SQL (Data Access Layer)
│   │   ├── routes/                    # Endpoints REST montados en /api
│   │   ├── types/                     # Interfaces TypeScript sincronizadas con la BD
│   │   └── server.ts                  # Punto de entrada del servidor (puerto 4000)
│   ├── tests/                         # Pruebas unitarias de calidad con Vitest
│   ├── .env.example                   # Plantilla de variables de entorno
│   └── package.json
│
├── nova-sound-ui-FRONTEND/            # Interfaz HMI / MES (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── Pages/                     # Vistas principales (Login, Dashboard)
│   │   ├── components/                # Estaciones de manufactura:
│   │   │   ├── EnsambleStation.tsx    # Registro y serialización
│   │   │   ├── CalidadStation.tsx     # Pruebas funcionales y dictamen
│   │   │   ├── EmpaqueStation.tsx     # Llenado y sellado de cajas
│   │   │   ├── EmbarquesStation.tsx   # Manifiestos de remisión y salida
│   │   │   ├── ReportesStation.tsx    # KPIs (FPY, Pareto de fallas, Scrap)
│   │   │   ├── ConfiguracionStation.tsx # Gestión de usuarios, parámetros y respaldos
│   │   │   └── common/Icon.tsx        # Componente oficial Google Material Symbols
│   │   ├── context/PlantaContext.tsx  # Estado global y sincronización con el backend
│   │   └── types/database.ts          # Tipos compartidos
│   └── package.json
│
├── .gitignore                         # Exclusión de node_modules, .env y compilados
└── README.md                          # Documentación del proyecto
```

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

* **[Node.js](https://nodejs.org/)** versión **18.0.0** o superior (recomendado v20+ LTS).
* **npm** (viene instalado automáticamente con Node.js).
* **[Git](https://git-scm.com/)** instalado en tu sistema.
* Una cuenta gratuita en **[Neon.tech](https://neon.tech/)** (o bien PostgreSQL local instalado con pgAdmin).

---

## Guía de Instalación y Puesta en Marcha

### Paso 1: Clonar el Repositorio

Abre tu terminal y clona el proyecto en tu máquina:

```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO
```

---

### Paso 2: Base de Datos (Neon PostgreSQL)

Puedes usar una base de datos en la nube gratuita con **Neon** (altamente recomendado para que todo el equipo comparta los mismos datos) o una instancia local:

1. Inicia sesión en **[Neon.tech](https://neon.tech/)** y crea un nuevo proyecto llamado `nova-sound`.
2. Ve a la pestaña **SQL Editor** en Neon.
3. Abre el archivo [`database/Tablas.sql`](database/Tablas.sql), copia todo su contenido, pégalo en el SQL Editor y dale a **Run**. *(Esto crea las 18 tablas maestras)*.
4. Abre el archivo [`database/INSERTS_NOVA_SOUND.txt`](database/INSERTS_NOVA_SOUND.txt), copia todo su contenido, pégalo en el SQL Editor y dale a **Run**. *(Esto inserta catálogos, líneas, 50 usuarios, órdenes y piezas iniciales)*.
5. Ve a la sección **Dashboard** de Neon y copia tu **Connection String** (`postgresql://usuario:password@ep-xxxx.neon.tech/neondb?sslmode=require`).

---

### Paso 3: Configurar y Correr el Backend

Abre una terminal y entra en la carpeta del backend:

```bash
cd nova-sound-ui-BACKEND
```

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` para crear tu `.env`:
   * En Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   * En Linux/Mac/Git Bash:
     ```bash
     cp .env.example .env
     ```

3. **Editar el archivo `.env`:**
   Abre el archivo `.env` en tu editor de código y coloca la URL de conexión de tu base de datos de Neon:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL=postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

   El backend estará escuchando en `http://localhost:4000`. Puedes verificar que funciona abriendo en tu navegador:
   👉 `http://localhost:4000/api/health` — Debería responder `{ "status": "ok", ... }`.

5. *(Opcional)* **Ejecutar pruebas unitarias de calidad:**
   ```bash
   npm test
   ```

---

### Paso 4: Configurar y Correr el Frontend

**Abre una SEGUNDA terminal** (mantén la del backend corriendo) y sitúate en la carpeta del frontend:

```bash
cd nova-sound-ui-FRONTEND
```

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar la aplicación:**
   ```bash
   npm run dev
   ```

3. Abre tu navegador en:
   👉 **`http://localhost:5173`**

¡Listo! Ya verás la pantalla de inicio de sesión del sistema industrial.

---

## Credenciales de Acceso y Roles

El sistema cuenta con un catálogo de **50 usuarios reales** en base de datos divididos en 5 roles de planta.

Para facilitar las pruebas al equipo, en la pantalla de **Login** hay una barra inferior con **Botones de Acceso Rápido (1 clic)** que rellenan automáticamente los datos.

Si deseas ingresar manualmente, puedes usar cualquiera de estas credenciales:

| Rol | Usuario (`usuario_login`) | Nómina | Contraseña Demo |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin1` | `EMP-001` | `123456` *(o `hash680`)* |
| **Inspector de Calidad** | `inspector1` | `EMP-011` | `123456` *(o `hash123`)* |
| **Operador de Ensamble** | `operador1` | `EMP-021` | `123456` *(o `hash456`)* |
| **Supervisor de Línea** | `supervisor1` | `EMP-031` | `123456` *(o `hash789`)* |
| **Gerente de Planta** | `gerente1` | `EMP-041` | `123456` *(o `hash024`)* |

> 💡 **Nota:** En el Login puedes seleccionar la **Línea de Producción** (L1, L2, L3) y el **Turno** (Mañana, Tarde, Noche). La sesión se mantiene guardada localmente hasta que hagas clic en **"Cerrar Sesión"**.

---

## Recorrido del Flujo Operativo (Estaciones)

Para probar el ciclo completo de manufactura de una bocina en el sistema:

```mermaid
flowchart LR
    A["1. Login<br>(Rol + Línea + Turno)"] --> B["2. Ensamble<br>(Generar Serie)"]
    B --> C["3. Calidad<br>(Checklist ISO-9001)"]
    C --> D["4. Empaque<br>(Llenar y Sellar Caja)"]
    D --> E["5. Embarques<br>(Remisión y Salida)"]
    C -. Scrap .-> F["Desecho / Scrap"]
    C -. Retrabajo .-> B
    E --> G["6. Reportes & KPIs<br>(FPY, Pareto, Avance)"]
```

1. **Estación de Ensamble (`/ensamble`):**
   * Selecciona una Orden de Producción activa.
   * Haz clic en **"Generar Número de Serie"** (ej. `UN0055`) y presiona **"Registrar Ensamble de Pieza"**. La pieza ingresa a planta con estado de calidad *Pendiente*.

2. **Estación de Calidad (`/calidad`):**
   * En la parte superior verás la fila de piezas pendientes de inspección.
   * Haz clic sobre tu número de serie recién ensamblado para cargarlo al formulario.
   * Realiza el checklist de pruebas funcionales (Encendido, Audio, Carga USB-C, Bluetooth).
   * Dictamina la pieza como **1. APROBADA** (o Retrabajo / Retención / Scrap).
   * Al guardar, se genera el registro inmutable en `historial_unidades`.

3. **Estación de Empaque (`/empaque`):**
   * Selecciona una caja abierta o haz clic en **"Aperturar Nueva Caja"**.
   * Solo las unidades con dictamen **Aprobada** pueden ingresar. Escanea o selecciona la pieza para meterla a la caja.
   * Una vez alcanzada la capacidad deseada, presiona **"Cerrar y Sellar Caja"**. La caja queda lista para despacho.

4. **Estación de Embarques (`/embarques`):**
   * Selecciona una orden de embarque activa o programa una nueva asignando cliente y transportista.
   * Asigna la caja sellada al embarque.
   * Haz clic en **"Confirmar Salida de Transporte"** para despachar la remisión.

5. **Reportes y KPIs (`/reportes`):**
   * Observa en vivo el cálculo de métricas: piezas ensambladas contra la meta, **First Pass Yield (FPY)**, tasa de scrap, distribución y el **Pareto de fallas** más frecuentes.

6. **Configuración (`/configuracion`):**
   * Permite dar de alta nuevos usuarios en PostgreSQL, activar/desactivar accesos, ajustar parámetros del sistema y auditar la bitácora de eventos.

---

## Pruebas Automatizadas

El backend incluye una suite de pruebas con **Vitest** y **Supertest** orientadas a validar las reglas de negocio de la materia:

```bash
cd nova-sound-ui-BACKEND
npm test
```

### Casos de prueba cubiertos:
* **Registro exitoso de unidades serializadas:** Generación correcta del registro en base de datos.
* **Unicidad de serie (Prevención de duplicados):** El sistema rechaza con código `409 Conflict` si se intenta registrar una serie repetida.
* **Protocolo de Calidad ISO-9001:** Validación estricta que impide dictaminar una pieza como `Aprobada` si alguna prueba funcional eléctrica o acústica fue reprobada.
* **Trazabilidad de Historial:** Comprobación de que cada dictamen queda asentado en `historial_unidades` con usuario, fecha y diagnóstico.

---

## Guía para Subir a GitHub por Primera vez

Si vas a subir este proyecto a un nuevo repositorio en GitHub:

1. **Crear repositorio en GitHub:**
   Entra a [github.com/new](https://github.com/new) y crea un repositorio (ejemplo: `nova-sound-mes`). Déjalo vacío (sin README ni .gitignore porque ya los tenemos aquí).

2. **Inicializar y subir desde la raíz del proyecto:**
   Abre una terminal en la carpeta principal `WEB` y ejecuta:

   ```bash
   git init
   git add .
   git commit -m "feat: initial commit - Nova Sound MES con arquitectura en capas, login y Google Icons"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

> **Importante:** Gracias al archivo `.gitignore` configurado en la raíz, los archivos `.env` con contraseñas de la base de datos y las carpetas `node_modules` **NO** se subirán a GitHub, manteniendo tu repositorio limpio y seguro.

---

## Solución de Problemas Frecuentes

### 1. `Error: connect ECONNREFUSED 127.0.0.1:5432`
* **Causa:** El backend está intentando conectarse a PostgreSQL local pero el servicio no está corriendo o no existe.
* **Solución:** Abre `nova-sound-ui-BACKEND/.env` y asegúrate de configurar la variable `DATABASE_URL` con tu cadena de conexión de Neon (que termina en `.neon.tech/neondb?sslmode=require`).

### 2. `Solicitud desde otro origen bloqueada (CORS)`
* **Causa:** El frontend está corriendo en un puerto distinto al configurado en el backend.
* **Solución:** Verifica que `CORS_ORIGIN=http://localhost:5173` en el archivo `.env` del backend y reinicia el servidor (`npm run dev`).

### 3. Error al cerrar caja o dictaminar pieza
* **Causa:** Intentaste empacar una unidad que no tiene dictamen de `Aprobada` o la base de datos no tiene ejecutado el script de `INSERTS_NOVA_SOUND.txt`.
* **Solución:** Asegúrate de correr en Neon tanto `Tablas.sql` como `INSERTS_NOVA_SOUND.txt`.

---

## Equipo de Desarrollo

Proyecto desarrollado para la materia de **Calidad y Pruebas de Software**.
Tecnologías: **Node.js · Express · TypeScript · PostgreSQL · React · Vite · Vitest · Google Material Symbols**.
