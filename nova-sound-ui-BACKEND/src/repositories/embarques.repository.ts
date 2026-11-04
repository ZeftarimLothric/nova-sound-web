import { pool } from '../config/db.js';

export class EmbarquesRepository {
  async getAll() {
    const query = `
      SELECT e.*, 
             c.nombre_cliente, 
             t.nombre as transportista_nombre, 
             t.rfc as transportista_rfc, 
             t.telefono as transportista_telefono,
             u.nombre_completo as usuario_creo_nombre,
             u_conf.nombre_completo as usuario_confirmo_nombre,
             COUNT(ec.id) FILTER (WHERE ec.fecha_retiro IS NULL) as total_cajas_cargadas
      FROM embarque e
      LEFT JOIN clientes c ON e.id_cliente = c.id
      LEFT JOIN transportista t ON e.id_transportista = t.id
      LEFT JOIN usuarios u ON e.id_usuario_creo = u.id
      LEFT JOIN usuarios u_conf ON e.id_usuario_confirmo = u_conf.id
      LEFT JOIN embarque_caja ec ON e.id = ec.id_embarque AND ec.fecha_retiro IS NULL
      GROUP BY e.id, c.nombre_cliente, t.nombre, t.rfc, t.telefono, u.nombre_completo, u_conf.nombre_completo
      ORDER BY e.id DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async getById(id: number) {
    const query = `
      SELECT e.*, 
             c.nombre_cliente, 
             t.nombre as transportista_nombre
      FROM embarque e
      LEFT JOIN clientes c ON e.id_cliente = c.id
      LEFT JOIN transportista t ON e.id_transportista = t.id
      WHERE e.id = $1;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  async create(data: {
    referencia_embarque: string;
    id_pedido?: number;
    id_cliente: number;
    id_transportista: number;
    fecha_programada: string;
    observaciones: string;
    id_usuario_creo: number;
  }) {
    const query = `
      INSERT INTO embarque (
        referencia_embarque, id_pedido, id_cliente, id_transportista,
        fecha_programada, estado, observaciones, id_usuario_creo
      )
      VALUES ($1, $2, $3, $4, $5, 'Programado', $6, $7)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.referencia_embarque,
      data.id_pedido || 1,
      data.id_cliente,
      data.id_transportista,
      data.fecha_programada,
      data.observaciones || 'Embarque regular',
      data.id_usuario_creo,
    ]);
    const nuevo = res.rows[0];

    // RNF-03: Registrar en embarque_historial
    await pool.query(
      `INSERT INTO embarque_historial (id_embarque, operacion, estado_anterior, estado_nuevo, id_usuario, detalle)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nuevo.id, 'Programación de embarque', null, 'Programado', data.id_usuario_creo, `Embarque ${nuevo.referencia_embarque} creado`]
    );

    // RN-12 / BD-15: Registrar en bitácora unificada
    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.id_usuario_creo,
        'Embarques',
        `Creación de embarque ${nuevo.referencia_embarque}`,
        'embarque',
        nuevo.id,
        JSON.stringify({ referencia_embarque: nuevo.referencia_embarque, estado: 'Programado' }),
        data.observaciones || 'Programación de embarque',
      ]
    );

    return nuevo;
  }

  // INC-C / F-11: Consultar si existen unidades no liberadas (o pendientes de Calidad) en el embarque
  async getUnidadesNoLiberadas(idEmbarque: number) {
    const query = `
      SELECT u.numero_serie, c.codigo_caja, COALESCE(ec_cal.nombre_estado, 'Pendiente de Calidad') as estado_calidad
      FROM embarque_caja ec
      JOIN detalle_caja dc ON ec.id_caja = dc.id_caja AND dc.activo = TRUE
      JOIN cajas c ON ec.id_caja = c.id
      JOIN unidades u ON dc.id_unidad = u.id
      LEFT JOIN catalogo_estados_calidad ec_cal ON u.id_estado_calidad = ec_cal.id
      WHERE ec.id_embarque = $1
        AND ec.fecha_retiro IS NULL
        AND (u.id_estado_calidad IS NULL OR COALESCE(ec_cal.permite_empaque, FALSE) = FALSE);
    `;
    const res = await pool.query(query, [idEmbarque]);
    return res.rows;
  }

  // F-10: Consultar si hay cajas abiertas en el embarque
  async getCajasAbiertas(idEmbarque: number) {
    const query = `
      SELECT c.id, c.codigo_caja, c.estado
      FROM embarque_caja ec
      JOIN cajas c ON ec.id_caja = c.id
      WHERE ec.id_embarque = $1
        AND ec.fecha_retiro IS NULL
        AND c.estado <> 'Cerrada';
    `;
    const res = await pool.query(query, [idEmbarque]);
    return res.rows;
  }

  async despachar(id: number, idUsuarioConfirmo: number) {
    const prev = await this.getById(id);
    const query = `
      UPDATE embarque
      SET estado = 'Despachado', 
          fecha_salida = CURRENT_TIMESTAMP, 
          id_usuario_confirmo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const res = await pool.query(query, [idUsuarioConfirmo, id]);
    const despachado = res.rows[0];

    // RNF-03: Registrar en embarque_historial
    await pool.query(
      `INSERT INTO embarque_historial (id_embarque, operacion, estado_anterior, estado_nuevo, id_usuario, detalle)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'Confirmación de despacho',
        prev?.estado || 'En Carga',
        'Despachado',
        idUsuarioConfirmo,
        'Salida de embarque confirmada tras revalidación de Calidad (F-11 / INC-C)',
      ]
    );

    // RN-12 / BD-15: Registrar en bitácora unificada
    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        idUsuarioConfirmo,
        'Embarques',
        `Despacho confirmado de embarque ${despachado?.referencia_embarque || id}`,
        'embarque',
        id,
        prev?.estado || 'En Carga',
        'Despachado',
        'Salida autorizada de planta',
      ]
    );

    return despachado;
  }

  async asignarCaja(idEmbarque: number, idCaja: number, idUsuario: number) {
    const prev = await this.getById(idEmbarque);
    const query = `
      INSERT INTO embarque_caja (id_embarque, id_caja, id_usuario_asigna)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const res = await pool.query(query, [idEmbarque, idCaja, idUsuario]);
    const asignada = res.rows[0];

    if (prev && prev.estado === 'Programado') {
      await pool.query(`UPDATE embarque SET estado = 'En Carga' WHERE id = $1`, [idEmbarque]);
    }

    // RNF-03: Registrar en embarque_historial
    await pool.query(
      `INSERT INTO embarque_historial (id_embarque, operacion, estado_anterior, estado_nuevo, id_caja, id_usuario, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        idEmbarque,
        'Carga de caja al embarque',
        prev?.estado || 'Programado',
        prev?.estado === 'Programado' ? 'En Carga' : prev?.estado || 'En Carga',
        idCaja,
        idUsuario,
        `Caja ID ${idCaja} asignada al embarque`,
      ]
    );

    // RN-12 / BD-15: Registrar en bitácora unificada
    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        idUsuario,
        'Embarques',
        `Asignación de caja ID ${idCaja} a embarque ID ${idEmbarque}`,
        'embarque_caja',
        asignada.id,
        JSON.stringify({ id_embarque: idEmbarque, id_caja: idCaja }),
        'Carga en andén',
      ]
    );

    return asignada;
  }

  async retirarCaja(idEmbarque: number, idCaja: number, idUsuario: number, motivo: string) {
    const prev = await this.getById(idEmbarque);
    const query = `
      UPDATE embarque_caja
      SET fecha_retiro = CURRENT_TIMESTAMP, 
          id_usuario_retira = $1,
          motivo_retiro = $2
      WHERE id_embarque = $3 AND id_caja = $4 AND fecha_retiro IS NULL
      RETURNING *;
    `;
    const res = await pool.query(query, [idUsuario, motivo, idEmbarque, idCaja]);
    const retirada = res.rows[0];

    // RNF-03 / RF-22: Registrar retiro en embarque_historial con motivo y usuario
    await pool.query(
      `INSERT INTO embarque_historial (id_embarque, operacion, estado_anterior, estado_nuevo, id_caja, id_usuario, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        idEmbarque,
        'Retiro de caja del embarque',
        prev?.estado || 'En Carga',
        prev?.estado || 'En Carga',
        idCaja,
        idUsuario,
        `Caja ID ${idCaja} retirada. Motivo: ${motivo}`,
      ]
    );

    // RN-12 / BD-15: Registrar en bitácora unificada
    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        idUsuario,
        'Embarques',
        `Retiro de caja ID ${idCaja} del embarque ID ${idEmbarque}`,
        'embarque_caja',
        retirada?.id || idEmbarque,
        `id_caja=${idCaja} (Activa)`,
        `id_caja=${idCaja} (Retirada)`,
        motivo,
      ]
    );

    return retirada;
  }

  async getHistorial(idEmbarque: number) {
    const query = `
      SELECT eh.*, u.nombre_completo as usuario_nombre, c.codigo_caja
      FROM embarque_historial eh
      JOIN usuarios u ON eh.id_usuario = u.id
      LEFT JOIN cajas c ON eh.id_caja = c.id
      WHERE eh.id_embarque = $1
      ORDER BY eh.id DESC;
    `;
    const res = await pool.query(query, [idEmbarque]);
    return res.rows;
  }
}
