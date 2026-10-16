import { pool } from '../config/db.js';

export class CatalogosRepository {
  async getLineas() {
    const res = await pool.query('SELECT * FROM lineas ORDER BY id ASC');
    return res.rows;
  }

  async getTurnos() {
    const res = await pool.query('SELECT * FROM turnos ORDER BY id ASC');
    return res.rows;
  }

  async getModelos() {
    const res = await pool.query('SELECT * FROM modelos ORDER BY id ASC');
    return res.rows;
  }

  async getColores() {
    const res = await pool.query('SELECT * FROM colores ORDER BY id ASC');
    return res.rows;
  }

  async getDefectos() {
    const res = await pool.query('SELECT * FROM catalogo_defectos ORDER BY id ASC');
    return res.rows;
  }

  async getEstadosCalidad() {
    const res = await pool.query('SELECT * FROM catalogo_estados_calidad ORDER BY id ASC');
    return res.rows;
  }
}
