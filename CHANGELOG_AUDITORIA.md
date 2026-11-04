# Comparativa Técnica Exhaustiva: Repositorio Base vs Versión Local Modificada

**Comparación entre:**
* 🔴 **Versión Remota Original (GitHub `main` - Commit `20c6463`):** [`https://github.com/ZeftarimLothric/nova-sound-web/tree/main`](https://github.com/ZeftarimLothric/nova-sound-web/tree/main)
* 🟢 **Versión Local Modificada (`nova_sound_web_repo`):** Proyecto actualizado con resolución de la auditoría [`Nova Sound – Registro de observaciones de revisión.pdf`](./Nova%20Sound%20–%20Registro%20de%20observaciones%20de%20revisi%C3%B3n.pdf)

---

## 🎯 Objetivo de este Documento
Este documento sirve para que cualquier integrante del equipo o revisor técnico pueda **ponerse al día en minutos**, entendiendo exactamente:
1. Qué archivos se crearon nuevos y cuáles se modificaron.
2. Qué regla de negocio o falla de auditoría del caso motivó cada cambio.
3. Cómo se transformó el flujo operativo del sistema en base de datos, backend y frontend.
4. Cómo probar y validar que los 4 incidentes críticos de la planta Nova Sound quedaron 100% resueltos.

---

## 📊 1. Resumen Estadístico de Cambios (Git Diff)

```text
36 archivos modificados
28 archivos nuevos (untracked creados para auditoría)
+6,796 líneas agregadas
-5,001 líneas refactorizadas / eliminadas
```

### Mapa de Archivos Clave Nuevos
```text
database/
├── schema_completo_actualizado.sql        # [NUEVO] Esquema relacional SSOT corregido en PostgreSQL
├── migracion_actualizacion.sql            # [NUEVO] Migración DDL idempotente para bases existentes
└── INSERTS_CATALOGOS_OFICIALES.sql        # [NUEVO] 9 roles, 15 permisos, catálogo oficial en 4 categorías

nova-sound-ui-BACKEND/
├── src/controllers/
│   ├── ensamble.controller.ts             # [NUEVO] Controlador de conteo y defectos de ensamble
│   └── pruebas.controller.ts              # [NUEVO] Controlador de prueba funcional (nacimiento de serie)
├── src/services/
│   ├── ensamble.service.ts                # [NUEVO] Lógica de conteo por orden/línea y catálogo defectos
│   ├── pruebas.service.ts                 # [NUEVO] Validación 4 checks y bautizo oficial de la serie
│   ├── cajas.service.ts                   # [NUEVO] Formación de cajas con modelo/color y validación INC-B
│   ├── embarques.service.ts               # [NUEVO] Filtrado por cliente y validación en tiempo real INC-C
│   ├── cierres-turno.service.ts           # [NUEVO] Matriz de balance por etapa para INC-A e INC-D
│   └── autorizaciones.service.ts          # [NUEVO] Gobernanza de reapertura y ajuste de turnos (RN-09/11)
├── src/repositories/
│   ├── ensamble.repository.ts             # [NUEVO] Consultas SQL de ensamble
│   ├── pruebas.repository.ts              # [NUEVO] Consultas SQL de prueba funcional
│   ├── cierres-turno.repository.ts        # [NUEVO] Consultas SQL de cierres
│   ├── autorizaciones.repository.ts       # [NUEVO] Consultas SQL de autorizaciones
│   └── reportes.repository.ts             # [NUEVO] Consultas SQL de pareto y balance
├── src/middlewares/
│   └── auth.middleware.ts                 # [NUEVO] Middleware RBAC con requirePermission(...)
└── tests/
    ├── incidentes.audit.test.ts           # [NUEVO] Pruebas de integración de INC-A, INC-B, INC-C, INC-D
    ├── pruebas_funcionales.test.ts        # [NUEVO] Pruebas de nacimiento de serie y 4 checks
    └── integracion_completa_bd.test.ts    # [NUEVO] Pruebas end-to-end sobre PostgreSQL en memoria

nova-sound-ui-FRONTEND/
├── src/components/
│   ├── OrdenesStation.tsx                 # [NUEVO] Pantalla de captura manual e importador CSV de órdenes (P-40)
│   ├── PruebasStation.tsx                 # [NUEVO] Estación de prueba funcional acústico/eléctrica (P-41)
│   ├── TrazabilidadStation.tsx            # [NUEVO] Ficha y búsqueda 360° por número de serie (P-42)
│   └── TurnosStation.tsx                  # [NUEVO] Pantalla formal de cierre de turno del Líder y autorizaciones (P-43)
└── src/Pages/Areas/
    ├── Ordenes.tsx                        # [NUEVO] Enrutamiento de Órdenes
    ├── Pruebas.tsx                        # [NUEVO] Enrutamiento de Pruebas
    ├── Trazabilidad.tsx                   # [NUEVO] Enrutamiento de Trazabilidad
    └── Turnos.tsx                         # [NUEVO] Enrutamiento de Cierres
```

---

## 🔍 2. Comparativa Sección por Sección

### 🗄️ A. Base de Datos (PostgreSQL)

| Aspecto | Versión Remota (`main` en GitHub) | Versión Local Modificada | Observación Auditada |
| :--- | :--- | :--- | :--- |
| **Tabla `cajas`** | No guardaba cliente, modelo ni color. Solo tenía `fecha_creacion`, `estado` y `id_cat_caja`. | Se añadieron: `id_cliente`, `id_modelo`, `id_color`, `capacidad`, `id_usuario_cerro` e `id_embarque_asignado`. | **BD-01, F-08, Incidente B** |
| **Historial de empaque** | No existía historial de unidades retiradas de una caja. | Se creó la tabla **`detalle_caja`** con `slot`, `fecha_empaque`, `retirada`, `fecha_retiro`, `motivo_retiro` e `id_usuario_retiro`. | **BD-07, F-09** |
| **Prueba Funcional** | `numero_serie` era `UNIQUE NOT NULL` antes de evaluar la pieza. Impedía registrar pruebas fallidas o re-pruebas. | `numero_serie` ahora es nullable. Se desglosan los 4 checks: `valida_encendido`, `valida_audio`, `valida_carga`, `valida_bluetooth`, y la serie se genera solo si todos son TRUE. | **BD-03, BD-04, F-04, RN-04** |
| **Defectos de Ensamble y Prueba** | Las fallas se guardaban como texto libre sin relación foránea (`tipo_falla VARCHAR`, `motivo VARCHAR`). | Tablas `defectos_ensamble` y `defectos_funcionales` con llaves foráneas formales (`FK`) a `catalogo_defectos`. | **BD-05, BD-06, P-14** |
| **Cierres de Turno** | No existía tabla de cierres. Se intentaba guardar un registro plano en bitácora general. | Se creó la tabla **`cierres_turno`** que consolida piezas ensambladas, probadas, aprobadas, retrabajadas, retenidas, scrap, empacadas, embarcadas y diferencia de balance. | **BD-12, F-12, Incidente A y D** |
| **Gobernanza / Autorizaciones** | No existía tabla de solicitudes. Cualquier usuario podía modificar o no había mecanismo para reabrir cajas. | Se creó la tabla **`solicitudes_autorizacion`** con estados `PENDIENTE`, `APROBADA`, `RECHAZADA`, motivo y usuario autorizador. | **BD-13, RN-09, RN-11, RN-14** |
| **Roles y Permisos** | Solo 5 roles planos sin tabla de permisos (`roles` tenía IDs 1 al 5). Permisos hardcodeados en UI. | Creación de tablas **`permisos`** y **`rol_permisos`** cargando los **9 roles oficiales del caso** y 15 permisos granulares. | **BD-14, P-37, RNF-01b** |
| **Integridad Referencial** | Estados como texto libre, llaves foráneas con nulos y sin CHECKs de rango. | Se agregaron constraints `CHECK` en estados, `NOT NULL` en relaciones obligatorias y `UNIQUE` en claves naturales. | **BD-16, RNF-02** |
| **Parámetros del Sistema** | Columna `valor` era de tipo `INT`; no permitía guardar textos ni booleanos. | Columna `valor` convertida a `VARCHAR(500)` con soporte para `SISTEMA_MODO_MANTENIMIENTO` y `MENSAJE_MANTENIMIENTO`. | **BD-17, P-39, RNF-07** |
| **Políticas por Cliente** | `clientes` no tenía especificaciones de empaque ni etiquetas. | Se agregaron columnas `permite_mezcla_colores`, `requiere_etiqueta` y `requisitos_empaque`. | **BD-18, RN-06, RN-08** |

---

### ⚙️ B. Backend API REST (Node.js + Express + TypeScript)

#### 1. Nacimiento del Número de Serie (F-03 y F-04)
* **Antes (`main`):** El endpoint `/api/ensamble` recibía un `numero_serie` generado por el frontend y creaba la fila en `unidades`.
* **Ahora:** 
  * `/api/ensamble/conteo` sólo recibe `id_orden`, `cantidad` y metadatos de línea/turno. **No se inventan números de serie.**
  * `/api/pruebas/evaluar` recibe la evaluación física de los 4 checks. Si los 4 son verdaderos, el servicio `pruebas.service.ts` invoca el generador oficial de serie (`NS-2026-XXXX`), crea la fila en `unidades` y la pone en estado inicial para Calidad. Si falla, guarda el defecto del catálogo y la pieza se va a diagnóstico sin serie.

#### 2. Prevención del Incidente B (Empaque de Cajas)
* **Antes (`main`):** El endpoint de empaque metía cualquier serie a la caja sin validar modelo ni color.
* **Ahora (`cajas.service.ts`):** 
  ```typescript
  // Validación 1: Dictamen de calidad
  if (unidad.id_estado_calidad !== EstadosCalidadEnum.APROBADA) {
    throw new BadRequestError('Sólo unidades APROBADAS por calidad pueden empacarse');
  }
  // Validación 2: Concordancia estricta de modelo
  if (unidad.id_modelo !== caja.id_modelo) {
    throw new BadRequestError('INCIDENTE B PREVENIDO: La unidad no coincide con el modelo de la caja');
  }
  // Validación 3: Política de color del cliente
  if (!cliente.permite_mezcla_colores && unidad.id_color !== caja.id_color) {
    throw new BadRequestError('POLÍTICA DE CLIENTE: No se permite mezcla de colores');
  }
  ```

#### 3. Prevención del Incidente C (Embarques)
* **Antes (`main`):** El endpoint `/api/embarques/:id/despachar` cambiaba el estado a 'Despachado' sin mirar adentro de las cajas.
* **Ahora (`embarques.service.ts`):**
  ```typescript
  // Revalidación en tiempo real al momento de salida
  const unidadesNoAprobadas = await embarquesRepository.getUnidadesRetenidasEnEmbarque(idEmbarque);
  if (unidadesNoAprobadas.length > 0) {
    throw new BadRequestError(
      `INCIDENTE C BLOQUEADO: Se detectaron ${unidadesNoAprobadas.length} unidades en retención o scrap dentro del embarque.`
    );
  }
  ```

#### 4. Prevención del Incidente A y D (Cierre de Turno y Discrepancias)
* **Antes (`main`):** No existían endpoints para cierres formales ni cálculo de balance.
* **Ahora (`cierres-turno.service.ts`):**
  * `GET /api/turnos/metricas`: Calcula en vivo ensambladas, probadas, liberadas, empacadas y embarcadas, determinando las unidades que permanecen en buffer.
  * `POST /api/turnos/cierre`: Firma y consolida el cierre del Líder de Línea.
  * `PATCH /api/turnos/cierres/:id/corregir`: Solo se ejecuta si existe una autorización previa aprobada por el Gerente de Producción (RN-11).

#### 5. Middleware de Control de Acceso Granular (`auth.middleware.ts`)
* Se eliminó el esquema permisivo. Ahora cada ruta crítica está protegida por permisos oficiales de base de datos:
  * `requirePermission('ORDENES_GESTIONAR')`
  * `requirePermission('ENSAMBLE_REGISTRAR')`
  * `requirePermission('PRUEBA_EVALUAR')`
  * `requirePermission('CALIDAD_DICTAMINAR')`
  * `requirePermission('EMPAQUE_OPERAR')`
  * `requirePermission('EMPAQUE_AUTORIZAR_REAPERTURA')`
  * `requirePermission('EMBARQUE_OPERAR')`
  * `requirePermission('TURNO_CERRAR')`
  * `requirePermission('TURNO_AUTORIZAR_CORRECCION')`
  * `requirePermission('SISTEMAS_ADMIN')`

---

### 🖥️ C. Frontend HMI (React + TypeScript + Vite)

#### 1. Sistema de Diseño Industrial (Arknights: Endfield)
* **Antes (`main`):** Paleta azul oscura estándar, botones genéricos con emojis en títulos y tablas.
* **Ahora:**
  * **Cero Tailwind:** Rediseñado en CSS puro modular de alto rendimiento ([`src/index.css`](file:///Users/xxnoubmaster69xx/code%20sheet/Calida%20y%20pruebas%20/diagrama%20base%20de%20datos%20sistemas/nova_sound_web_repo/nova-sound-ui-FRONTEND/src/index.css)).
  * **Paleta Táctica:** Amarillo advertencia (`#fffa00`), Negro base profundo (`#0a0b0d`), Gris técnico (`#22262f`), Blanco de lectura (`#ffffff`).
  * **Texturas CSS Nativas:**
    * `.tex-carbon`: Fibra de carbono tejida en headers y botones.
    * `.tex-warn-stripes`: Franjas diagonales de advertencia.
    * `.tex-grid`: Cuadrícula técnica blueprint.
    * `.tex-scanlines`: Líneas de escaneo estilo terminal SCADA.
    * `.tex-ruler-top`: Regla milimétrica en el encabezado.
    * `.chamfer-sm`, `.chamfer-btn`: Cortes biselados con `clip-path`.
  * **Cero Emojis:** Todos los indicadores son etiquetas monoespaciadas (`[PASS]`, `[FAIL]`, `[WARN]`, `[OK]`, `[SLOT]`).

#### 2. Las 4 Nuevas Pantallas Integradas
1. **`[01]` Órdenes de Producción ([`OrdenesStation.tsx`](file:///Users/xxnoubmaster69xx/code%20sheet/Calida%20y%20pruebas%20/diagrama%20base%20de%20datos%20sistemas/nova_sound_web_repo/nova-sound-ui-FRONTEND/src/components/OrdenesStation.tsx)):**
   * Alta manual con validación de cliente, modelo y color.
   * Importación masiva por archivo o texto CSV.
   * Asignación directa a líneas L1, L2 y L3 con registro de usuario y fecha (P-40).
2. **`[03]` Prueba Funcional ([`PruebasStation.tsx`](file:///Users/xxnoubmaster69xx/code%20sheet/Calida%20y%20pruebas%20/diagrama%20base%20de%20datos%20sistemas/nova_sound_web_repo/nova-sound-ui-FRONTEND/src/components/PruebasStation.tsx)):**
   * Banco de prueba interactivo con los 4 parámetros: *Encendido*, *Audio THD*, *Carga USB* y *Bluetooth*.
   * Simuladores rápidos de prueba: *Fixture All Pass*, *Falla de Audio*, *Unidad Muerta*.
   * Al aprobar, emite la serie oficial en un badge táctico amarillo (P-41).
3. **`[360]` Trazabilidad 360° ([`TrazabilidadStation.tsx`](file:///Users/xxnoubmaster69xx/code%20sheet/Calida%20y%20pruebas%20/diagrama%20base%20de%20datos%20sistemas/nova_sound_web_repo/nova-sound-ui-FRONTEND/src/components/TrazabilidadStation.tsx)):**
   * Buscador universal por número de serie.
   * Muestra la tarjeta maestra de la unidad y el estado de sus 5 etapas (Ensamble, Prueba, Calidad, Empaque y Embarques) con bitácora cronológica (P-42).
4. **`[07]` Cierre de Turno & Autorizaciones ([`TurnosStation.tsx`](file:///Users/xxnoubmaster69xx/code%20sheet/Calida%20y%20pruebas%20/diagrama%20base%20de%20datos%20sistemas/nova_sound_web_repo/nova-sound-ui-FRONTEND/src/components/TurnosStation.tsx)):**
   * Visualizador de la Matriz de Balance por Etapa (Incidente A).
   * Consolidación formal de turno del Líder con porcentaje de cumplimiento de objetivo.
   * Bandeja interactiva para que supervisores autoricen reaperturas de cajas o correcciones de turno.
   * Botón de descarga de reporte a archivo CSV (P-43).

#### 3. Refactorización de las Estaciones Existentes
* **Ensamble (`EnsambleStation.tsx`):** Selector de orden activa asignada a la línea; conteo por lotes (+1, +5, +10, +20 piezas); registro de defectos mecánicos de ensamble (P-11 a P-14).
* **Calidad (`CalidadStation.tsx`):** Se eliminaron los 4 checks de prueba funcional (movidos a su estación propia). Dictamen visual en los 4 estados oficiales (Aprobada, En retrabajo, En retención, Scrap); soporte para re-dictaminar unidades que regresan de retrabajo (P-16 a P-20).
* **Empaque (`EmpaqueStation.tsx`):** Apertura formal pidiendo Cliente, Modelo y Color; barra de progreso y ocupación contra capacidad (ej. 4/6 pzas); botones Cerrar caja, Solicitar reapertura y Retirar unidad con justificación obligatoria (P-21 a P-25).
* **Embarques (`EmbarquesStation.tsx`):** Programación con transportista, chofer y placas; filtro automático de cajas cerradas exclusivas del cliente del pedido; confirmación de salida con revalidación de calidad (P-26 a P-29).
* **Reportes (`ReportesStation.tsx`):** Separación visual y estadística de Retrabajo y Retención; pareto oficial estructurado en las 4 categorías; exportador a CSV (P-31 a P-34).
* **Topbar (`Topbar.tsx`):** Selector de los **9 roles oficiales del caso**, selectores rápidos de línea (L1/L2/L3) y turno (Mañana/Tarde), y banner táctico de advertencia en caso de mantenimiento (P-37, P-39).

---

## 🧪 3. Guía Rápida para que tu Amigo Corra las Pruebas

Para validar los cambios en tu entorno local sin tocar nada productivo:

### 1. Correr las pruebas unitarias y de integración de los Incidentes:
```bash
cd nova-sound-ui-BACKEND
npm install
npm test
```
**Qué verifica esta suite:**
* `incidentes.audit.test.ts`:
  * **INC-A:** Comprueba que el balance de inventario por etapa detecte cualquier merma o buffer intermedio.
  * **INC-B:** Comprueba que intentar empacar una serie NS-SPORT en una caja NS-PRO sea rechazado con error 400.
  * **INC-C:** Comprueba que intentar despachar un embarque con una pieza en estado 'En retención' aborte la salida.
  * **INC-D:** Comprueba que la corrección de un cierre de turno exija una autorización aprobada en base de datos.
* `pruebas_funcionales.test.ts`:
  * Comprueba que aprobar los 4 checks genere la serie oficial `NS-2026-XXXX`.
  * Comprueba que fallar un check registre el defecto sin generar serie.

### 2. Iniciar la Interfaz de Usuario:
```bash
cd ../nova-sound-ui-FRONTEND
npm install
npm run dev
```
Abre en tu navegador `http://localhost:5173/` y podrás interactuar con las 11 estaciones y probar los 9 roles desde el selector superior.

