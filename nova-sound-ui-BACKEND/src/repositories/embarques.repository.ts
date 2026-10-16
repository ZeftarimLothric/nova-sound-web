import { pool } from '../config/db.js';

export class EmbarquesRepository {
  async getAll() {
    const query = `
      SELECT e.*, 
             c.nombre_cliente, 
             t.nombre as transportista_nombre, 
             t.rfc as transportista_rfc, 
             t.telefono as transportista_telefono,
             u.nombre_completo as usuario_creo_nombre
      FROM embarque e
      LEFT JOIN clientes c ON e.id_cliente = c.id
      LEFT JOIN transportista t ON e.id_transportista = t.id
      LEFT JOIN usuarios u ON e.id_usuario_creo = u.id
      ORDER BY e.id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
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
      INSERT INTO embarque (referencia_embarque, id_pedido, id_cliente, id_transportista, fecha_programada, estado, observaciones, id_usuario_creo)
      VALUES ($1, $2, $3, $4, $5, 'Preparación', $6, $7)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.referencia_embarque,
      data.id_pedido || 1,
      data.id_cliente,
      data.id_transportista,
      data.fecha_programada,
      data.observaciones,
      data.id_usuario_creo,
    ]);
    return res.rows[0];
  }

  async despachar(id: number, idUsuarioConfirmo: number) {
    const query = `
      UPDATE embarque
      SET estado = 'En Tránsito', fecha_salida = CURRENT_DATE, id_usuario_confirmo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const res = await pool.query(query, [idUsuarioConfirmo, id]);
    return res.rows[0];
  }

  async asignarCaja(idEmbarque: number, idCaja: number, idUsuario: number) {
    const query = `
      INSERT INTO embarque_caja (id_embarque, id_caja, id_usuario_asigna)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const res = await pool.query(query, [idEmbarque, idCaja, idUsuario]);
    return res.rows[0];
  }

  async retirarCaja(idEmbarque: number, idCaja: number, motivo: string) {
    const query = `
      UPDATE embarque_caja
      SET fecha_retiro = NOW(), motivo_retiro = $1
      WHERE id_embarque = $2 AND id_caja = $3 AND fecha_retiro IS NULL
      RETURNING *;
    `;
    const res = await pool.query(query, [motivo, idEmbarque, idCaja]);
    return res.rows[0];
  }
}
