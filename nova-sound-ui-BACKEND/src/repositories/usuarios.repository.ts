import { pool } from '../config/db.js';

export class UsuariosRepository {
  async getAll() {
    const res = await pool.query(`
      SELECT u.id, u.nomina, u.nombre_completo, u.usuario_login, u.id_rol, u.activo, r.nombre_rol
      FROM usuarios u
      LEFT JOIN roles r ON u.id_rol = r.id
      ORDER BY u.id ASC;
    `);
    return res.rows;
  }

  async create(data: {
    nomina: string;
    nombre_completo: string;
    usuario_login: string;
    id_rol: number;
    contrasena_hash?: string;
  }) {
    const query = `
      INSERT INTO usuarios (nomina, nombre_completo, usuario_login, contrasena_hash, id_rol, activo)
      VALUES (UPPER($1), $2, LOWER($3), $4, $5, TRUE)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.nomina,
      data.nombre_completo,
      data.usuario_login,
      data.contrasena_hash || 'hash_default_123',
      data.id_rol,
    ]);
    return res.rows[0];
  }

  async toggleActivo(id: number) {
    const res = await pool.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id = $1 RETURNING *;',
      [id]
    );
    return res.rows[0];
  }

  async findByLoginOrNomina(identifier: string) {
    const res = await pool.query(`
      SELECT u.id, u.nomina, u.nombre_completo, u.usuario_login, u.contrasena_hash, u.id_rol, u.activo, r.nombre_rol
      FROM usuarios u
      LEFT JOIN roles r ON u.id_rol = r.id
      WHERE LOWER(u.usuario_login) = LOWER($1) OR UPPER(u.nomina) = UPPER($1)
      LIMIT 1;
    `, [identifier.trim()]);
    return res.rows[0] || null;
  }
}
