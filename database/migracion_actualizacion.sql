-- ==============================================================================
-- NOVA SOUND - SCRIPT DE MIGRACIÓN PARA NEON (POSTGRESQL)
-- Aplica estrictamente BD-01 a BD-20 sobre la base existente en Neon (Tablas.sql + INSERTS_NOVA_SOUND.txt).
-- ==============================================================================

BEGIN;

-- 0. BD-14 / P-37: Preparar tabla 'roles' (agregar descripcion y migrar IDs antiguos de 5 roles a los 9 roles oficiales)
ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255);

-- Si la tabla roles tenía solo los 5 roles antiguos (1=Operador, 2=Inspector, 3=Supervisor, 4=Gerente, 5=Administrador),
-- insertar primero los IDs 6..9 y reasignar usuarios.id_rol para no corromper los puestos existentes.
DO $$
DECLARE
    v_max_rol INT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO v_max_rol FROM roles;
    IF v_max_rol <= 5 AND EXISTS (SELECT 1 FROM roles WHERE id = 2 AND nombre_rol ILIKE '%Inspector%') THEN
        INSERT INTO roles (id, nombre_rol, descripcion) VALUES
        (6, 'Subgerente de Producción', 'Consulta todas las líneas y órdenes; asigna órdenes y autoriza ajustes.'),
        (7, 'Gerente de Producción', 'Consulta indicadores, históricos y cierres; autoriza reaperturas/correcciones de turno.'),
        (8, 'Gerente de Planta', 'Consulta tableros ejecutivos, cumplimiento, defectos y embarques.'),
        (9, 'Administrador del sistema', 'Gestiona usuarios, roles, catálogos y parámetros. No es puesto operativo.')
        ON CONFLICT (id) DO NOTHING;

        -- Remapear usuarios existentes a la numeración oficial de 9 roles:
        -- 5 (Administrador) -> 9 (Administrador del sistema)
        -- 4 (Gerente)       -> 7 (Gerente de Producción)
        -- 3 (Supervisor)    -> 5 (Supervisor de almacén)
        -- 2 (Inspector)     -> 3 (Inspector de Calidad)
        UPDATE usuarios SET id_rol = 9 WHERE id_rol = 5;
        UPDATE usuarios SET id_rol = 7 WHERE id_rol = 4;
        UPDATE usuarios SET id_rol = 5 WHERE id_rol = 3;
        UPDATE usuarios SET id_rol = 3 WHERE id_rol = 2;
    END IF;
END $$;

-- Actualizar los 9 roles oficiales
INSERT INTO roles (id, nombre_rol, descripcion) VALUES
(1, 'Operador', 'Consulta su orden/línea; registra producción o prueba funcional. No modifica cierres.'),
(2, 'Líder de línea', 'Ve producción del turno, objetivos, diferencias; solicita ajustes y cierra turno.'),
(3, 'Inspector de Calidad', 'Registra inspección, defecto y disposición; libera o retiene unidades.'),
(4, 'Almacén / Empaque', 'Crea cajas, agrega unidades liberadas, cierra cajas y prepara embarques.'),
(5, 'Supervisor de almacén', 'Autoriza reapertura de cajas cerradas y retiro de unidades con auditoría.'),
(6, 'Subgerente de Producción', 'Consulta todas las líneas y órdenes; asigna órdenes y autoriza ajustes.'),
(7, 'Gerente de Producción', 'Consulta indicadores, históricos y cierres; autoriza reaperturas/correcciones de turno.'),
(8, 'Gerente de Planta', 'Consulta tableros ejecutivos, cumplimiento, defectos y embarques.'),
(9, 'Administrador del sistema', 'Gestiona usuarios, roles, catálogos y parámetros. No es puesto operativo.')
ON CONFLICT (id) DO UPDATE SET
    nombre_rol = EXCLUDED.nombre_rol,
    descripcion = EXCLUDED.descripcion;

SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 9) FROM roles));

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_roles_nombre') THEN
        ALTER TABLE roles ADD CONSTRAINT uq_roles_nombre UNIQUE (nombre_rol);
    END IF;
END $$;

-- RNF-01c / P-02: Asegurar que todos los usuarios tengan fecha_creacion y hash bcrypt real (contraseña por defecto: '123456')
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE usuarios
SET contrasena_hash = '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa'
WHERE contrasena_hash IS NULL OR contrasena_hash NOT LIKE '$2%';

-- 1. BD-18 / BD-16: Modificar tabla 'clientes' (requiere_etiqueta, requisitos_empaque y UNIQUE)
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS requiere_etiqueta BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS requisitos_empaque TEXT;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_cliente_nombre') THEN
        ALTER TABLE clientes ADD CONSTRAINT uq_cliente_nombre UNIQUE (nombre_cliente);
    END IF;
END $$;

-- 2. BD-16: Restricción UNIQUE en 'colores', 'lineas', 'turnos', 'catalogo_estados_calidad' y 'modelos'
ALTER TABLE modelos ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_color_nombre') THEN
        ALTER TABLE colores ADD CONSTRAINT uq_color_nombre UNIQUE (nombre_color);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_linea_nombre') THEN
        ALTER TABLE lineas ADD CONSTRAINT uq_linea_nombre UNIQUE (nombre_linea);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_turno_nombre') THEN
        ALTER TABLE turnos ADD CONSTRAINT uq_turno_nombre UNIQUE (nombre_turno);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_estado_calidad_nombre') THEN
        ALTER TABLE catalogo_estados_calidad ADD CONSTRAINT uq_estado_calidad_nombre UNIQUE (nombre_estado);
    END IF;
END $$;

-- 2b. RF-14 / BD-16: Limpiar y deduplicar 'catalogo_defectos' antes de agregar UNIQUE y CHECK
ALTER TABLE catalogo_defectos
    ADD COLUMN IF NOT EXISTS severidad VARCHAR(20) NOT NULL DEFAULT 'Mayor',
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE catalogo_defectos
SET categoria = 'Apariencia'
WHERE categoria ILIKE '%Ensamble%' AND (descripcion ILIKE '%carcasa%' OR descripcion ILIKE '%rejilla%' OR descripcion ILIKE '%plástico%');

UPDATE catalogo_defectos
SET categoria = 'Funcional'
WHERE categoria NOT IN ('Apariencia', 'Funcional', 'Identificación', 'Empaque');

-- Reasignar referencias de defectos duplicados al menor ID de la misma descripción
UPDATE detalle_defectos_unidad ddu
SET id_defecto = keep.min_id
FROM catalogo_defectos cd
JOIN (
    SELECT descripcion, MIN(id) AS min_id
    FROM catalogo_defectos
    GROUP BY descripcion
) keep ON cd.descripcion = keep.descripcion
WHERE ddu.id_defecto = cd.id AND cd.id <> keep.min_id;

DELETE FROM catalogo_defectos cd
USING (
    SELECT descripcion, MIN(id) AS min_id
    FROM catalogo_defectos
    GROUP BY descripcion
) keep
WHERE cd.descripcion = keep.descripcion AND cd.id <> keep.min_id;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_catalogo_defectos_descripcion') THEN
        ALTER TABLE catalogo_defectos ADD CONSTRAINT uq_catalogo_defectos_descripcion UNIQUE (descripcion);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_catalogo_defectos_categoria') THEN
        ALTER TABLE catalogo_defectos ADD CONSTRAINT chk_catalogo_defectos_categoria
            CHECK (categoria IN ('Apariencia', 'Funcional', 'Identificación', 'Empaque'));
    END IF;
END $$;

-- 3. BD-17: Modificar tabla 'parametros_sistema' (valor VARCHAR con tipo_dato)
ALTER TABLE parametros_sistema 
    ALTER COLUMN valor TYPE VARCHAR(255) USING valor::VARCHAR(255),
    ADD COLUMN IF NOT EXISTS tipo_dato VARCHAR(20) NOT NULL DEFAULT 'STRING';

-- 4. BD-14 / RNF-01b: Crear tablas de Seguridad y Permisos RBAC
CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    codigo_permiso VARCHAR(80) UNIQUE NOT NULL,
    nombre_permiso VARCHAR(120) NOT NULL,
    modulo VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS rol_permisos (
    id_rol INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    id_permiso INT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- 5. BD-13 / RN-09 / RN-11: Crear tabla de Solicitudes de Autorización y ligar bitacora_permisos
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

ALTER TABLE bitacora_permisos
    ADD COLUMN IF NOT EXISTS id_solicitud INT REFERENCES solicitudes_autorizacion(id);

-- 6. BD-15 / RN-12: Actualizar 'bitacora' y 'respaldos_log' para auditoría única con antes, después, motivo y autorización
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bitacora' AND column_name='fecha')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bitacora' AND column_name='fecha_hora') THEN
        ALTER TABLE bitacora RENAME COLUMN fecha TO fecha_hora;
    END IF;
END $$;

ALTER TABLE bitacora
    ADD COLUMN IF NOT EXISTS entidad VARCHAR(50),
    ADD COLUMN IF NOT EXISTS id_registro_afectado INT,
    ADD COLUMN IF NOT EXISTS valor_anterior TEXT,
    ADD COLUMN IF NOT EXISTS valor_nuevo TEXT,
    ADD COLUMN IF NOT EXISTS motivo TEXT,
    ADD COLUMN IF NOT EXISTS id_autorizacion INT REFERENCES solicitudes_autorizacion(id);

ALTER TABLE respaldos_log
    ADD COLUMN IF NOT EXISTS archivo_respaldo VARCHAR(255);

-- 7. BD-01 / BD-02: Modificar 'cajas', 'historial_movimientos' y eliminar 'cat_cajas' (usar modelos.capacidad_caja)
ALTER TABLE cajas
    ADD COLUMN IF NOT EXISTS codigo_caja VARCHAR(50),
    ADD COLUMN IF NOT EXISTS id_cliente INT REFERENCES clientes(id),
    ADD COLUMN IF NOT EXISTS id_modelo INT REFERENCES modelos(id),
    ADD COLUMN IF NOT EXISTS id_color INT REFERENCES colores(id),
    ADD COLUMN IF NOT EXISTS id_usuario_cierra INT REFERENCES usuarios(id);

ALTER TABLE historial_movimientos
    ADD COLUMN IF NOT EXISTS detalles TEXT;

UPDATE cajas SET codigo_caja = 'BOX-' || LPAD(id::text, 5, '0') WHERE codigo_caja IS NULL;
UPDATE cajas SET id_cliente = 1 WHERE id_cliente IS NULL AND EXISTS (SELECT 1 FROM clientes WHERE id = 1);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cajas' AND column_name='id_cat_caja') THEN
        UPDATE cajas SET id_modelo = COALESCE(id_cat_caja, 1) WHERE id_modelo IS NULL AND EXISTS (SELECT 1 FROM modelos WHERE id = 1);
        ALTER TABLE cajas DROP COLUMN id_cat_caja;
    ELSE
        UPDATE cajas SET id_modelo = 1 WHERE id_modelo IS NULL AND EXISTS (SELECT 1 FROM modelos WHERE id = 1);
    END IF;
END $$;

UPDATE cajas SET id_color = 1 WHERE id_color IS NULL AND EXISTS (SELECT 1 FROM colores WHERE id = 1);

-- BD-02: Eliminar cat_cajas redundante
DROP TABLE IF EXISTS cat_cajas CASCADE;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_caja_codigo') THEN
        ALTER TABLE cajas ADD CONSTRAINT uq_caja_codigo UNIQUE (codigo_caja);
    END IF;
END $$;

-- 8. BD-07: Crear tabla 'detalle_caja' con histórico de entradas, fecha de retiro y motivo
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

INSERT INTO detalle_caja (id_caja, id_unidad, id_usuario_asigna, fecha_asignacion, activo)
SELECT u.id_caja, u.id, 1, CURRENT_TIMESTAMP, TRUE
FROM unidades u
WHERE u.id_caja IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM detalle_caja dc WHERE dc.id_unidad = u.id AND dc.id_caja = u.id_caja);

-- 9. BD-03 / BD-04 / BD-08: Quitar numero_serie de prueba_funcional, agregar CHECK de los 4 checks,
-- y ligar unidades a la prueba aprobada con id_prueba UNIQUE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades' AND column_name='fecha_ensamble')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades' AND column_name='fecha_creacion') THEN
        ALTER TABLE unidades RENAME COLUMN fecha_ensamble TO fecha_creacion;
    END IF;
END $$;

ALTER TABLE unidades
    ADD COLUMN IF NOT EXISTS id_prueba INT UNIQUE REFERENCES prueba_funcional(id),
    ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE unidades
    ALTER COLUMN id_estado_calidad DROP NOT NULL;

-- Ligar unidades existentes con su prueba_funcional correspondiente por ID si aún no tienen id_prueba
UPDATE unidades u
SET id_prueba = pf.id
FROM prueba_funcional pf
WHERE u.id = pf.id AND u.id_prueba IS NULL;

-- Normalizar valores antiguos en prueba_funcional ('Aprobado' -> 'Aprobada', 'Rechazado' -> 'Reprobada') antes del CHECK (BD-04)
UPDATE prueba_funcional
SET estado_prueba = 'Aprobada',
    valida_encendido = TRUE,
    valida_audio = TRUE,
    valida_carga = TRUE,
    valida_bluetooth = TRUE
WHERE estado_prueba ILIKE 'Aprobad%';

UPDATE prueba_funcional
SET estado_prueba = 'Reprobada',
    valida_bluetooth = CASE
        WHEN valida_encendido = TRUE AND valida_audio = TRUE AND valida_carga = TRUE AND valida_bluetooth = TRUE THEN FALSE
        ELSE COALESCE(valida_bluetooth, FALSE)
    END
WHERE estado_prueba NOT ILIKE 'Aprobad%';

ALTER TABLE prueba_funcional DROP COLUMN IF EXISTS numero_serie CASCADE;
ALTER TABLE prueba_funcional DROP COLUMN IF EXISTS numero_serie_generado CASCADE;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_prueba_consistencia') THEN
        ALTER TABLE prueba_funcional ADD CONSTRAINT chk_prueba_consistencia CHECK (
            (valida_encendido = TRUE AND valida_audio = TRUE AND valida_carga = TRUE AND valida_bluetooth = TRUE AND estado_prueba = 'Aprobada')
            OR
            ((valida_encendido = FALSE OR valida_audio = FALSE OR valida_carga = FALSE OR valida_bluetooth = FALSE) AND estado_prueba = 'Reprobada')
        );
    END IF;
END $$;

-- 10. BD-05: Crear tabla 'prueba_defectos' con FK al catálogo de defectos y migrar 'defectos_funcionales'
CREATE TABLE IF NOT EXISTS prueba_defectos (
    id SERIAL PRIMARY KEY,
    id_prueba INT NOT NULL REFERENCES prueba_funcional(id) ON DELETE CASCADE,
    id_defecto INT NOT NULL REFERENCES catalogo_defectos(id),
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    descripcion TEXT,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'defectos_funcionales') THEN
        -- Insertar tipos de falla de defectos_funcionales en catalogo_defectos si no existen
        INSERT INTO catalogo_defectos (categoria, descripcion, severidad)
        SELECT DISTINCT 'Funcional', df.tipo_falla, 'Mayor'
        FROM defectos_funcionales df
        WHERE df.tipo_falla IS NOT NULL
        ON CONFLICT (descripcion) DO NOTHING;

        -- Migrar registros hacia prueba_defectos
        INSERT INTO prueba_defectos (id_prueba, id_defecto, id_usuario, descripcion, fecha_hora)
        SELECT df.id_prueba, cd.id, COALESCE(df.id_usuario, 1), df.tipo_falla, COALESCE(df.fecha_hora, CURRENT_TIMESTAMP)
        FROM defectos_funcionales df
        JOIN catalogo_defectos cd ON cd.descripcion = df.tipo_falla
        WHERE df.id_prueba IS NOT NULL;

        DROP TABLE defectos_funcionales CASCADE;
    END IF;
END $$;

-- 11. BD-10: Actualizar 'ordenes', 'pedido' y 'ensamble' (agregar id_linea y fecha_produccion; quitar id_modelo)
ALTER TABLE ordenes
    ADD COLUMN IF NOT EXISTS id_pedido INT REFERENCES pedido(id);

UPDATE ordenes SET estado = 'Programada' WHERE estado ILIKE 'Pendiente';
UPDATE pedido SET estado = 'En Producción' WHERE estado ILIKE 'En proceso';
UPDATE pedido SET estado = 'Embarcado' WHERE estado ILIKE 'Completado';

ALTER TABLE ensamble
    ADD COLUMN IF NOT EXISTS id_linea INT REFERENCES lineas(id),
    ADD COLUMN IF NOT EXISTS fecha_produccion DATE NOT NULL DEFAULT CURRENT_DATE,
    DROP COLUMN IF EXISTS id_modelo;

UPDATE ensamble e
SET id_linea = COALESCE(o.id_linea_asignada, 1)
FROM ordenes o
WHERE e.id_orden = o.id AND e.id_linea IS NULL;

-- 12. BD-06: Actualizar 'defectos_ensamble' (FK a ensamble y al catálogo de defectos; quitar id_pieza)
ALTER TABLE defectos_ensamble
    ADD COLUMN IF NOT EXISTS id_ensamble INT REFERENCES ensamble(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS id_defecto INT REFERENCES catalogo_defectos(id),
    ADD COLUMN IF NOT EXISTS cantidad INT NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'defectos_ensamble' AND column_name = 'id_pieza') THEN
        UPDATE defectos_ensamble de
        SET id_ensamble = CASE
            WHEN EXISTS (SELECT 1 FROM ensamble e WHERE e.id = de.id_pieza) THEN de.id_pieza
            ELSE (SELECT MIN(id) FROM ensamble)
        END
        WHERE de.id_ensamble IS NULL;

        UPDATE defectos_ensamble de
        SET id_defecto = COALESCE(
            (SELECT cd.id FROM catalogo_defectos cd WHERE cd.descripcion = de.motivo LIMIT 1),
            (SELECT MIN(id) FROM catalogo_defectos)
        )
        WHERE de.id_defecto IS NULL;

        ALTER TABLE defectos_ensamble DROP COLUMN id_pieza;
    END IF;
END $$;

-- 13. BD-11: Actualizar 'objetivos' (clave fecha + turno + línea + modelo)
ALTER TABLE objetivos
    ADD COLUMN IF NOT EXISTS fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS id_linea INT REFERENCES lineas(id);

UPDATE objetivos SET id_linea = 1 WHERE id_linea IS NULL AND EXISTS (SELECT 1 FROM lineas WHERE id = 1);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_objetivo_meta') THEN
        ALTER TABLE objetivos ADD CONSTRAINT uq_objetivo_meta UNIQUE (fecha, id_turno, id_linea, id_modelo);
    END IF;
END $$;

-- 14. BD-09: Actualizar 'inspecciones_calidad' con columna id_estado_resultado
ALTER TABLE inspecciones_calidad
    ADD COLUMN IF NOT EXISTS id_estado_resultado INT REFERENCES catalogo_estados_calidad(id);

UPDATE inspecciones_calidad ic
SET id_estado_resultado = COALESCE(u.id_estado_calidad, 1)
FROM unidades u
WHERE ic.id_unidad = u.id AND ic.id_estado_resultado IS NULL;

-- 14b. BD-19: Actualizar 'embarque' y 'embarque_caja'
ALTER TABLE embarque_caja
    ADD COLUMN IF NOT EXISTS id_usuario_retira INT REFERENCES usuarios(id);

ALTER TABLE embarque
    ALTER COLUMN fecha_salida TYPE TIMESTAMP USING fecha_salida::TIMESTAMP;

UPDATE embarque SET estado = 'Despachado' WHERE estado IN ('En tránsito', 'Entregado');

-- 15. BD-12 / RF-33 / INC-A / INC-D: Crear tabla 'cierres_turno' (con piezas_embarcadas)
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

-- 15b. BD-16: Aplicar restricciones NOT NULL y CHECK en tablas migradas para paridad 1:1 con schema_completo_actualizado.sql
ALTER TABLE cajas
    ALTER COLUMN codigo_caja SET NOT NULL,
    ALTER COLUMN id_cliente SET NOT NULL,
    ALTER COLUMN id_modelo SET NOT NULL;

ALTER TABLE ensamble
    ALTER COLUMN id_linea SET NOT NULL;

ALTER TABLE defectos_ensamble
    ALTER COLUMN id_ensamble SET NOT NULL,
    ALTER COLUMN id_defecto SET NOT NULL;

ALTER TABLE objetivos
    ALTER COLUMN id_linea SET NOT NULL;

ALTER TABLE inspecciones_calidad
    ALTER COLUMN id_estado_resultado SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_estado_calidad_oficial') THEN
        ALTER TABLE catalogo_estados_calidad ADD CONSTRAINT chk_estado_calidad_oficial
            CHECK (nombre_estado IN ('Aprobada', 'En retrabajo', 'En retención', 'Scrap'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_defecto_severidad') THEN
        ALTER TABLE catalogo_defectos ADD CONSTRAINT chk_defecto_severidad
            CHECK (severidad IN ('Crítico', 'Mayor', 'Menor'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_parametro_tipo_dato') THEN
        ALTER TABLE parametros_sistema ADD CONSTRAINT chk_parametro_tipo_dato
            CHECK (tipo_dato IN ('STRING', 'INT', 'BOOLEAN', 'JSON'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pedido_estado') THEN
        ALTER TABLE pedido ADD CONSTRAINT chk_pedido_estado
            CHECK (estado IN ('Pendiente', 'En Producción', 'Listo para Despacho', 'Embarcado', 'Cancelado'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orden_estado') THEN
        ALTER TABLE ordenes ADD CONSTRAINT chk_orden_estado
            CHECK (estado IN ('Programada', 'En Proceso', 'Pausada', 'Completada', 'Cancelada'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_caja_estado') THEN
        ALTER TABLE cajas ADD CONSTRAINT chk_caja_estado
            CHECK (estado IN ('Abierta', 'Cerrada'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_embarque_estado') THEN
        ALTER TABLE embarque ADD CONSTRAINT chk_embarque_estado
            CHECK (estado IN ('Programado', 'En Carga', 'Despachado', 'Cancelado'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_modelo_capacidad_positiva') THEN
        ALTER TABLE modelos ADD CONSTRAINT chk_modelo_capacidad_positiva CHECK (capacidad_caja > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orden_cantidad_positiva') THEN
        ALTER TABLE ordenes ADD CONSTRAINT chk_orden_cantidad_positiva CHECK (cantidad > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ensamble_cantidad_positiva') THEN
        ALTER TABLE ensamble ADD CONSTRAINT chk_ensamble_cantidad_positiva CHECK (cantidad > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_objetivo_cantidad_positiva') THEN
        ALTER TABLE objetivos ADD CONSTRAINT chk_objetivo_cantidad_positiva CHECK (cantidad_objetivo > 0);
    END IF;
END $$;

-- 16. BD-20: Crear funciones y triggers de reglas de negocio en PostgreSQL
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
            RAISE EXCEPTION 'Bloqueo de Embarque (Incidente C / F-11): Existen % unidades dentro del embarque con estado de Calidad NO liberado.', v_unidades_no_liberadas;
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

-- 17. RNF-05: Índices de rendimiento
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

COMMIT;
