-- ==============================================================================
-- NOVA SOUND - CATÁLOGOS OFICIALES Y CONFIGURACIÓN BASE
-- Cumplimiento estricto 1:1 con P-37, BD-14, RNF-01b, RNF-01c, RF-14, BD-17 y BD-18.
-- ==============================================================================

-- 0. CATÁLOGOS OPERATIVOS BASE (Estados de Calidad, Modelos, Colores, Líneas, Turnos, Transportistas)
INSERT INTO catalogo_estados_calidad (id, nombre_estado, permite_empaque) VALUES
(1, 'Aprobada', TRUE),
(2, 'En retrabajo', FALSE),
(3, 'En retención', FALSE),
(4, 'Scrap', FALSE)
ON CONFLICT (id) DO UPDATE SET
    nombre_estado = EXCLUDED.nombre_estado,
    permite_empaque = EXCLUDED.permite_empaque;

SELECT setval('catalogo_estados_calidad_id_seq', (SELECT COALESCE(MAX(id), 4) FROM catalogo_estados_calidad));

INSERT INTO modelos (id, nombre_modelo, capacidad_caja, descripcion) VALUES
(1, 'NS-MINI', 12, 'Altavoz portátil compacto - 12 unidades por caja'),
(2, 'NS-SPORT', 8, 'Altavoz resistente al agua - 8 unidades por caja'),
(3, 'NS-PRO', 6, 'Altavoz de alta fidelidad - 6 unidades por caja'),
(4, 'NS-MAX', 4, 'Altavoz de potencia industrial - 4 unidades por caja')
ON CONFLICT (id) DO UPDATE SET
    nombre_modelo = EXCLUDED.nombre_modelo,
    capacidad_caja = EXCLUDED.capacidad_caja,
    descripcion = EXCLUDED.descripcion;

SELECT setval('modelos_id_seq', (SELECT COALESCE(MAX(id), 4) FROM modelos));

INSERT INTO colores (id, nombre_color) VALUES
(1, 'Negro'),
(2, 'Blanco'),
(3, 'Rojo'),
(4, 'Azul'),
(5, 'Verde')
ON CONFLICT (id) DO UPDATE SET
    nombre_color = EXCLUDED.nombre_color;

SELECT setval('colores_id_seq', (SELECT COALESCE(MAX(id), 5) FROM colores));

INSERT INTO lineas (id, nombre_linea, activa) VALUES
(1, 'L1', TRUE),
(2, 'L2', TRUE),
(3, 'L3', TRUE)
ON CONFLICT (id) DO UPDATE SET
    nombre_linea = EXCLUDED.nombre_linea,
    activa = EXCLUDED.activa;

SELECT setval('lineas_id_seq', (SELECT COALESCE(MAX(id), 3) FROM lineas));

INSERT INTO turnos (id, nombre_turno, hora_inicio, hora_fin) VALUES
(1, 'Mañana', '06:00', '14:00'),
(2, 'Tarde', '14:00', '22:00')
ON CONFLICT (id) DO UPDATE SET
    nombre_turno = EXCLUDED.nombre_turno,
    hora_inicio = EXCLUDED.hora_inicio,
    hora_fin = EXCLUDED.hora_fin;

SELECT setval('turnos_id_seq', (SELECT COALESCE(MAX(id), 2) FROM turnos));

INSERT INTO transportista (id, nombre, rfc, telefono, activo) VALUES
(1, 'Transportes del Norte S.A.', 'TNO990101AAA', '8441234560', TRUE),
(2, 'Logística Rápida Bajío', 'LRB010203BBB', '8441234561', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('transportista_id_seq', (SELECT COALESCE(MAX(id), 2) FROM transportista));

-- 1. LOS 9 ROLES OFICIALES DEL CASO NOVA SOUND (P-37, BD-14, RNF-01b)
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

-- 2. PERMISOS DEL SISTEMA (BD-14, RN-14)
INSERT INTO permisos (id, codigo_permiso, nombre_permiso, modulo) VALUES
(1, 'ORDENES_GESTIONAR', 'Capturar, importar y asignar órdenes a líneas', 'Órdenes'),
(2, 'ENSAMBLE_REGISTRAR', 'Registrar conteo de ensamble e incidencias de línea', 'Ensamble'),
(3, 'PRUEBA_EVALUAR', 'Ejecutar las 4 validaciones de prueba funcional y emitir serie', 'Pruebas'),
(4, 'CALIDAD_DICTAMINAR', 'Registrar inspección de calidad, defectos y disposición', 'Calidad'),
(5, 'EMPAQUE_OPERAR', 'Abrir caja, empacar unidades aprobadas y cerrar caja', 'Empaque'),
(6, 'EMPAQUE_SOLICITAR_REAPERTURA', 'Solicitar reapertura de caja o retiro de unidad', 'Empaque'),
(7, 'EMPAQUE_AUTORIZAR_REAPERTURA', 'Autorizar reapertura de caja cerrada (Supervisor de almacén)', 'Empaque'),
(8, 'EMBARQUE_OPERAR', 'Programar embarques, cargar/retirar cajas y confirmar salida', 'Embarques'),
(9, 'TURNO_CERRAR', 'Generar cierre formal de turno y solicitar corrección', 'Turnos'),
(10, 'TURNO_AUTORIZAR_CORRECCION', 'Autorizar corrección o reapertura de cierre de turno', 'Turnos'),
(11, 'REPORTES_CONSULTAR', 'Consultar tableros, trazabilidad por serie y exportar reportes', 'Reportes'),
(12, 'SISTEMAS_ADMIN', 'Gestionar usuarios, roles, catálogos y parámetros del sistema', 'Configuración')
ON CONFLICT (id) DO UPDATE SET
    codigo_permiso = EXCLUDED.codigo_permiso,
    nombre_permiso = EXCLUDED.nombre_permiso,
    modulo = EXCLUDED.modulo;

SELECT setval('permisos_id_seq', (SELECT COALESCE(MAX(id), 12) FROM permisos));

-- 3. MATRIZ ROL <-> PERMISOS (BD-14, RNF-01b, RN-14)
DELETE FROM rol_permisos;
INSERT INTO rol_permisos (id_rol, id_permiso) VALUES
-- 1. Operador: Ensamble y Prueba funcional
(1, 2), (1, 3),
-- 2. Líder de línea: Ensamble, Prueba, Cierre de turno, Reportes
(2, 2), (2, 3), (2, 9), (2, 11),
-- 3. Inspector de Calidad: Prueba funcional, Calidad, Reportes/Trazabilidad
(3, 3), (3, 4), (3, 11),
-- 4. Almacén / Empaque: Empaque, Solicitar reapertura, Embarques
(4, 5), (4, 6), (4, 8),
-- 5. Supervisor de almacén: Empaque, Autorizar reapertura de caja, Embarques, Reportes
(5, 5), (5, 6), (5, 7), (5, 8), (5, 11),
-- 6. Subgerente de Producción: Órdenes, Cierre, Autorizar corrección de turno, Reportes
(6, 1), (6, 9), (6, 10), (6, 11),
-- 7. Gerente de Producción: Órdenes, Autorizar corrección de turno, Reportes
(7, 1), (7, 10), (7, 11),
-- 8. Gerente de Planta: Consulta de tableros, trazabilidad y reportes
(8, 11),
-- 9. Administrador del sistema: Administración de usuarios, roles, catálogos y parámetros (no operativo)
(9, 12), (9, 11)
ON CONFLICT DO NOTHING;

-- 3b. USUARIOS OFICIALES PARA LOS 9 ROLES CON HASH BCRYPT REAL (RNF-01c / P-02, contraseña: '123456')
INSERT INTO usuarios (nomina, nombre_completo, usuario_login, contrasena_hash, id_rol, activo) VALUES
('NS-OP-001', 'Carlos Hernández (Operador)', 'operador_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 1, TRUE),
('NS-LD-001', 'Roberto Mendoza (Líder de Línea)', 'lider_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 2, TRUE),
('NS-CA-001', 'Juan Pérez (Inspector de Calidad)', 'calidad_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 3, TRUE),
('NS-AL-001', 'Lucía Gómez (Almacén / Empaque)', 'almacen_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 4, TRUE),
('NS-SA-001', 'Fernanda Gómez (Supervisor Almacén)', 'sup_almacen_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 5, TRUE),
('NS-SP-001', 'Miguel Ángel Vega (Subgerente Prod)', 'subgerente_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 6, TRUE),
('NS-GP-001', 'Eduardo Díaz (Gerente Producción)', 'gerente_prod_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 7, TRUE),
('NS-PL-001', 'Directora Elena Torres (Gerente Planta)', 'gerente_planta_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 8, TRUE),
('NS-AD-001', 'Marcela Juárez (Admin Sistema)', 'admin_ns', '$2b$10$VurgV.1qRkGk7ITaVYes8u2CpqrOwt94zmukxyW1zEwVZXHIygrUa', 9, TRUE)
ON CONFLICT (nomina) DO UPDATE SET
    id_rol = EXCLUDED.id_rol,
    contrasena_hash = EXCLUDED.contrasena_hash,
    activo = TRUE;

SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 9) FROM usuarios));

-- 4. CATÁLOGO OFICIAL DE DEFECTOS EN LAS 4 CATEGORÍAS (RF-14, P-33, BD-05, BD-06)
UPDATE catalogo_defectos SET categoria = 'Funcional' WHERE categoria NOT IN ('Apariencia', 'Funcional', 'Identificación', 'Empaque');

INSERT INTO catalogo_defectos (categoria, descripcion, severidad) VALUES
-- Apariencia
('Apariencia', 'Rayón superficial en carcasa plástica', 'Menor'),
('Apariencia', 'Fisura visible o carcasa mal cerrada', 'Crítico'),
('Apariencia', 'Tonalidad de color desigual o incorrecto', 'Mayor'),
('Apariencia', 'Golpe o abolladura en rejilla frontal', 'Mayor'),
-- Funcional
('Funcional', 'No enciende / falla en circuito de alimentación', 'Crítico'),
('Funcional', 'Distorsión de audio o zumbido en altavoz', 'Crítico'),
('Funcional', 'No carga / falla en puerto de carga USB', 'Mayor'),
('Funcional', 'Falla de conexión o sincronización Bluetooth', 'Mayor'),
('Funcional', 'Botón flojo o sin respuesta mecánica', 'Mayor'),
-- Identificación
('Identificación', 'Etiqueta equivocada del cliente', 'Mayor'),
('Identificación', 'Número de serie ilegible o mal impreso', 'Mayor'),
('Identificación', 'Etiqueta de modelo incorrecto', 'Crítico'),
-- Empaque
('Empaque', 'Accesorio o cable de carga faltante', 'Mayor'),
('Empaque', 'Manual de usuario incorrecto o faltante', 'Menor'),
('Empaque', 'Caja externa maltratada o sellos rotos', 'Mayor')
ON CONFLICT (descripcion) DO NOTHING;

-- 5. PARÁMETROS DEL SISTEMA (RNF-07, RNF-08, BD-17)
INSERT INTO parametros_sistema (clave, valor, tipo_dato, descripcion) VALUES
('SISTEMA_MODO_MANTENIMIENTO', 'false', 'BOOLEAN', 'Activa aviso de mantenimiento en toda la planta'),
('MENSAJE_MANTENIMIENTO', 'Sistema operativo con normalidad', 'STRING', 'Mensaje visible en login y encabezado cuando hay mantenimiento'),
('POLITICA_RETENCION_ANOS', '2', 'INT', 'Años mínimos de conservación de trazabilidad e histórico (RNF-08)'),
('TIEMPO_META_CIERRE_MIN', '15', 'INT', 'Minutos máximos esperados para generar cierre al terminar turno')
ON CONFLICT (clave) DO UPDATE SET 
    valor = EXCLUDED.valor,
    tipo_dato = EXCLUDED.tipo_dato,
    descripcion = EXCLUDED.descripcion;

-- 6. CLIENTES CON SUS POLÍTICAS DE EMPAQUE Y ETIQUETA (RN-06, RN-08, BD-18)
INSERT INTO clientes (id, nombre_cliente, tipo_cliente, permite_mezcla_colores, requiere_etiqueta, requisitos_empaque) VALUES
(1, 'SoundCorp Retail', 'Cadena Comercial', FALSE, TRUE, 'Requiere etiqueta especial de cadena y caja monocromática'),
(2, 'MegaAudio Distribución', 'Distribuidor', TRUE, FALSE, 'Permite mezcla de colores en la misma caja'),
(3, 'TechBeat Stores', 'Cadena Comercial', FALSE, TRUE, 'Cajas de un solo color con sello de seguridad y etiqueta QR'),
(4, 'ElectroMax Nacional', 'Cadena Comercial', FALSE, FALSE, 'Empaque estándar sin mezcla de colores')
ON CONFLICT (id) DO UPDATE SET
    permite_mezcla_colores = EXCLUDED.permite_mezcla_colores,
    requiere_etiqueta = EXCLUDED.requiere_etiqueta,
    requisitos_empaque = EXCLUDED.requisitos_empaque;

SELECT setval('clientes_id_seq', (SELECT COALESCE(MAX(id), 4) FROM clientes));
