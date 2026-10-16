-- ==============================================================================
-- 1. GLOBALES (Catálogos Maestros y Tablas Base sin dependencias)
-- ==============================================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

CREATE TABLE modelos (
    id SERIAL PRIMARY KEY,
    nombre_modelo VARCHAR(50) UNIQUE NOT NULL,
    capacidad_caja INT NOT NULL
);

CREATE TABLE colores (
    id SERIAL PRIMARY KEY,
    nombre_color VARCHAR(50) NOT NULL
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    tipo_cliente VARCHAR(50),
    permite_mezcla_colores BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE lineas (
    id SERIAL PRIMARY KEY,
    nombre_linea VARCHAR(50) NOT NULL,
    activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE turnos (
    id SERIAL PRIMARY KEY,
    nombre_turno VARCHAR(50) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

CREATE TABLE cat_cajas (
    id SERIAL PRIMARY KEY,
    tipo_caja VARCHAR(50) NOT NULL,
    capacidad_maxima INT NOT NULL
);

CREATE TABLE catalogo_defectos (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL
);

CREATE TABLE catalogo_estados_calidad (
    id SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL,
    permite_empaque BOOLEAN NOT NULL
);

CREATE TABLE parametros_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor INT,
    descripcion VARCHAR(255)
);

CREATE TABLE transportista (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rfc VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

-- ==============================================================================
-- 2. USUARIOS (Depende de roles)
-- ==============================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nomina VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    usuario_login VARCHAR(50) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    id_rol INT REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE
);

-- ==============================================================================
-- 3. SISTEMAS (Bitácoras)
-- ==============================================================================
CREATE TABLE bitacora (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT REFERENCES usuarios(id),
    modulo VARCHAR(50),
    accion VARCHAR(255)
);

CREATE TABLE respaldos_log (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT REFERENCES usuarios(id),
    exitoso BOOLEAN NOT NULL
);

-- ==============================================================================
-- 4. ALMACÉN (Pedidos) - Creado antes porque Órdenes y Embarques dependen de Clientes
-- ==============================================================================
CREATE TABLE pedido (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) UNIQUE NOT NULL,
    id_cliente INT REFERENCES clientes(id),
    fecha_pedido DATE,
    fecha_compromiso DATE,
    estado VARCHAR(50)
);

CREATE TABLE pedido_detalle (
    id SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedido(id),
    id_modelo INT REFERENCES modelos(id),
    id_color INT REFERENCES colores(id),
    cantidad_solicitada INT NOT NULL
);

-- ==============================================================================
-- 5. EMPAQUE (Cajas base) - Creado antes porque Unidades depende de esto
-- ==============================================================================
CREATE TABLE cajas (
    id SERIAL PRIMARY KEY,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    estado VARCHAR(20),
    id_cat_caja INT REFERENCES cat_cajas(id),
    id_usuario_creador INT REFERENCES usuarios(id)
);

CREATE TABLE bitacora_permisos (
    id SERIAL PRIMARY KEY,
    id_caja INT REFERENCES cajas(id),
    id_usuario_autoriza INT REFERENCES usuarios(id),
    motivo VARCHAR(255),
    fecha_autorizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_movimientos (
    id SERIAL PRIMARY KEY,
    id_caja INT REFERENCES cajas(id),
    evento VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT REFERENCES usuarios(id)
);

-- ==============================================================================
-- 6. PRODUCCIÓN (Órdenes)
-- ==============================================================================
CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) UNIQUE NOT NULL,
    id_cliente INT REFERENCES clientes(id),
    id_modelo INT REFERENCES modelos(id),
    id_color INT REFERENCES colores(id),
    cantidad INT NOT NULL,
    fecha_compromiso DATE,
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registro INT REFERENCES usuarios(id),
    estado VARCHAR(50),
    id_linea_asignada INT REFERENCES lineas(id),
    id_usuario_asigno INT REFERENCES usuarios(id),
    fecha_asignacion TIMESTAMP
);

CREATE TABLE historial_ordenes (
    id SERIAL PRIMARY KEY,
    id_orden INT REFERENCES ordenes(id),
    id_usuario INT REFERENCES usuarios(id),
    accion VARCHAR(100),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT
);

-- ==============================================================================
-- 7. ENSAMBLE
-- ==============================================================================
CREATE TABLE ensamble (
    id SERIAL PRIMARY KEY,
    id_orden INT REFERENCES ordenes(id),
    id_modelo INT REFERENCES modelos(id),
    id_turno INT REFERENCES turnos(id),
    id_operador INT REFERENCES usuarios(id),
    cantidad INT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registro INT REFERENCES usuarios(id)
);

CREATE TABLE objetivos (
    id SERIAL PRIMARY KEY,
    id_modelo INT REFERENCES modelos(id),
    id_turno INT REFERENCES turnos(id),
    cantidad_objetivo INT NOT NULL
);

CREATE TABLE defectos_ensamble (
    id SERIAL PRIMARY KEY,
    id_pieza INT, -- Referencia genérica solicitada en el diagrama
    motivo VARCHAR(255),
    etapa VARCHAR(50),
    id_usuario_registro INT REFERENCES usuarios(id),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. CALIDAD Y TRAZABILIDAD
-- ==============================================================================
CREATE TABLE prueba_funcional (
    id SERIAL PRIMARY KEY,
    id_orden INT REFERENCES ordenes(id),
    id_linea INT REFERENCES lineas(id),
    id_usuario INT REFERENCES usuarios(id),
    id_turno INT REFERENCES turnos(id),
    numero_serie VARCHAR(50) UNIQUE NOT NULL,
    valida_encendido BOOLEAN,
    valida_audio BOOLEAN,
    valida_carga BOOLEAN,
    valida_bluetooth BOOLEAN,
    estado_prueba VARCHAR(50),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE defectos_funcionales (
    id SERIAL PRIMARY KEY,
    id_prueba INT REFERENCES prueba_funcional(id),
    id_usuario INT REFERENCES usuarios(id),
    tipo_falla VARCHAR(100),
    calidad VARCHAR(50),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE unidades (
    id SERIAL PRIMARY KEY,
    id_orden INT REFERENCES ordenes(id),
    id_linea INT REFERENCES lineas(id),
    id_turno INT REFERENCES turnos(id),
    numero_serie VARCHAR(50) UNIQUE NOT NULL,
    id_estado_calidad INT REFERENCES catalogo_estados_calidad(id),
    id_caja INT REFERENCES cajas(id),
    fecha_ensamble TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_unidades (
    id SERIAL PRIMARY KEY,
    id_unidad INT REFERENCES unidades(id),
    id_usuario INT REFERENCES usuarios(id),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    motivo VARCHAR(255),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inspecciones_calidad (
    id SERIAL PRIMARY KEY,
    id_unidad INT REFERENCES unidades(id),
    id_inspector INT REFERENCES usuarios(id),
    fecha_inspeccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT
);

CREATE TABLE detalle_defectos_unidad (
    id SERIAL PRIMARY KEY,
    id_inspeccion INT REFERENCES inspecciones_calidad(id),
    id_defecto INT REFERENCES catalogo_defectos(id)
);

-- ==============================================================================
-- 9. EMBARQUES (Depende de todo lo anterior)
-- ==============================================================================
CREATE TABLE embarque (
    id SERIAL PRIMARY KEY,
    referencia_embarque VARCHAR(50) UNIQUE NOT NULL,
    id_pedido INT REFERENCES pedido(id),
    id_cliente INT REFERENCES clientes(id),
    id_transportista INT REFERENCES transportista(id),
    fecha_programada DATE,
    fecha_salida DATE,
    estado VARCHAR(50),
    observaciones TEXT,
    id_usuario_creo INT REFERENCES usuarios(id),
    id_usuario_confirmo INT REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE embarque_caja (
    id SERIAL PRIMARY KEY,
    id_embarque INT REFERENCES embarque(id),
    id_caja INT REFERENCES cajas(id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_asigna INT REFERENCES usuarios(id),
    fecha_retiro TIMESTAMP,
    motivo_retiro VARCHAR(255)
);

CREATE TABLE embarque_historial (
    id SERIAL PRIMARY KEY,
    id_embarque INT REFERENCES embarque(id),
    operacion VARCHAR(100),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    id_caja INT REFERENCES cajas(id),
    id_usuario INT REFERENCES usuarios(id),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detalle TEXT
);
