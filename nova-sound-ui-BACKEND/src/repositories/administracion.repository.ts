import { pool } from '../config/db.js';

export class ParametrosRepository {
  async getAll() {
    const res = await pool.query('SELECT * FROM parametros_sistema ORDER BY id ASC;');
    return res.rows;
  }

  async update(id: number, valor: number) {
    const res = await pool.query(
      'UPDATE parametros_sistema SET valor = $1 WHERE id = $2 RETURNING *;',
      [valor, id]
    );
    return res.rows[0];
  }
}

export class BitacoraRepository {
  async getAll(limit = 100) {
    const query = `
      SELECT b.*, u.nombre_completo, u.nomina 
      FROM bitacora b
      LEFT JOIN usuarios u ON b.id_usuario = u.id
      ORDER BY b.id DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }

  async insert(idUsuario: number, modulo: string, accion: string) {
    const query = `
      INSERT INTO bitacora (id_usuario, modulo, accion)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const res = await pool.query(query, [idUsuario, modulo, accion]);
    return res.rows[0];
  }
}

export class RespaldosRepository {
  async getAll() {
    const query = `
      SELECT r.*, u.nombre_completo, u.usuario_login
      FROM respaldos_log r
      LEFT JOIN usuarios u ON r.id_usuario = u.id
      ORDER BY r.id DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async insert(idUsuario: number, exitoso: boolean) {
    const query = `
      INSERT INTO respaldos_log (id_usuario, exitoso)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const res = await pool.query(query, [idUsuario, exitoso]);
    return res.rows[0];
  }
}
