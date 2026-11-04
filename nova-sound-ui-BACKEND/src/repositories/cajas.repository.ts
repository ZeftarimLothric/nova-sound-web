import { pool } from '../config/db.js';
import type { Caja } from '../types/index.js';

export class CajasRepository {
  async getAll(): Promise<Caja[]> {
    const query = `
      SELECT c.*, 
             cli.nombre_cliente,
             cli.permite_mezcla_colores,
             cli.requiere_etiqueta,
             cli.requisitos_empaque,
             m.nombre_modelo,
             m.capacidad_caja as capacidad_maxima,
             col.nombre_color,
             u_crea.nombre_completo as nombre_creador,
             u_cierra.nombre_completo as nombre_cerro,
             COUNT(dc.id) FILTER (WHERE dc.activo = TRUE) as piezas_actuales,
             ec.id_embarque as id_embarque_asignado
      FROM cajas c
      JOIN clientes cli ON c.id_cliente = cli.id
      JOIN modelos m ON c.id_modelo = m.id
      LEFT JOIN colores col ON c.id_color = col.id
      JOIN usuarios u_crea ON c.id_usuario_creador = u_crea.id
      LEFT JOIN usuarios u_cierra ON c.id_usuario_cierra = u_cierra.id
      LEFT JOIN detalle_caja dc ON c.id = dc.id_caja AND dc.activo = TRUE
      LEFT JOIN embarque_caja ec ON c.id = ec.id_caja AND ec.fecha_retiro IS NULL
      GROUP BY c.id, cli.nombre_cliente, cli.permite_mezcla_colores, cli.requiere_etiqueta, cli.requisitos_empaque, m.nombre_modelo, m.capacidad_caja, col.nombre_color, u_crea.nombre_completo, u_cierra.nombre_completo, ec.id_embarque
      ORDER BY c.id DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async getById(id: number): Promise<Caja | null> {
    const query = `
      SELECT c.*, 
             cli.nombre_cliente,
             cli.permite_mezcla_colores,
             cli.requiere_etiqueta,
             cli.requisitos_empaque,
             m.nombre_modelo,
             m.capacidad_caja as capacidad_maxima,
             col.nombre_color,
             COUNT(dc.id) FILTER (WHERE dc.activo = TRUE) as piezas_actuales
      FROM cajas c
      JOIN clientes cli ON c.id_cliente = cli.id
      JOIN modelos m ON c.id_modelo = m.id
      LEFT JOIN colores col ON c.id_color = col.id
      LEFT JOIN detalle_caja dc ON c.id = dc.id_caja AND dc.activo = TRUE
      WHERE c.id = $1
      GROUP BY c.id, cli.nombre_cliente, cli.permite_mezcla_colores, cli.requiere_etiqueta, cli.requisitos_empaque, m.nombre_modelo, m.capacidad_caja, col.nombre_color;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  async generarSiguienteCodigoCaja(): Promise<string> {
    const query = `SELECT id FROM cajas ORDER BY id DESC LIMIT 1;`;
    const res = await pool.query(query);
    const nextId = res.rows.length > 0 ? Number(res.rows[0].id) + 1 : 1;
    return `BOX-${String(nextId).padStart(5, '0')}`;
  }

  async create(data: {
    codigo_caja?: string;
    id_cliente: number;
    id_modelo: number;
    id_color?: number | null;
    id_usuario_creador: number;
  }): Promise<Caja> {
    const codigo = data.codigo_caja || (await this.generarSiguienteCodigoCaja());
    const query = `
      INSERT INTO cajas (
        codigo_caja, id_cliente, id_modelo, id_color, estado, id_usuario_creador
      )
      VALUES ($1, $2, $3, $4, 'Abierta', $5)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      codigo,
      data.id_cliente,
      data.id_modelo,
      data.id_color || null,
      data.id_usuario_creador,
    ]);
    const nuevaCaja = res.rows[0];

    await pool.query(
      `INSERT INTO historial_movimientos (id_caja, evento, id_usuario, detalles)
       VALUES ($1, $2, $3, $4)`,
      [nuevaCaja.id, 'Apertura de caja', data.id_usuario_creador, `Caja ${nuevaCaja.codigo_caja} creada en estado Abierta`]
    );

    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.id_usuario_creador,
        'Empaque',
        `Apertura de caja ${nuevaCaja.codigo_caja}`,
        'cajas',
        nuevaCaja.id,
        JSON.stringify({ codigo_caja: nuevaCaja.codigo_caja, estado: 'Abierta' }),
        'Preparación de empaque',
      ]
    );

    return nuevaCaja;
  }

  async cerrar(id: number, idUsuarioCierra: number): Promise<Caja> {
    const query = `
      UPDATE cajas 
      SET estado = 'Cerrada', 
          fecha_cierre = CURRENT_TIMESTAMP,
          id_usuario_cierra = $2
      WHERE id = $1 
      RETURNING *;
    `;
    const res = await pool.query(query, [id, idUsuarioCierra]);
    const cajaCerrada = res.rows[0];

    if (cajaCerrada) {
      await pool.query(
        `INSERT INTO historial_movimientos (id_caja, evento, id_usuario, detalles)
         VALUES ($1, $2, $3, $4)`,
        [id, 'Cierre de caja', idUsuarioCierra, `Caja ${cajaCerrada.codigo_caja} cerrada formalmente`]
      );

      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          idUsuarioCierra,
          'Empaque',
          `Cierre formal de caja ${cajaCerrada.codigo_caja}`,
          'cajas',
          id,
          'Abierta',
          'Cerrada',
          'Cierre de empaque terminado',
        ]
      );
    }

    return cajaCerrada;
  }

  async reabrir(id: number, idUsuarioAutoriza: number, motivo: string, idSolicitud?: number): Promise<Caja> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE cajas 
        SET estado = 'Abierta', 
          fecha_cierre = NULL,
          id_usuario_cierra = NULL
        WHERE id = $1 
        RETURNING *;
      `;
      const res = await client.query(query, [id]);
      const cajaReabierta = res.rows[0];

      // Registrar permiso de reapertura ligado a la solicitud (BD-13 / RN-09)
      await client.query(
        `INSERT INTO bitacora_permisos (id_caja, id_solicitud, id_usuario_autoriza, motivo)
         VALUES ($1, $2, $3, $4)`,
        [id, idSolicitud || null, idUsuarioAutoriza, motivo]
      );

      // Registrar en historial_movimientos de la caja (RNF-03)
      await client.query(
        `INSERT INTO historial_movimientos (id_caja, evento, id_usuario, detalles)
         VALUES ($1, $2, $3, $4)`,
        [id, 'Reapertura autorizada', idUsuarioAutoriza, `Motivo: ${motivo} (Solicitud: ${idSolicitud || 'Directa'})`]
      );

      // Registrar en bitácora unificada con autorización (BD-15 / RN-12)
      await client.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo, id_autorizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          idUsuarioAutoriza,
          'Empaque',
          `Reapertura autorizada de caja ${cajaReabierta?.codigo_caja || id}`,
          'cajas',
          id,
          'Cerrada',
          'Abierta',
          motivo,
          idSolicitud || null,
        ]
      );

      await client.query('COMMIT');
      return cajaReabierta;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getDetalleContenido(idCaja: number) {
    const query = `
      SELECT dc.id as id_detalle, dc.fecha_asignacion,
             u.id as id_unidad, u.numero_serie,
             m.nombre_modelo, col.nombre_color,
             COALESCE(ec.nombre_estado, 'Pendiente de Calidad') as estado_calidad,
             usr.nombre_completo as empacado_por
      FROM detalle_caja dc
      JOIN unidades u ON dc.id_unidad = u.id
      JOIN ordenes o ON u.id_orden = o.id
      JOIN modelos m ON o.id_modelo = m.id
      JOIN colores col ON o.id_color = col.id
      LEFT JOIN catalogo_estados_calidad ec ON u.id_estado_calidad = ec.id
      JOIN usuarios usr ON dc.id_usuario_asigna = usr.id
      WHERE dc.id_caja = $1 AND dc.activo = TRUE
      ORDER BY dc.id ASC;
    `;
    const res = await pool.query(query, [idCaja]);
    return res.rows;
  }

  async getHistorialMovimientos(idCaja: number) {
    const query = `
      SELECT hm.*, u.nombre_completo as usuario_nombre
      FROM historial_movimientos hm
      JOIN usuarios u ON hm.id_usuario = u.id
      WHERE hm.id_caja = $1
      ORDER BY hm.id DESC;
    `;
    const res = await pool.query(query, [idCaja]);
    return res.rows;
  }

  async empacarUnidad(idCaja: number, idUnidad: number, idUsuario: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar en detalle_caja
      const resDetalle = await client.query(
        `INSERT INTO detalle_caja (id_caja, id_unidad, id_usuario_asigna, activo)
         VALUES ($1, $2, $3, TRUE)
         RETURNING *;`,
        [idCaja, idUnidad, idUsuario]
      );

      // 2. Actualizar puntero id_caja en unidades
      await client.query(
        `UPDATE unidades SET id_caja = $1 WHERE id = $2;`,
        [idCaja, idUnidad]
      );

      // 3. Registrar en historial_movimientos (RNF-03)
      await client.query(
        `INSERT INTO historial_movimientos (id_caja, evento, id_usuario, detalles)
         VALUES ($1, $2, $3, $4)`,
        [idCaja, 'Asignación de unidad', idUsuario, `Unidad ID ${idUnidad} agregada a la caja`]
      );

      // 4. Registrar en bitácora unificada (RN-12 / BD-15)
      await client.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          idUsuario,
          'Empaque',
          `Empaque de unidad ID ${idUnidad} en caja ID ${idCaja}`,
          'detalle_caja',
          resDetalle.rows[0].id,
          JSON.stringify({ id_caja: idCaja, id_unidad: idUnidad }),
          'Ingreso de unidad liberada a caja',
        ]
      );

      await client.query('COMMIT');
      return resDetalle.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async retirarUnidad(idCaja: number, idUnidad: number, idUsuario: number, motivo: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Marcar inactivo en detalle_caja con fecha y motivo (BD-07 / RF-19)
      const res = await client.query(
        `UPDATE detalle_caja
         SET activo = FALSE,
             fecha_retiro = CURRENT_TIMESTAMP,
             id_usuario_retira = $1,
             motivo_retiro = $2
         WHERE id_caja = $3 AND id_unidad = $4 AND activo = TRUE
         RETURNING *;`,
        [idUsuario, motivo, idCaja, idUnidad]
      );

      // 2. Poner id_caja en NULL en unidades
      await client.query(
        `UPDATE unidades SET id_caja = NULL WHERE id = $1;`,
        [idUnidad]
      );

      // 3. Registrar en historial_movimientos (RNF-03)
      await client.query(
        `INSERT INTO historial_movimientos (id_caja, evento, id_usuario, detalles)
         VALUES ($1, $2, $3, $4)`,
        [idCaja, 'Retiro de unidad', idUsuario, `Unidad ID ${idUnidad} retirada. Motivo: ${motivo}`]
      );

      // 4. Registrar en bitácora unificada (RN-12 / BD-15)
      await client.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          idUsuario,
          'Empaque',
          `Retiro de unidad ID ${idUnidad} de caja ID ${idCaja}`,
          'detalle_caja',
          res.rows[0]?.id || idCaja,
          `id_caja=${idCaja}`,
          'id_caja=NULL',
          motivo,
        ]
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
