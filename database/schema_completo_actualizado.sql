-- ==============================================================================
-- NOVA SOUND MANUFACTURING S.A. DE C.V.
-- ESQUEMA COMPLETO Y CORREGIDO DE BASE DE DATOS (POSTGRESQL / NEON)
-- Cumplimiento estricto 1:1 con "Nova Sound – Registro de observaciones de revisión":
-- BD-01 a BD-20, Flujo F-01 a F-12, Reglas RN-01 a RN-14, RF-01 a RF-33,
-- RNF-01 a RNF-09 e Incidentes INC-A, INC-B, INC-C, INC-D.
-- ==============================================================================

-- ==============================================================================
-- 1. GLOBALES: Catálogos Maestros y Tablas Base
-- ==============================================================================

-- P-37 / BD-14 / RNF-01b: 9 roles oficiales de planta
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255)
);

-- BD-14 / RN-14: Tabla de permisos del sistema (RBAC)
CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    codigo_permiso VARCHAR(80) UNIQUE NOT NULL,
    nombre_permiso VARCHAR(120) NOT NULL,
    modulo VARCHAR(50) NOT NULL
);

-- BD-14 / RN-14: Relación Muchos a Muchos Roles <-> Permisos
CREATE TABLE IF NOT EXISTS rol_permisos (
    id_rol INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    id_permiso INT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- BD-02 / RN-07: Modelos y Capacidad única oficial por caja (MINI: 12, SPORT: 8, PRO: 6, MAX: 4)
-- Nota BD-02: Se eliminó la tabla redundante cat_cajas; modelos.capacidad_caja es la única fuente de verdad.
CREATE TABLE IF NOT EXISTS modelos (
    id SERIAL PRIMARY KEY,
    nombre_modelo VARCHAR(50) UNIQUE NOT NULL,
    capacidad_caja INT NOT NULL CHECK (capacidad_caja > 0),
    descripcion VARCHAR(255)
);

-- BD-16: Colores con restricción UNIQUE NOT NULL
CREATE TABLE IF NOT EXISTS colores (
    id SERIAL PRIMARY KEY,
    nombre_color VARCHAR(50) UNIQUE NOT NULL
);

-- BD-16 / BD-18 / RN-06 / RN-08: Clientes con UNIQUE, requiere_etiqueta y requisitos_empaque
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(100) UNIQUE NOT NULL,
    tipo_cliente VARCHAR(50) NOT NULL DEFAULT 'Distribuidor',
    permite_mezcla_colores BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_etiqueta BOOLEAN NOT NULL DEFAULT FALSE,
    requisitos_empaque TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Líneas de producción
CREATE TABLE IF NOT EXISTS lineas (
    id SERIAL PRIMARY KEY,
    nombre_linea VARCHAR(50) UNIQUE NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- Turnos de trabajo
CREATE TABLE IF NOT EXISTS turnos (
    id SERIAL PRIMARY KEY,
    nombre_turno VARCHAR(50) UNIQUE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

-- RF-14: Catálogo de defectos en las 4 categorías oficiales:
-- 'Apariencia', 'Funcional', 'Identificación', 'Empaque'
CREATE TABLE IF NOT EXISTS catalogo_defectos (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Apariencia', 'Funcional', 'Identificación', 'Empaque')),
    descripcion VARCHAR(255) UNIQUE NOT NULL,
    severidad VARCHAR(20) NOT NULL DEFAULT 'Mayor' CHECK (severidad IN ('Crítico', 'Mayor', 'Menor')),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Estados de calidad y bandera de liberación a empaque (RN-01, RN-02, RN-13)
CREATE TABLE IF NOT EXISTS catalogo_estados_calidad (
    id SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) UNIQUE NOT NULL CHECK (nombre_estado IN ('Aprobada', 'En retrabajo', 'En retención', 'Scrap')),
    permite_empaque BOOLEAN NOT NULL DEFAULT FALSE
);

-- BD-17 / RNF-07 / RNF-08: valor VARCHAR con tipo_dato para guardar textos como aviso de mantenimiento
CREATE TABLE IF NOT EXISTS parametros_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(255) NOT NULL,
    tipo_dato VARCHAR(20) NOT NULL DEFAULT 'STRING' CHECK (tipo_dato IN ('STRING', 'INT', 'BOOLEAN', 'JSON')),
    descripcion VARCHAR(255)
);

-- Transportistas de embarques
CREATE TABLE IF NOT EXISTS transportista (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rfc VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==============================================================================
-- 2. USUARIOS Y SEGURIDAD (RNF-01a, RNF-01b, RNF-01c)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nomina VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    usuario_login VARCHAR(50) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL REFERENCES roles(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. GOBERNANZA: Autorizaciones y Bitácora Única (BD-13, BD-15, RN-09, RN-11, RN-12)
-- ==============================================================================

-- BD-13 / RN-09 / RN-11: Solicitudes formales de autorización
CREATE TABLE IF NOT EXISTS solicitudes_autorizacion (
    id SERIAL PRIMARY KEY,
    folio_solicitud VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('REAPERTURA_CAJA', 'CORRECCION_CIERRE_TURNO', 'RETIRO_UNIDAD', 'RETRABAJO_ESPECIAL')),
    id_referencia INT NOT NULL,
    id_usuario_solicita INT NOT NULL REFERENCES usuarios(id),
    motivo TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
    id_usuario_autoriza INT REFERENCES usuarios(id),
    comentario_resolucion TEXT,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP
);

-- BD-15 / RN-12 / RNF-04: Bitácora única de auditoría con valor anterior, nuevo, motivo y autorización
CREATE TABLE IF NOT EXISTS bitacora (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50),
    id_registro_afectado INT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    motivo TEXT,
    id_autorizacion INT REFERENCES solicitudes_autorizacion(id)
);

CREATE TABLE IF NOT EXISTS respaldos_log (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    archivo_respaldo VARCHAR(255),
    exitoso BOOLEAN NOT NULL
);

-- ==============================================================================
-- 4. ALMACÉN Y PEDIDOS DE CLIENTES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS pedido (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) UNIQUE NOT NULL,
    id_cliente INT NOT NULL REFERENCES clientes(id),
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_compromiso DATE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Producción', 'Listo para Despacho', 'Embarcado', 'Cancelado'))
);

CREATE TABLE IF NOT EXISTS pedido_detalle (
    id SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    id_modelo INT NOT NULL REFERENCES modelos(id),
    id_color INT NOT NULL REFERENCES colores(id),
    cantidad_solicitada INT NOT NULL CHECK (cantidad_solicitada > 0)
);

-- ==============================================================================
-- 5. PRODUCCIÓN, ÓRDENES DE TRABAJO Y OBJETIVOS (F-01, F-02, RF-01..05, BD-11)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ordenes (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) UNIQUE NOT NULL,
    id_pedido INT REFERENCES pedido(id),
    id_cliente INT NOT NULL REFERENCES clientes(id),
    id_modelo INT NOT NULL REFERENCES modelos(id),
    id_color INT NOT NULL REFERENCES colores(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_compromiso DATE NOT NULL,
    id_usuario_registro INT NOT NULL REFERENCES usuarios(id),
    estado VARCHAR(50) NOT NULL DEFAULT 'Programada' CHECK (estado IN ('Programada', 'En Proceso', 'Pausada', 'Completada', 'Cancelada')),
    id_linea_asignada INT REFERENCES lineas(id),
    id_usuario_asigno INT REFERENCES usuarios(id),
    fecha_asignacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_ordenes (
    id SERIAL PRIMARY KEY,
    id_orden INT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT
);

-- BD-11 / RF-05: Objetivos con clave compuesta (fecha + turno + línea + modelo)
CREATE TABLE IF NOT EXISTS objetivos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    id_turno INT NOT NULL REFERENCES turnos(id),
    id_linea INT NOT NULL REFERENCES lineas(id),
    id_modelo INT NOT NULL REFERENCES modelos(id),
    cantidad_objetivo INT NOT NULL CHECK (cantidad_objetivo > 0),
    CONSTRAINT uq_objetivo_meta UNIQUE (fecha, id_turno, id_linea, id_modelo)
);

-- ==============================================================================
-- 6. ENSAMBLE (F-03, RF-04, BD-06, BD-10: Conteo sin número de serie, sin id_modelo)
-- ==============================================================================

-- BD-10: Con id_linea y fecha_produccion; sin id_modelo (no duplica a la orden)
CREATE TABLE IF NOT EXISTS ensamble (
    id SERIAL PRIMARY KEY,
    id_orden INT NOT NULL REFERENCES ordenes(id),
    id_linea INT NOT NULL REFERENCES lineas(id),
    id_turno INT NOT NULL REFERENCES turnos(id),
    id_operador INT NOT NULL REFERENCES usuarios(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha_produccion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registro INT NOT NULL REFERENCES usuarios(id)
);

-- BD-06: Defectos de ensamble con FK a ensamble y al catálogo de defectos
CREATE TABLE IF NOT EXISTS defectos_ensamble (
    id SERIAL PRIMARY KEY,
    id_ensamble INT NOT NULL REFERENCES ensamble(id) ON DELETE CASCADE,
    id_defecto INT NOT NULL REFERENCES catalogo_defectos(id),
    etapa VARCHAR(50) NOT NULL DEFAULT 'Ensamble Mecánico',
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    motivo VARCHAR(255),
    id_usuario_registro INT NOT NULL REFERENCES usuarios(id),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. PRUEBA FUNCIONAL Y DEFECTOS DE PRUEBA (F-04, RN-04, BD-03, BD-04, BD-05)
-- ==============================================================================

-- BD-03 / BD-04: Sin numero_serie en prueba_funcional (permite fallas y re-pruebas);
-- CHECK estricto de coherencia con los 4 checks.
CREATE TABLE IF NOT EXISTS prueba_funcional (
    id SERIAL PRIMARY KEY,
    id_orden INT NOT NULL REFERENCES ordenes(id),
    id_linea INT NOT NULL REFERENCES lineas(id),
    id_turno INT NOT NULL REFERENCES turnos(id),
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    valida_encendido BOOLEAN NOT NULL DEFAULT FALSE,
    valida_audio BOOLEAN NOT NULL DEFAULT FALSE,
    valida_carga BOOLEAN NOT NULL DEFAULT FALSE,
    valida_bluetooth BOOLEAN NOT NULL DEFAULT FALSE,
    estado_prueba VARCHAR(20) NOT NULL CHECK (estado_prueba IN ('Aprobada', 'Reprobada')),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_prueba_consistencia CHECK (
        (valida_encendido = TRUE AND valida_audio = TRUE AND valida_carga = TRUE AND valida_bluetooth = TRUE AND estado_prueba = 'Aprobada')
        OR
        ((valida_encendido = FALSE OR valida_audio = FALSE OR valida_carga = FALSE OR valida_bluetooth = FALSE) AND estado_prueba = 'Reprobada')
    )
);

-- BD-05 / RF-11: Tabla prueba_defectos con FK al catálogo oficial de defectos
CREATE TABLE IF NOT EXISTS prueba_defectos (
    id SERIAL PRIMARY KEY,
    id_prueba INT NOT NULL REFERENCES prueba_funcional(id) ON DELETE CASCADE,
    id_defecto INT NOT NULL REFERENCES catalogo_defectos(id),
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    descripcion TEXT,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. EMPAQUE Y CAJAS (BD-01, BD-02, RN-05 a RN-09)
-- ==============================================================================

-- BD-01 / BD-02: Cajas con codigo_caja, id_cliente, id_modelo, id_color, id_usuario_cierra (sin cat_cajas)
CREATE TABLE IF NOT EXISTS cajas (
    id SERIAL PRIMARY KEY,
    codigo_caja VARCHAR(50) UNIQUE NOT NULL,
    id_cliente INT NOT NULL REFERENCES clientes(id),
    id_modelo INT NOT NULL REFERENCES modelos(id),
    id_color INT REFERENCES colores(id), -- NULL permitido solo si clientes.permite_mezcla_colores = TRUE
    estado VARCHAR(20) NOT NULL DEFAULT 'Abierta' CHECK (estado IN ('Abierta', 'Cerrada')),
    id_usuario_creador INT NOT NULL REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_cierra INT REFERENCES usuarios(id),
    fecha_cierre TIMESTAMP
);

-- BD-13 / RN-09: Bitácora de permisos ligada a solicitudes_autorizacion
CREATE TABLE IF NOT EXISTS bitacora_permisos (
    id SERIAL PRIMARY KEY,
    id_caja INT NOT NULL REFERENCES cajas(id),
    id_solicitud INT REFERENCES solicitudes_autorizacion(id),
    id_usuario_autoriza INT NOT NULL REFERENCES usuarios(id),
    motivo VARCHAR(255) NOT NULL,
    fecha_autorizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_movimientos (
    id SERIAL PRIMARY KEY,
    id_caja INT NOT NULL REFERENCES cajas(id),
    evento VARCHAR(100) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    detalles TEXT
);

-- ==============================================================================
-- 9. UNIDADES, DETALLE DE CAJA Y CALIDAD (BD-07, BD-08, BD-09, RN-01..04, RN-13)
-- ==============================================================================

-- BD-08 / RN-01 / RN-03 / RN-04: La unidad nace de una prueba funcional aprobada (id_prueba UNIQUE NOT NULL)
-- id_estado_calidad inicia en NULL (Pendiente de inspección de Calidad, F-04 -> F-05) y solo pasa a 1 ('Aprobada') tras dictamen de Calidad (RN-01).
CREATE TABLE IF NOT EXISTS unidades (
    id SERIAL PRIMARY KEY,
    id_prueba INT UNIQUE NOT NULL REFERENCES prueba_funcional(id),
    id_orden INT NOT NULL REFERENCES ordenes(id),
    id_linea INT NOT NULL REFERENCES lineas(id),
    id_turno INT NOT NULL REFERENCES turnos(id),
    numero_serie VARCHAR(50) UNIQUE NOT NULL,
    id_estado_calidad INT REFERENCES catalogo_estados_calidad(id),
    id_caja INT REFERENCES cajas(id),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BD-07 / RF-19: Tabla detalle_caja con historial de entradas, fecha de retiro y motivo
CREATE TABLE IF NOT EXISTS detalle_caja (
    id SERIAL PRIMARY KEY,
    id_caja INT NOT NULL REFERENCES cajas(id),
    id_unidad INT NOT NULL REFERENCES unidades(id),
    id_usuario_asigna INT NOT NULL REFERENCES usuarios(id),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_retira INT REFERENCES usuarios(id),
    fecha_retiro TIMESTAMP,
    motivo_retiro VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS historial_unidades (
    id SERIAL PRIMARY KEY,
    id_unidad INT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    motivo VARCHAR(255),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BD-09 / RF-12: Inspecciones de Calidad con columna id_estado_resultado
CREATE TABLE IF NOT EXISTS inspecciones_calidad (
    id SERIAL PRIMARY KEY,
    id_unidad INT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    id_inspector INT NOT NULL REFERENCES usuarios(id),
    id_estado_resultado INT NOT NULL REFERENCES catalogo_estados_calidad(id),
    fecha_inspeccion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT
);

CREATE TABLE IF NOT EXISTS detalle_defectos_unidad (
    id SERIAL PRIMARY KEY,
    id_inspeccion INT NOT NULL REFERENCES inspecciones_calidad(id) ON DELETE CASCADE,
    id_defecto INT NOT NULL REFERENCES catalogo_defectos(id)
);

-- ==============================================================================
-- 10. EMBARQUES Y LOGÍSTICA (BD-19, F-10, F-11, RN-10, RNF-03)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS embarque (
    id SERIAL PRIMARY KEY,
    referencia_embarque VARCHAR(50) UNIQUE NOT NULL,
    id_pedido INT NOT NULL REFERENCES pedido(id),
    id_cliente INT NOT NULL REFERENCES clientes(id),
    id_transportista INT NOT NULL REFERENCES transportista(id),
    fecha_programada DATE NOT NULL,
    fecha_salida TIMESTAMP,
    estado VARCHAR(50) NOT NULL DEFAULT 'Programado' CHECK (estado IN ('Programado', 'En Carga', 'Despachado', 'Cancelado')),
    observaciones TEXT,
    id_usuario_creo INT NOT NULL REFERENCES usuarios(id),
    id_usuario_confirmo INT REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS embarque_caja (
    id SERIAL PRIMARY KEY,
    id_embarque INT NOT NULL REFERENCES embarque(id) ON DELETE CASCADE,
    id_caja INT NOT NULL REFERENCES cajas(id),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_asigna INT NOT NULL REFERENCES usuarios(id),
    fecha_retiro TIMESTAMP,
    id_usuario_retira INT REFERENCES usuarios(id),
    motivo_retiro VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS embarque_historial (
    id SERIAL PRIMARY KEY,
    id_embarque INT NOT NULL REFERENCES embarque(id) ON DELETE CASCADE,
    operacion VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    id_caja INT REFERENCES cajas(id),
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalle TEXT
);

-- ==============================================================================
-- 11. CIERRES DE TURNO (BD-12, F-12, RN-11, RF-07, RF-33, INC-A, INC-D)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cierres_turno (
    id SERIAL PRIMARY KEY,
    folio_cierre VARCHAR(50) UNIQUE NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    id_turno INT NOT NULL REFERENCES turnos(id),
    id_linea INT NOT NULL REFERENCES lineas(id),
    id_lider INT NOT NULL REFERENCES usuarios(id),
    piezas_ensambladas INT NOT NULL DEFAULT 0,
    piezas_probadas INT NOT NULL DEFAULT 0,
    piezas_liberadas INT NOT NULL DEFAULT 0,
    piezas_empacadas INT NOT NULL DEFAULT 0,
    piezas_embarcadas INT NOT NULL DEFAULT 0,
    piezas_scrap INT NOT NULL DEFAULT 0,
    diferencia_balance INT NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'Cerrado' CHECK (estado IN ('Abierto', 'Cerrado', 'En Revisión', 'Corregido')),
    fecha_hora_cierre TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
);

-- ==============================================================================
-- 12. TRIGGERS Y FUNCIONES DE NEGOCIO EN POSTGRESQL (BD-20)
-- ==============================================================================

-- Trigger 0: Validar al crear/actualizar caja que si el cliente NO permite mezcla de colores, id_color sea obligatorio (RN-06)
CREATE OR REPLACE FUNCTION fn_validar_apertura_caja()
RETURNS TRIGGER AS $$
DECLARE
    v_permite_mezcla BOOLEAN;
BEGIN
    SELECT permite_mezcla_colores INTO v_permite_mezcla
    FROM clientes WHERE id = NEW.id_cliente;

    IF v_permite_mezcla = FALSE AND NEW.id_color IS NULL THEN
        RAISE EXCEPTION 'Violación de Cliente (RN-06): El cliente no permite mezcla de colores; debe especificar id_color al abrir la caja.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_apertura_caja ON cajas;
CREATE TRIGGER trg_validar_apertura_caja
BEFORE INSERT OR UPDATE ON cajas
FOR EACH ROW
EXECUTE FUNCTION fn_validar_apertura_caja();

-- Trigger 1: Validación estricta para empaque (RN-01, RN-02, RN-05, RN-06, RN-07)
-- Previene Incidente INC-B (mezcla de modelos o colores prohibidos)
CREATE OR REPLACE FUNCTION fn_validar_empaque_unidad()
RETURNS TRIGGER AS $$
DECLARE
    v_caja RECORD;
    v_unidad RECORD;
    v_piezas_actuales INT;
BEGIN
    SELECT c.*, m.capacidad_caja, cli.permite_mezcla_colores
    INTO v_caja
    FROM cajas c
    JOIN modelos m ON c.id_modelo = m.id
    JOIN clientes cli ON c.id_cliente = cli.id
    WHERE c.id = NEW.id_caja;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La caja con ID % no existe.', NEW.id_caja;
    END IF;

    IF v_caja.estado <> 'Abierta' THEN
        RAISE EXCEPTION 'No se puede agregar unidades: la caja % está CERRADA.', v_caja.codigo_caja;
    END IF;

    SELECT u.*, o.id_modelo AS modelo_unidad, o.id_color AS color_unidad, COALESCE(ec.permite_empaque, FALSE) AS permite_empaque
    INTO v_unidad
    FROM unidades u
    JOIN ordenes o ON u.id_orden = o.id
    LEFT JOIN catalogo_estados_calidad ec ON u.id_estado_calidad = ec.id
    WHERE u.id = NEW.id_unidad;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La unidad con ID % no existe.', NEW.id_unidad;
    END IF;

    IF v_unidad.id_estado_calidad IS NULL OR v_unidad.permite_empaque = FALSE THEN
        RAISE EXCEPTION 'Violación de Calidad (RN-01): La unidad % no está liberada por Calidad para empaque.', v_unidad.numero_serie;
    END IF;

    IF v_caja.id_modelo <> v_unidad.modelo_unidad THEN
        RAISE EXCEPTION 'Violación de Empaque (RN-05): La caja es para el modelo ID % y la unidad es modelo ID %.',
            v_caja.id_modelo, v_unidad.modelo_unidad;
    END IF;

    IF v_caja.permite_mezcla_colores = FALSE THEN
        IF v_caja.id_color IS NULL OR v_caja.id_color <> v_unidad.color_unidad THEN
            RAISE EXCEPTION 'Violación de Cliente (RN-06): El cliente no permite mezcla de colores. Color caja %, color unidad %.',
                v_caja.id_color, v_unidad.color_unidad;
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_piezas_actuales
    FROM detalle_caja
    WHERE id_caja = NEW.id_caja AND activo = TRUE;

    IF v_piezas_actuales >= v_caja.capacidad_caja THEN
        RAISE EXCEPTION 'Violación de Capacidad (RN-07): La caja % alcanzó su límite máximo de % piezas.',
            v_caja.codigo_caja, v_caja.capacidad_caja;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_empaque_unidad ON detalle_caja;
CREATE TRIGGER trg_validar_empaque_unidad
BEFORE INSERT ON detalle_caja
FOR EACH ROW
EXECUTE FUNCTION fn_validar_empaque_unidad();

-- Trigger 2: Validar al asignar caja a embarque que esté cerrada y sea del cliente correcto (RN-10)
CREATE OR REPLACE FUNCTION fn_validar_asignacion_embarque_caja()
RETURNS TRIGGER AS $$
DECLARE
    v_caja RECORD;
    v_embarque RECORD;
BEGIN
    SELECT * INTO v_caja FROM cajas WHERE id = NEW.id_caja;
    SELECT * INTO v_embarque FROM embarque WHERE id = NEW.id_embarque;

    IF v_caja.estado <> 'Cerrada' THEN
        RAISE EXCEPTION 'Violación de Embarque (RN-10): Solo se pueden asignar cajas CERRADAS al embarque.';
    END IF;

    IF v_caja.id_cliente <> v_embarque.id_cliente THEN
        RAISE EXCEPTION 'Violación de Embarque (RN-10): El cliente de la caja (%) no coincide con el cliente del embarque (%).',
            v_caja.id_cliente, v_embarque.id_cliente;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_asignacion_embarque_caja ON embarque_caja;
CREATE TRIGGER trg_validar_asignacion_embarque_caja
BEFORE INSERT ON embarque_caja
FOR EACH ROW
EXECUTE FUNCTION fn_validar_asignacion_embarque_caja();

-- Trigger 3: Revalidación de Calidad al Confirmar Salida de Embarque (F-11, INC-C)
CREATE OR REPLACE FUNCTION fn_validar_despacho_embarque()
RETURNS TRIGGER AS $$
DECLARE
    v_unidades_no_liberadas INT;
    v_cajas_abiertas INT;
BEGIN
    IF NEW.estado = 'Despachado' AND (OLD.estado IS DISTINCT FROM 'Despachado') THEN
        SELECT COUNT(*) INTO v_cajas_abiertas
        FROM embarque_caja ec
        JOIN cajas c ON ec.id_caja = c.id
        WHERE ec.id_embarque = NEW.id 
          AND ec.fecha_retiro IS NULL
          AND c.estado <> 'Cerrada';

        IF v_cajas_abiertas > 0 THEN
            RAISE EXCEPTION 'Bloqueo de Embarque (RN-10): Hay % caja(s) abiertas asignadas al embarque.', v_cajas_abiertas;
        END IF;

        SELECT COUNT(*) INTO v_unidades_no_liberadas
        FROM embarque_caja ec
        JOIN detalle_caja dc ON ec.id_caja = dc.id_caja AND dc.activo = TRUE
        JOIN unidades u ON dc.id_unidad = u.id
        LEFT JOIN catalogo_estados_calidad ec_cal ON u.id_estado_calidad = ec_cal.id
        WHERE ec.id_embarque = NEW.id
          AND ec.fecha_retiro IS NULL
          AND (u.id_estado_calidad IS NULL OR COALESCE(ec_cal.permite_empaque, FALSE) = FALSE);

        IF v_unidades_no_liberadas > 0 THEN
            RAISE EXCEPTION 'Bloqueo de Embarque (Incidente C / F-11): Existen % unidades dentro del embarque con estado de Calidad NO liberado (pendientes, retenidas o scrap).', v_unidades_no_liberadas;
        END IF;

        NEW.fecha_salida := CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_despacho_embarque ON embarque;
CREATE TRIGGER trg_validar_despacho_embarque
BEFORE UPDATE ON embarque
FOR EACH ROW
EXECUTE FUNCTION fn_validar_despacho_embarque();

-- ==============================================================================
-- 13. ÍNDICES DE RENDIMIENTO (RNF-05)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_unidades_numero_serie ON unidades(numero_serie);
CREATE INDEX IF NOT EXISTS idx_unidades_estado ON unidades(id_estado_calidad);
CREATE INDEX IF NOT EXISTS idx_unidades_orden ON unidades(id_orden);
CREATE INDEX IF NOT EXISTS idx_cajas_codigo ON cajas(codigo_caja);
CREATE INDEX IF NOT EXISTS idx_cajas_cliente_modelo ON cajas(id_cliente, id_modelo);
CREATE INDEX IF NOT EXISTS idx_detalle_caja_activo ON detalle_caja(id_caja, activo);
CREATE INDEX IF NOT EXISTS idx_embarque_ref ON embarque(referencia_embarque);
CREATE INDEX IF NOT EXISTS idx_embarque_caja_activa ON embarque_caja(id_embarque, fecha_retiro);
CREATE INDEX IF NOT EXISTS idx_cierres_turno_fecha_linea ON cierres_turno(fecha, id_linea, id_turno);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo_fecha ON bitacora(modulo, fecha_hora);
