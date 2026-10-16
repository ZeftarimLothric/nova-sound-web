import { pool } from '../config/db.js';

export class OrdenesRepository {
  async getAll() {
    const query = `
      SELECT o.*, 
             c.nombre_cliente, 
             m.nombre_modelo, 
             col.nombre_color, 
             l.nombre_linea,
             COUNT(u.id) as cantidad_ensamblada,
             COUNT(CASE WHEN u.id_estado_calidad = 1 THEN 1 END) as cantidad_aprobada,
             COUNT(CASE WHEN u.id_estado_calidad = 4 THEN 1 END) as cantidad_scrap
      FROM ordenes o
      LEFT JOIN clientes c ON o.id_cliente = c.id
      LEFT JOIN modelos m ON o.id_modelo = m.id
      LEFT JOIN colores col ON o.id_color = col.id
      LEFT JOIN lineas l ON o.id_linea_asignada = l.id
      LEFT JOIN unidades u ON o.id = u.id_orden
      GROUP BY o.id, c.nombre_cliente, m.nombre_modelo, col.nombre_color, l.nombre_linea
      ORDER BY o.id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }
}
