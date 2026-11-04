import { pool } from '../config/db.js';
import type { EnsambleLote } from '../types/index.js';

export class EnsambleRepository {
  // BD-10: Conteo de ensamble con id_linea y fecha_produccion; sin id_modelo
  async registrarConteo(data: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    id_operador: number;
    cantidad: number;
    id_usuario_registro: number;
  }): Promise<EnsambleLote> {
    const query = `
      INSERT INTO ensamble (
        id_orden, id_linea, id_turno, id_operador, cantidad, fecha_produccion, id_usuario_registro
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
      RETURNING *;
    `;
    const values = [
      data.id_orden,
      data.id_linea,
      data.id_turno,
      data.id_operador,
      data.cantidad,
      data.id_usuario_registro,
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  async getConteoPorTurno(fecha: string, idTurno: number, idLinea: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(cantidad), 0) as total
      FROM ensamble
      WHERE fecha_produccion = $1 AND id_turno = $2 AND id_linea = $3;
    `;
    const res = await pool.query(query, [fecha, idTurno, idLinea]);
    return Number(res.rows[0]?.total || 0);
  }

  async getHistorialReciente(idLinea?: number, limit = 20) {
    let query = `
      SELECT e.*, 
             o.folio as folio_orden,
             m.nombre_modelo,
             col.nombre_color,
             u.nombre_completo as nombre_operador,
             l.nombre_linea,
             t.nombre_turno
      FROM ensamble e
      JOIN ordenes o ON e.id_orden = o.id
      JOIN modelos m ON o.id_modelo = m.id
      JOIN colores col ON o.id_color = col.id
      JOIN usuarios u ON e.id_operador = u.id
      JOIN lineas l ON e.id_linea = l.id
      JOIN turnos t ON e.id_turno = t.id
    `;

    const params: any[] = [];
    if (idLinea) {
      query += ` WHERE e.id_linea = $1 `;
      params.push(idLinea);
    }

    query += ` ORDER BY e.id DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const res = await pool.query(query, params);
    return res.rows;
  }

  // BD-06: defectos_ensamble con FK a ensamble y al catálogo de defectos
  async registrarDefecto(data: {
    id_ensamble: number;
    id_defecto: number;
    etapa?: string;
    cantidad: number;
    motivo: string;
    id_usuario_registro: number;
  }) {
    const query = `
      INSERT INTO defectos_ensamble (id_ensamble, id_defecto, etapa, cantidad, motivo, id_usuario_registro)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.id_ensamble,
      data.id_defecto,
      data.etapa || 'Ensamble Mecánico',
      data.cantidad || 1,
      data.motivo,
      data.id_usuario_registro,
    ]);
    return res.rows[0];
  }
}
