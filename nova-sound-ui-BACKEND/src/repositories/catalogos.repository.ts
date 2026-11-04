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

  async createModelo(data: { nombre_modelo: string; capacidad_caja: number; descripcion?: string }) {
    const res = await pool.query(
      `INSERT INTO modelos (nombre_modelo, capacidad_caja, descripcion)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [data.nombre_modelo.trim(), Number(data.capacidad_caja), data.descripcion || null]
    );
    return res.rows[0];
  }

  async getColores() {
    const res = await pool.query('SELECT * FROM colores ORDER BY id ASC');
    return res.rows;
  }

  async createColor(data: { nombre_color: string }) {
    const res = await pool.query(
      `INSERT INTO colores (nombre_color) VALUES ($1) RETURNING *;`,
      [data.nombre_color.trim()]
    );
    return res.rows[0];
  }

  async getDefectos() {
    const res = await pool.query('SELECT * FROM catalogo_defectos ORDER BY categoria ASC, id ASC');
    return res.rows;
  }

  async createDefecto(data: {
    categoria: 'Apariencia' | 'Funcional' | 'Identificación' | 'Empaque';
    descripcion: string;
    severidad?: 'Crítico' | 'Mayor' | 'Menor';
  }) {
    const res = await pool.query(
      `INSERT INTO catalogo_defectos (categoria, descripcion, severidad, activo)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *;`,
      [data.categoria, data.descripcion.trim(), data.severidad || 'Mayor']
    );
    return res.rows[0];
  }

  async getEstadosCalidad() {
    const res = await pool.query('SELECT * FROM catalogo_estados_calidad ORDER BY id ASC');
    return res.rows;
  }

  // RF-32 / P-38: Catálogos de clientes, transportistas y roles oficiales
  async getClientes() {
    const res = await pool.query('SELECT * FROM clientes ORDER BY id ASC');
    return res.rows;
  }

  async createCliente(data: {
    nombre_cliente: string;
    tipo_cliente?: string;
    permite_mezcla_colores?: boolean;
    requiere_etiqueta?: boolean;
    requisitos_empaque?: string;
  }) {
    const res = await pool.query(
      `INSERT INTO clientes (nombre_cliente, tipo_cliente, permite_mezcla_colores, requiere_etiqueta, requisitos_empaque, activo)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *;`,
      [
        data.nombre_cliente.trim(),
        data.tipo_cliente || 'Distribuidor',
        Boolean(data.permite_mezcla_colores),
        Boolean(data.requiere_etiqueta),
        data.requisitos_empaque || null,
      ]
    );
    return res.rows[0];
  }

  async getTransportistas() {
    const res = await pool.query('SELECT * FROM transportista ORDER BY id ASC');
    return res.rows;
  }

  async getRoles() {
    const res = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    return res.rows;
  }
}
