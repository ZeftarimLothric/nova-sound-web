import { pool } from '../config/db.js';
import type { Unidad } from '../types/index.js';

export class UnidadesRepository {
  async findByNumeroSerie(numeroSerie: string): Promise<Unidad | null> {
    const res = await pool.query('SELECT * FROM unidades WHERE UPPER(numero_serie) = UPPER($1)', [numeroSerie]);
    return res.rows[0] || null;
  }

  async insertUnidad(data: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    numero_serie: string;
    id_estado_calidad: number | null;
  }): Promise<Unidad> {
    const query = `
      INSERT INTO unidades (id_orden, id_linea, id_turno, numero_serie, id_estado_calidad, id_caja)
      VALUES ($1, $2, $3, UPPER($4), $5, NULL)
      RETURNING *;
    `;
    const values = [data.id_orden, data.id_linea, data.id_turno, data.numero_serie, data.id_estado_calidad];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  async updateEstadoCalidad(idUnidad: number, idEstadoCalidad: number): Promise<void> {
    await pool.query('UPDATE unidades SET id_estado_calidad = $1 WHERE id = $2', [idEstadoCalidad, idUnidad]);
  }

  async insertHistorial(data: {
    id_unidad: number;
    id_usuario: number;
    estado_anterior: string;
    estado_nuevo: string;
    motivo: string;
  }): Promise<void> {
    const query = `
      INSERT INTO historial_unidades (id_unidad, id_usuario, estado_anterior, estado_nuevo, motivo)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await pool.query(query, [data.id_unidad, data.id_usuario, data.estado_anterior, data.estado_nuevo, data.motivo]);
  }

  async insertPruebaFuncional(data: {
    id_orden: number;
    id_linea: number;
    id_usuario: number;
    id_turno: number;
    numero_serie: string;
    valida_encendido: boolean;
    valida_audio: boolean;
    valida_carga: boolean;
    valida_bluetooth: boolean;
    estado_prueba: string;
  }): Promise<void> {
    const query = `
      INSERT INTO prueba_funcional (
        id_orden, id_linea, id_usuario, id_turno, numero_serie,
        valida_encendido, valida_audio, valida_carga, valida_bluetooth, estado_prueba
      )
      VALUES ($1, $2, $3, $4, UPPER($5), $6, $7, $8, $9, $10);
    `;
    await pool.query(query, [
      data.id_orden,
      data.id_linea,
      data.id_usuario,
      data.id_turno,
      data.numero_serie,
      data.valida_encendido,
      data.valida_audio,
      data.valida_carga,
      data.valida_bluetooth,
      data.estado_prueba,
    ]);
  }

  async getRecientes(limit = 10): Promise<any[]> {
    const query = `
      SELECT u.*, 
             COALESCE(m.nombre_modelo, 'NS-PRO') as modelo,
             COALESCE(col.nombre_color, 'Negro') as color
      FROM unidades u
      LEFT JOIN ordenes o ON u.id_orden = o.id
      LEFT JOIN modelos m ON o.id_modelo = m.id
      LEFT JOIN colores col ON o.id_color = col.id
      ORDER BY u.id DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }

  async getHistorial(limit = 10) {
    const query = `
      SELECT h.*, u.numero_serie, usr.nombre_completo as usuario_nombre
      FROM historial_unidades h
      JOIN unidades u ON h.id_unidad = u.id
      JOIN usuarios usr ON h.id_usuario = usr.id
      ORDER BY h.id DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }
}
