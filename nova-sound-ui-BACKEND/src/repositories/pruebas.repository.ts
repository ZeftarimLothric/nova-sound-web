import { pool } from '../config/db.js';
import type { PruebaFuncional, Unidad } from '../types/index.js';

export class PruebasRepository {
  async generarSiguienteNumeroSerie(nombreModelo: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `NS-${nombreModelo.replace('NS-', '')}-${yearMonth}-`;

    const query = `
      SELECT numero_serie 
      FROM unidades 
      WHERE numero_serie LIKE $1 
      ORDER BY id DESC 
      LIMIT 1;
    `;
    const res = await pool.query(query, [`${prefix}%`]);

    let nextSeq = 1;
    if (res.rows.length > 0) {
      const lastSerial = res.rows[0].numero_serie as string;
      const parts = lastSerial.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  // BD-03 / BD-04: prueba_funcional sin columna de serie; la serie vive en unidades ligada por id_prueba UNIQUE
  async registrarPrueba(client: any, data: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    id_usuario: number;
    valida_encendido: boolean;
    valida_audio: boolean;
    valida_carga: boolean;
    valida_bluetooth: boolean;
    estado_prueba: 'Aprobada' | 'Reprobada';
  }): Promise<PruebaFuncional> {
    const query = `
      INSERT INTO prueba_funcional (
        id_orden, id_linea, id_turno, id_usuario,
        valida_encendido, valida_audio, valida_carga, valida_bluetooth,
        estado_prueba
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      data.id_orden,
      data.id_linea,
      data.id_turno,
      data.id_usuario,
      data.valida_encendido,
      data.valida_audio,
      data.valida_carga,
      data.valida_bluetooth,
      data.estado_prueba,
    ];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // BD-05 / RF-11: Tabla prueba_defectos con FK al catálogo
  async registrarDefectoPrueba(client: any, data: {
    id_prueba: number;
    id_defecto: number;
    id_usuario: number;
    descripcion?: string;
  }) {
    const query = `
      INSERT INTO prueba_defectos (id_prueba, id_defecto, id_usuario, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const res = await client.query(query, [
      data.id_prueba,
      data.id_defecto,
      data.id_usuario,
      data.descripcion || 'Falla detectada en estación de prueba funcional',
    ]);
    return res.rows[0];
  }

  // BD-08 / RN-01 / RN-03 / RN-04: La unidad nace aquí con id_prueba UNIQUE y id_estado_calidad NULL (Pendiente de inspección en Calidad)
  async crearUnidadDesdePrueba(client: any, data: {
    id_prueba: number;
    id_orden: number;
    id_linea: number;
    id_turno: number;
    numero_serie: string;
    id_estado_calidad?: number | null;
  }): Promise<Unidad> {
    const query = `
      INSERT INTO unidades (
        id_prueba, id_orden, id_linea, id_turno, numero_serie, id_estado_calidad, id_caja
      )
      VALUES ($1, $2, $3, $4, $5, $6, NULL)
      RETURNING *;
    `;
    const res = await client.query(query, [
      data.id_prueba,
      data.id_orden,
      data.id_linea,
      data.id_turno,
      data.numero_serie,
      data.id_estado_calidad ?? null,
    ]);
    return res.rows[0];
  }

  async getRecientes(limit = 20) {
    const query = `
      SELECT pf.*, 
             un.numero_serie,
             o.folio as folio_orden,
             m.nombre_modelo,
             col.nombre_color,
             u.nombre_completo as nombre_operador
      FROM prueba_funcional pf
      LEFT JOIN unidades un ON un.id_prueba = pf.id
      JOIN ordenes o ON pf.id_orden = o.id
      JOIN modelos m ON o.id_modelo = m.id
      JOIN colores col ON o.id_color = col.id
      JOIN usuarios u ON pf.id_usuario = u.id
      ORDER BY pf.id DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }
}
