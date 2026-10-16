import { pool } from '../config/db.js';

export class CajasRepository {
  async getAll() {
    const query = `
      SELECT c.*, 
             COALESCE(cat.tipo_caja, 'Caja Estándar') as tipo_caja,
             COALESCE(cat.capacidad_maxima, 6) as capacidad_maxima,
             ec.id_embarque as id_embarque_asignado
      FROM cajas c
      LEFT JOIN cat_cajas cat ON c.id_cat_caja = cat.id
      LEFT JOIN embarque_caja ec ON c.id = ec.id_caja AND ec.fecha_retiro IS NULL
      ORDER BY c.id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async create(idCatCaja: number, idUsuarioCreador: number) {
    const query = `
      INSERT INTO cajas (estado, id_cat_caja, id_usuario_creador)
      VALUES ('Abierta', $1, $2)
      RETURNING *;
    `;
    const res = await pool.query(query, [idCatCaja, idUsuarioCreador]);
    return res.rows[0];
  }

  async cerrar(id: number) {
    const query = `
      UPDATE cajas 
      SET estado = 'Cerrada', fecha_cierre = NOW() 
      WHERE id = $1 
      RETURNING *;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }

  async empacarUnidad(idUnidad: number, idCaja: number) {
    const res = await pool.query(
      'UPDATE unidades SET id_caja = $1 WHERE id = $2 RETURNING *;',
      [idCaja, idUnidad]
    );
    return res.rows[0];
  }
}
