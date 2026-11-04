import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { app } from '../src/app.js';
import { setDbPool } from '../src/config/db.js';
import { RolesEnum, EstadosCalidadEnum } from '../src/types/index.js';

describe('Auditoría Integral E2E en PostgreSQL Real (PGlite): BD-01..20, F-01..12, RN-01..14, RF-01..33, RNF-01..09, INC-A..D', () => {
  let pg: PGlite;
  const dbDir = path.resolve(process.cwd(), '../database');

  beforeAll(async () => {
    pg = new PGlite();

    // Adaptador compatible con pg.Pool para que todos los repositorios, servicios y transacciones corran sobre PostgreSQL real
    const pglitePoolAdapter = {
      query: async (text: string, params?: any[]) => {
        const res = await pg.query(text, params);
        return { rows: res.rows as any[], rowCount: res.rows.length };
      },
      connect: async () => ({
        query: async (text: string, params?: any[]) => {
          const trimmed = text.trim().toUpperCase();
          if (trimmed === 'BEGIN' || trimmed === 'COMMIT' || trimmed === 'ROLLBACK') {
            await pg.exec(trimmed);
            return { rows: [], rowCount: 0 };
          }
          const res = await pg.query(text, params);
          return { rows: res.rows as any[], rowCount: res.rows.length };
        },
        release: () => {},
      }),
      on: () => {},
    };

    setDbPool(pglitePoolAdapter);

    // 1. Ejecutar el esquema completo actualizado y los catálogos oficiales en PostgreSQL real
    const schemaSql = fs.readFileSync(path.join(dbDir, 'schema_completo_actualizado.sql'), 'utf8');
    const catalogosSql = fs.readFileSync(path.join(dbDir, 'INSERTS_CATALOGOS_OFICIALES.sql'), 'utf8');
    await pg.exec(schemaSql);
    await pg.exec(catalogosSql);

    // Insertar un pedido base para pruebas de órdenes y embarques
    await pg.exec(`
      INSERT INTO pedido (id, folio, id_cliente, fecha_pedido, fecha_compromiso, estado)
      VALUES (1, 'PED-2026-001', 1, CURRENT_DATE, CURRENT_DATE + 7, 'En Producción')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO pedido_detalle (id_pedido, id_modelo, id_color, cantidad_solicitada)
      VALUES (1, 3, 1, 50);
    `);
  });

  it('BD-01 a BD-20: La migración sobre Tablas.sql + INSERTS_NOVA_SOUND.txt se ejecuta al 100% sin errores en PostgreSQL real', async () => {
    const pgLegacy = new PGlite();
    const tablasSql = fs.readFileSync(path.join(dbDir, 'Tablas.sql'), 'utf8');
    const insertsOldSql = fs.readFileSync(path.join(dbDir, 'INSERTS_NOVA_SOUND.txt'), 'utf8');
    const migracionSql = fs.readFileSync(path.join(dbDir, 'migracion_actualizacion.sql'), 'utf8');
    const catalogosSql = fs.readFileSync(path.join(dbDir, 'INSERTS_CATALOGOS_OFICIALES.sql'), 'utf8');

    await pgLegacy.exec(tablasSql);
    await pgLegacy.exec(insertsOldSql);
    await pgLegacy.exec(migracionSql);
    await pgLegacy.exec(catalogosSql);

    // Verificar 9 roles oficiales (BD-14 / P-37)
    const rolesRes = await pgLegacy.query('SELECT COUNT(*) as total FROM roles');
    expect(Number((rolesRes.rows[0] as any).total)).toBe(9);

    // Verificar eliminación de cat_cajas (BD-02) y defectos_funcionales (BD-05)
    const tablesRes = await pgLegacy.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('cat_cajas', 'defectos_funcionales')"
    );
    expect(tablesRes.rows.length).toBe(0);

    // Verificar migración de los 50 registros a prueba_defectos (BD-05)
    const pdRes = await pgLegacy.query('SELECT COUNT(*) as total FROM prueba_defectos');
    expect(Number((pdRes.rows[0] as any).total)).toBe(50);

    // Verificar que 100% de los usuarios tienen hash bcrypt (RNF-01c / P-02)
    const nonBcrypt = await pgLegacy.query("SELECT COUNT(*) as total FROM usuarios WHERE contrasena_hash NOT LIKE '$2%'");
    expect(Number((nonBcrypt.rows[0] as any).total)).toBe(0);
  });

  it('RNF-01a, RNF-01b, RNF-01c, RN-14: Autenticación con bcrypt real y bloqueo RBAC por rol en BD', async () => {
    // 1. Login exitoso con contraseña hasheada con bcrypt ('123456')
    const loginOk = await request(app)
      .post('/api/auth/login')
      .send({ login: 'NS-OP-001', contrasena: '123456' });
    expect(loginOk.status).toBe(200);
    expect(loginOk.body.usuario.id_rol).toBe(RolesEnum.OPERADOR);
    expect(loginOk.body.usuario.permisos).toContain('ENSAMBLE_REGISTRAR');
    expect(loginOk.body.usuario.permisos).not.toContain('TURNO_CERRAR');

    // 2. Login rechazado si se intenta usar el login o nómina como contraseña en texto plano (P-02 / RNF-01c)
    const loginFallido = await request(app)
      .post('/api/auth/login')
      .send({ login: 'NS-OP-001', contrasena: 'NS-OP-001' });
    expect(loginFallido.status).toBe(401);

    // 3. RN-14 / RNF-01b: Un Operador (usuario ID 1 en BD, rol 1) no puede crear órdenes ni siquiera si intenta falsificar x-rol-id: 9
    const intentoOrdenOperador = await request(app)
      .post('/api/ordenes')
      .set('x-user-id', '1') // Usuario 1 es Operador en la BD
      .set('x-rol-id', '9')  // Intento de falsificar rol Administrador desde el cliente -> bloqueado por RNF-01b
      .send({
        folio: 'ORD-ILEGAL-01',
        id_cliente: 1,
        id_modelo: 3,
        id_color: 1,
        cantidad: 10,
        fecha_compromiso: '2026-11-15',
      });
    expect(intentoOrdenOperador.status).toBe(403);
    expect(intentoOrdenOperador.body.error).toContain('ORDENES_GESTIONAR');

    // 4. RF-32 / P-38: Administrador del sistema (usuario ID 9, rol 9) puede dar de alta catálogos (colores, defectos, clientes)
    const nuevoColor = await request(app)
      .post('/api/catalogos/colores')
      .set('x-user-id', '9')
      .send({ nombre_color: ' Gris Titanio ' });
    expect(nuevoColor.status).toBe(201);
    expect(nuevoColor.body.nombre_color).toBe('Gris Titanio');
  });

  it('RF-01, F-01, F-02, RF-05, BD-11: Captura, importación masiva de órdenes, asignación a línea y objetivos compuestos', async () => {
    // Subgerente de Producción (usuario ID 6, rol 6) importa órdenes masivamente (RF-01)
    const importRes = await request(app)
      .post('/api/ordenes/importar')
      .set('x-user-id', '6')
      .send({
        ordenes: [
          {
            folio: 'ORD-2026-101',
            id_pedido: 1,
            id_cliente: 1, // SoundCorp Retail (permite_mezcla_colores = FALSE)
            id_modelo: 3,  // NS-PRO (capacidad_caja = 6)
            id_color: 1,   // Negro
            cantidad: 20,
            fecha_compromiso: '2026-11-10',
          },
          {
            folio: 'ORD-2026-102',
            id_pedido: 1,
            id_cliente: 1,
            id_modelo: 3,  // NS-PRO
            id_color: 2,   // Blanco (para probar bloqueo de mezcla de color en RN-06)
            cantidad: 10,
            fecha_compromiso: '2026-11-10',
            id_linea_asignada: 1,
          },
          {
            folio: 'ORD-2026-103',
            id_pedido: 1,
            id_cliente: 1,
            id_modelo: 4,  // NS-MAX (capacidad_caja = 4, para probar bloqueo de mezcla de modelo en RN-05 y límite de capacidad en RN-07)
            id_color: 1,
            cantidad: 10,
            fecha_compromiso: '2026-11-10',
            id_linea_asignada: 1,
          },
        ],
      });
    expect(importRes.status).toBe(201);
    expect(importRes.body.total_importadas).toBe(3);

    // F-02 / RF-02: Asignar orden 1 a Línea 1
    const asigRes = await request(app)
      .patch('/api/ordenes/1/asignar-linea')
      .set('x-user-id', '6')
      .send({ id_linea: 1, id_usuario: 6 });
    expect(asigRes.status).toBe(200);
    expect(asigRes.body.data.estado).toBe('En Proceso');

    // BD-11 / RF-05: Definir objetivo por fecha + turno + línea + modelo
    const objRes = await request(app)
      .post('/api/objetivos')
      .set('x-user-id', '6')
      .send({
        fecha: new Date().toISOString().split('T')[0],
        id_turno: 1,
        id_linea: 1,
        id_modelo: 3,
        cantidad_objetivo: 50,
      });
    expect(objRes.status).toBe(201);
  });

  it('F-03, RF-04, BD-06, BD-10: Conteo de ensamble por lote sin número de serie y registro de defecto de ensamble', async () => {
    // Operador (usuario ID 1, rol 1) registra 5 piezas ensambladas en L1
    const conteoRes = await request(app)
      .post('/api/ensamble/conteo')
      .set('x-user-id', '1')
      .send({
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_operador: 1,
        cantidad: 5,
      });
    expect(conteoRes.status).toBe(201);
    expect(conteoRes.body.data.cantidad).toBe(5);

    // BD-06: Registrar defecto de ensamble ligado a id_ensamble y catalogo_defectos
    const defRes = await request(app)
      .post('/api/ensamble/defecto')
      .set('x-user-id', '1')
      .send({
        id_ensamble: conteoRes.body.data.id,
        id_defecto: 1,
        cantidad: 1,
        motivo: 'Rayón superficial detectado en línea',
      });
    expect(defRes.status).toBe(201);
  });

  it('F-04, RN-04, RF-09..11, BD-03..05, BD-08: Prueba funcional reprobada no emite serie; aprobada emite serie pendiente de Calidad', async () => {
    // 1. Prueba funcional reprobada (falla Bluetooth): exige defecto y NO emite serie
    const failRes = await request(app)
      .post('/api/pruebas/evaluar')
      .set('x-user-id', '1')
      .send({
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_operador: 1,
        valida_encendido: true,
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: false,
        id_defecto: 8,
        descripcion_defecto: 'No sincroniza módulo Bluetooth',
      });
    expect(failRes.status).toBe(200);
    expect(failRes.body.aprobado).toBe(false);
    expect(failRes.body.numero_serie).toBeNull();

    // 2. Prueba funcional aprobada (orden 1: NS-PRO Negro): emite serie pero nace con id_estado_calidad = null (Pendiente de Calidad)
    const pass1 = await request(app)
      .post('/api/pruebas/evaluar')
      .set('x-user-id', '1')
      .send({
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_operador: 1,
        valida_encendido: true,
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: true,
      });
    expect(pass1.status).toBe(201);
    expect(pass1.body.aprobado).toBe(true);
    expect(pass1.body.numero_serie).toMatch(/^NS-PRO-\d{6}-0001$/);
    expect(pass1.body.unidad.id_estado_calidad).toBeNull();

    // Emitir una segunda unidad de orden 1 (NS-PRO Negro), una de orden 2 (NS-PRO Blanco) y una de orden 3 (NS-MAX Negro)
    const pass2 = await request(app)
      .post('/api/pruebas/evaluar')
      .set('x-user-id', '1')
      .send({
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_operador: 1,
        valida_encendido: true,
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: true,
      });
    expect(pass2.body.aprobado).toBe(true);

    const passColorBlanco = await request(app)
      .post('/api/pruebas/evaluar')
      .set('x-user-id', '1')
      .send({
        id_orden: 2,
        id_linea: 1,
        id_turno: 1,
        id_operador: 1,
        valida_encendido: true,
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: true,
      });
    expect(passColorBlanco.body.aprobado).toBe(true);

    const passModeloMax = await request(app)
      .post('/api/pruebas/evaluar')
      .set('x-user-id', '1')
      .send({
        id_orden: 3,
        id_linea: 1,
        id_turno: 1,
        id_operador: 1,
        valida_encendido: true,
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: true,
      });
    expect(passModeloMax.body.aprobado).toBe(true);
  });

  it('RN-01, F-05, F-06, F-07, RF-13, RN-02, RN-13: Bloquea empaque sin dictamen de Calidad; soporta ciclo Retrabajo -> Re-inspección -> Liberación', async () => {
    const unidadesRes = await pg.query('SELECT * FROM unidades ORDER BY id ASC');
    const serie1 = (unidadesRes.rows[0] as any).numero_serie;
    const serie2 = (unidadesRes.rows[1] as any).numero_serie;
    const serieBlanca = (unidadesRes.rows[2] as any).numero_serie;
    const serieMax = (unidadesRes.rows[3] as any).numero_serie;

    // Almacén (usuario ID 4, rol 4) abre caja para Cliente 1 (SoundCorp: NO permite mezcla de colores), Modelo 3 (NS-PRO), Color 1 (Negro)
    const cajaRes = await request(app)
      .post('/api/cajas')
      .set('x-user-id', '4')
      .send({
        id_cliente: 1,
        id_modelo: 3,
        id_color: 1,
        id_usuario_creador: 4,
      });
    expect(cajaRes.status).toBe(201);
    const idCaja = cajaRes.body.data.id;

    // 1. RN-01 / F-07: Intentar empacar serie1 recién salida de prueba funcional (AÚN SIN DICTAMEN DE CALIDAD) -> ¡BLOQUEADO!
    const intentoSinCalidad = await request(app)
      .post('/api/cajas/empacar-serie')
      .set('x-user-id', '4')
      .send({ id_caja: idCaja, numero_serie: serie1 });
    expect(intentoSinCalidad.status).toBe(400);
    expect(intentoSinCalidad.body.error).toContain('RN-01');

    // 2. F-05 / F-06 / RN-02: Inspector de Calidad (usuario ID 3, rol 3) dictamina serie1 como 'En retrabajo' (2)
    const dictRetrabajo = await request(app)
      .post('/api/unidades/dictaminar')
      .set('x-user-id', '3')
      .send({
        numero_serie: serie1,
        id_estado_calidad: EstadosCalidadEnum.EN_RETRABAJO,
        id_usuario: 3,
        id_defectos: [1],
        comentarios: 'Requiere pulido de carcasa antes de liberar',
      });
    expect(dictRetrabajo.status).toBe(200);

    // Intentar empacar serie1 estando 'En retrabajo' -> ¡BLOQUEADO!
    const intentoEnRetrabajo = await request(app)
      .post('/api/cajas/empacar-serie')
      .set('x-user-id', '4')
      .send({ id_caja: idCaja, numero_serie: serie1 });
    expect(intentoEnRetrabajo.status).toBe(400);

    // 3. F-06 / RF-13: Tras retrabajo, Inspector de Calidad re-inspecciona serie1 y la libera como 'Aprobada' (1)
    const dictLiberada = await request(app)
      .post('/api/unidades/dictaminar')
      .set('x-user-id', '3')
      .send({
        numero_serie: serie1,
        id_estado_calidad: EstadosCalidadEnum.APROBADA,
        id_usuario: 3,
        comentarios: 'Re-inspección post-retrabajo aprobada',
      });
    expect(dictLiberada.status).toBe(200);
    expect(dictLiberada.body.data.estado_anterior).toBe('En retrabajo');
    expect(dictLiberada.body.data.estado_nuevo).toBe('Aprobada');

    // Liberar también serie2, serieBlanca y serieMax en Calidad para probar las reglas de empaque (INC-B)
    for (const s of [serie2, serieBlanca, serieMax]) {
      await request(app)
        .post('/api/unidades/dictaminar')
        .set('x-user-id', '3')
        .send({
          numero_serie: s,
          id_estado_calidad: EstadosCalidadEnum.APROBADA,
          id_usuario: 3,
        });
    }

    // 4. Ahora serie1 (liberada por Calidad, modelo NS-PRO, color Negro) se empaca con éxito
    const empOk1 = await request(app)
      .post('/api/cajas/empacar-serie')
      .set('x-user-id', '4')
      .send({ id_caja: idCaja, numero_serie: serie1 });
    expect(empOk1.status).toBe(201);

    const empOk2 = await request(app)
      .post('/api/cajas/empacar-serie')
      .set('x-user-id', '4')
      .send({ id_caja: idCaja, numero_serie: serie2 });
    expect(empOk2.status).toBe(201);

    // 5. INC-B / RN-06: Intentar empacar serieBlanca (Color Blanco) en caja de Cliente 1 (Color Negro, sin mezcla) -> ¡BLOQUEADO!
    const empColorInvalido = await request(app)
      .post('/api/cajas/empacar-serie')
      .set('x-user-id', '4')
      .send({ id_caja: idCaja, numero_serie: serieBlanca });
    expect(empColorInvalido.status).toBe(400);
    expect(empColorInvalido.body.error).toContain('RN-06');

    // 6. INC-B / RN-05: Intentar empacar serieMax (Modelo NS-MAX) en caja de NS-PRO -> ¡BLOQUEADO!
    const empModeloInvalido = await request(app)
      .post('/api/cajas/empacar-serie')
      .set('x-user-id', '4')
      .send({ id_caja: idCaja, numero_serie: serieMax });
    expect(empModeloInvalido.status).toBe(400);
    expect(empModeloInvalido.body.error).toContain('RN-05');
  });

  it('RN-09, BD-13, F-10, F-11, INC-C, RNF-03: Cierre/reapertura autorizada de caja y bloqueo de embarque si hay unidad retenida', async () => {
    const cajasRes = await pg.query('SELECT * FROM cajas ORDER BY id ASC');
    const idCaja = (cajasRes.rows[0] as any).id;
    const unidadesRes = await pg.query('SELECT * FROM unidades ORDER BY id ASC');
    const serie2 = (unidadesRes.rows[1] as any).numero_serie;

    // 1. Cerrar la caja 1 (Almacén, usuario ID 4)
    const cerrarRes = await request(app)
      .patch(`/api/cajas/${idCaja}/cerrar`)
      .set('x-user-id', '4')
      .send({ id_usuario: 4 });
    expect(cerrarRes.status).toBe(200);
    expect(cerrarRes.body.data.estado).toBe('Cerrada');

    // 2. RN-09 / BD-13: Solicitar reapertura de caja (Almacén, usuario ID 4) y autorizarla con Supervisor de almacén (usuario ID 5)
    const solReapertura = await request(app)
      .post('/api/autorizaciones/solicitar')
      .set('x-user-id', '4')
      .send({
        tipo: 'REAPERTURA_CAJA',
        id_referencia: idCaja,
        id_usuario_solicita: 4,
        motivo: 'Verificación de etiqueta de cliente antes de embarcar',
      });
    expect(solReapertura.status).toBe(201);
    const idSolCaja = solReapertura.body.solicitud.id;

    // Un Operador (ID 1) NO puede autorizar la reapertura de caja (RN-09 -> 403)
    const intentoOperadorAut = await request(app)
      .patch(`/api/autorizaciones/${idSolCaja}/resolver`)
      .set('x-user-id', '1')
      .send({
        estado: 'APROBADA',
        id_usuario_autoriza: 1,
        comentario_resolucion: 'Intento sin permisos',
      });
    expect(intentoOperadorAut.status).toBe(403);

    // El Supervisor de almacén (ID 5) autoriza la reapertura -> caja vuelve a 'Abierta' y registra en bitacora_permisos
    const autOk = await request(app)
      .patch(`/api/autorizaciones/${idSolCaja}/resolver`)
      .set('x-user-id', '5')
      .send({
        estado: 'APROBADA',
        id_usuario_autoriza: 5,
        comentario_resolucion: 'Autorizado por supervisión de almacén',
      });
    expect(autOk.status).toBe(200);

    // Volver a cerrar la caja para cargarla al embarque
    await request(app)
      .patch(`/api/cajas/${idCaja}/cerrar`)
      .set('x-user-id', '4')
      .send({ id_usuario: 4 });

    // 3. F-10: Crear embarque y asignar la caja cerrada
    const embRes = await request(app)
      .post('/api/embarques')
      .set('x-user-id', '4')
      .send({
        referencia_embarque: 'EMB-2026-001',
        id_pedido: 1,
        id_cliente: 1,
        id_transportista: 1,
        fecha_programada: new Date().toISOString().split('T')[0],
        observaciones: 'Embarque para SoundCorp Retail',
        id_usuario_creo: 4,
      });
    expect(embRes.status).toBe(201);
    const idEmbarque = embRes.body.id;

    const asigCajaRes = await request(app)
      .post('/api/embarques/asignar-caja')
      .set('x-user-id', '4')
      .send({ id_embarque: idEmbarque, id_caja: idCaja, id_usuario: 4 });
    expect(asigCajaRes.status).toBe(201);

    // 4. INC-C / F-11: Calidad pone serie2 (que está dentro de la caja cargada) 'En retención' (3) por sospecha de lote
    await request(app)
      .post('/api/unidades/dictaminar')
      .set('x-user-id', '3')
      .send({
        numero_serie: serie2,
        id_estado_calidad: EstadosCalidadEnum.EN_RETENCION,
        id_usuario: 3,
        comentarios: 'Retención preventiva antes de salida de embarque',
      });

    // Intentar despachar el embarque con serie2 retenida -> ¡BLOQUEADO! (INC-C)
    const despachoBloqueado = await request(app)
      .patch(`/api/embarques/${idEmbarque}/despachar`)
      .set('x-user-id', '4')
      .send({ id_usuario: 4 });
    expect(despachoBloqueado.status).toBe(400);
    expect(despachoBloqueado.body.error).toContain('Incidente C');

    // Calidad libera nuevamente serie2 ('Aprobada') -> ahora el despacho procede y se registra en embarque_historial (RNF-03)
    await request(app)
      .post('/api/unidades/dictaminar')
      .set('x-user-id', '3')
      .send({
        numero_serie: serie2,
        id_estado_calidad: EstadosCalidadEnum.APROBADA,
        id_usuario: 3,
        comentarios: 'Lote verificado y liberado para embarque',
      });

    const despachoOk = await request(app)
      .patch(`/api/embarques/${idEmbarque}/despachar`)
      .set('x-user-id', '4')
      .send({ id_usuario: 4 });
    expect(despachoOk.status).toBe(200);
    expect(despachoOk.body.data.estado).toBe('Despachado');

    const histEmbarque = await request(app).get(`/api/embarques/${idEmbarque}/historial`);
    expect(histEmbarque.status).toBe(200);
    expect(histEmbarque.body.length).toBeGreaterThanOrEqual(3);
  });

  it('INC-A, INC-D, F-12, RF-07, RF-08, RF-25, RF-29, RF-33, RN-11: Cierre de turno de 5 etapas, corrección autorizada, exportación CSV y Trazabilidad 360°', async () => {
    const fechaHoy = new Date().toISOString().split('T')[0];

    // 1. INC-A / RF-33: Consultar métricas de las 5 etapas por turno y desglose por orden (ensambladas=5, probadas=5, liberadas=4, empacadas=2, embarcadas=2)
    const metricasRes = await request(app)
      .get(`/api/turnos/metricas?fecha=${fechaHoy}&id_turno=1&id_linea=1`);
    expect(metricasRes.status).toBe(200);
    expect(metricasRes.body.piezas_ensambladas).toBe(5);
    expect(metricasRes.body.piezas_probadas).toBe(5);
    expect(metricasRes.body.piezas_liberadas).toBe(4);
    expect(metricasRes.body.piezas_empacadas).toBe(2);
    expect(metricasRes.body.piezas_embarcadas).toBe(2);
    expect(Array.isArray(metricasRes.body.desglose_por_orden)).toBe(true);
    expect(metricasRes.body.desglose_por_orden.length).toBeGreaterThanOrEqual(1);

    // RF-33: También soporta filtrado directo por id_orden
    const metricasOrden1 = await request(app)
      .get(`/api/reportes/conteo-etapas?fecha=${fechaHoy}&id_turno=1&id_linea=1&id_orden=1`);
    expect(metricasOrden1.status).toBe(200);
    expect(metricasOrden1.body.piezas_ensambladas).toBe(5);
    expect(metricasOrden1.body.piezas_liberadas).toBe(2);

    // 2. INC-D / F-12: Líder de línea (usuario ID 2, rol 2) consolida el cierre formal de turno
    const cierreRes = await request(app)
      .post('/api/turnos/cierre')
      .set('x-user-id', '2')
      .send({
        fecha: fechaHoy,
        id_turno: 1,
        id_linea: 1,
        id_lider: 2,
        observaciones: 'Cierre de turno matutino L1',
      });
    expect(cierreRes.status).toBe(201);
    const idCierre = cierreRes.body.cierre.id;
    expect(cierreRes.body.cierre.piezas_embarcadas).toBe(2);

    // 3. RN-11: Un Operador (usuario ID 1) NO puede solicitar corrección de cierre de turno (403)
    const solOperador = await request(app)
      .post('/api/autorizaciones/solicitar')
      .set('x-user-id', '1')
      .send({
        tipo: 'CORRECCION_CIERRE_TURNO',
        id_referencia: idCierre,
        id_usuario_solicita: 1,
        motivo: 'Intento de operador de reabrir cierre',
      });
    expect(solOperador.status).toBe(403);

    // 4. RF-08 / RN-11: Líder de línea (usuario ID 2) solicita corrección y Gerente de Producción (usuario ID 7) la aprueba
    const solLider = await request(app)
      .post('/api/autorizaciones/solicitar')
      .set('x-user-id', '2')
      .send({
        tipo: 'CORRECCION_CIERRE_TURNO',
        id_referencia: idCierre,
        id_usuario_solicita: 2,
        motivo: 'Ajuste de conteo al finalizar inspección de lote',
      });
    expect(solLider.status).toBe(201);

    const resGerente = await request(app)
      .patch(`/api/autorizaciones/${solLider.body.solicitud.id}/resolver`)
      .set('x-user-id', '7')
      .send({
        estado: 'APROBADA',
        id_usuario_autoriza: 7,
        comentario_resolucion: 'Autorizado por Gerencia de Producción',
      });
    expect(resGerente.status).toBe(200);

    // Verificar que el cierre pasó a estado 'Corregido'
    const cierresLista = await request(app).get('/api/turnos/cierres');
    const cierreActualizado = cierresLista.body.find((c: any) => c.id === idCierre);
    expect(cierreActualizado.estado).toBe('Corregido');

    // 5. RF-29 / INC-D: Exportar el cierre de turno en CSV
    const csvRes = await request(app).get(`/api/turnos/cierres/${idCierre}/exportar`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Folio Cierre');
    expect(csvRes.text).toContain('CRTE-00001');

    // 6. RF-25 / P-42: Trazabilidad 360° de la primera unidad
    const unidadesRes = await pg.query('SELECT * FROM unidades ORDER BY id ASC');
    const serie1 = (unidadesRes.rows[0] as any).numero_serie;
    const trazaRes = await request(app).get(`/api/unidades/trazabilidad/${serie1}`);
    expect(trazaRes.status).toBe(200);
    expect(trazaRes.body.unidad.numero_serie).toBe(serie1);
    expect(trazaRes.body.prueba_funcional.estado_prueba).toBe('Aprobada');
    expect(trazaRes.body.inspecciones_calidad.length).toBe(2); // Retrabajo -> Aprobada
    expect(trazaRes.body.empaque.length).toBe(1);
    expect(trazaRes.body.embarque.referencia_embarque).toBe('EMB-2026-001');
  });
});
