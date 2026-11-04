import { pool } from '../config/db.js';
import type { SolicitudAutorizacion } from '../types/index.js';

export class AutorizacionesRepository {
  async generarFolio(): Promise<string> {
    const query = `SELECT id FROM solicitudes_autorizacion ORDER BY id DESC LIMIT 1;`;
    const res = await pool.query(query);
    const nextId = res.rows.length > 0 ? Number(res.rows[0].id) + 1 : 1;
    return `SOL-${String(nextId).padStart(5, '0')}`;
  }

  async create(data: {
    tipo: 'REAPERTURA_CAJA' | 'CORRECCION_CIERRE_TURNO' | 'RETIRO_UNIDAD' | 'RETRABAJO_ESPECIAL';
    id_referencia: number;
    id_usuario_solicita: number;
    motivo: string;
  }): Promise<SolicitudAutorizacion> {
    const folio = await this.generarFolio();
    const query = `
      INSERT INTO solicitudes_autorizacion (
        folio_solicitud, tipo, id_referencia, id_usuario_solicita, motivo, estado
      )
      VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
      RETURNING *;
    `;
    const res = await pool.query(query, [
      folio,
      data.tipo,
      data.id_referencia,
      data.id_usuario_solicita,
      data.motivo,
    ]);
    return res.rows[0];
  }

  async getById(id: number): Promise<SolicitudAutorizacion | null> {
    const query = `SELECT * FROM solicitudes_autorizacion WHERE id = $1;`;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  async resolver(id: number, data: {
    estado: 'APROBADA' | 'RECHAZADA';
    id_usuario_autoriza: number;
    comentario_resolucion: string;
  }): Promise<SolicitudAutorizacion> {
    const query = `
      UPDATE solicitudes_autorizacion
      SET estado = $1,
          id_usuario_autoriza = $2,
          comentario_resolucion = $3,
          fecha_resolucion = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.estado,
      data.id_usuario_autoriza,
      data.comentario_resolucion,
      id,
    ]);
    return res.rows[0];
  }

  async getAll(estado?: string): Promise<SolicitudAutorizacion[]> {
    let query = `
      SELECT sa.*, 
             u_sol.nombre_completo as nombre_solicitante,
             u_aut.nombre_completo as nombre_autorizador
      FROM solicitudes_autorizacion sa
      JOIN usuarios u_sol ON sa.id_usuario_solicita = u_sol.id
      LEFT JOIN usuarios u_aut ON sa.id_usuario_autoriza = u_aut.id
    `;
    const params: any[] = [];
    if (estado) {
      query += ` WHERE sa.estado = $1 `;
      params.push(estado.toUpperCase());
    }
    query += ` ORDER BY sa.id DESC;`;
    const res = await pool.query(query, params);
    return res.rows;
  }
}

