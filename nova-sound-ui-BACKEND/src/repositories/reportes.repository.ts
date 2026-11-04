import { pool } from '../config/db.js';
import type { Objetivo } from '../types/index.js';

export class ReportesRepository {
  // BD-11 / RF-05: Consultar objetivos por fecha, turno, línea y modelo
  async getObjetivos(filtros: {
    fecha?: string;
    id_turno?: number;
    id_linea?: number;
    id_modelo?: number;
  }): Promise<Objetivo[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filtros.fecha) {
      params.push(filtros.fecha);
      conditions.push(`obj.fecha = $${params.length}`);
    }
    if (filtros.id_turno) {
      params.push(filtros.id_turno);
      conditions.push(`obj.id_turno = $${params.length}`);
    }
    if (filtros.id_linea) {
      params.push(filtros.id_linea);
      conditions.push(`obj.id_linea = $${params.length}`);
    }
    if (filtros.id_modelo) {
      params.push(filtros.id_modelo);
      conditions.push(`obj.id_modelo = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT obj.*,
             t.nombre_turno,
             l.nombre_linea,
             m.nombre_modelo
      FROM objetivos obj
      JOIN turnos t ON obj.id_turno = t.id
      JOIN lineas l ON obj.id_linea = l.id
      JOIN modelos m ON obj.id_modelo = m.id
      ${whereClause}
      ORDER BY obj.fecha DESC, obj.id_linea ASC, obj.id_turno ASC;
    `;
    const res = await pool.query(query, params);
    return res.rows;
  }

  // BD-11 / RF-05: Crear o actualizar objetivo por clave única (fecha + turno + línea + modelo)
  async upsertObjetivo(data: {
    fecha: string;
    id_turno: number;
    id_linea: number;
    id_modelo: number;
    cantidad_objetivo: number;
  }): Promise<Objetivo> {
    const query = `
      INSERT INTO objetivos (fecha, id_turno, id_linea, id_modelo, cantidad_objetivo)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (fecha, id_turno, id_linea, id_modelo)
      DO UPDATE SET cantidad_objetivo = EXCLUDED.cantidad_objetivo
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.fecha,
      data.id_turno,
      data.id_linea,
      data.id_modelo,
      data.cantidad_objetivo,
    ]);
    return res.rows[0];
  }

  // RF-27 / P-31: Distribución de calidad con Retrabajo y Retención SEPARADOS
  async getDistribucionCalidad(filtros: {
    id_linea?: number;
    id_turno?: number;
    id_modelo?: number;
    id_orden?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filtros.id_linea) {
      params.push(filtros.id_linea);
      conditions.push(`u.id_linea = $${params.length}`);
    }
    if (filtros.id_turno) {
      params.push(filtros.id_turno);
      conditions.push(`u.id_turno = $${params.length}`);
    }
    if (filtros.id_modelo) {
      params.push(filtros.id_modelo);
      conditions.push(`o.id_modelo = $${params.length}`);
    }
    if (filtros.id_orden) {
      params.push(filtros.id_orden);
      conditions.push(`u.id_orden = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE u.id_estado_calidad = 1) as aprobadas,
        COUNT(*) FILTER (WHERE u.id_estado_calidad = 2) as en_retrabajo,
        COUNT(*) FILTER (WHERE u.id_estado_calidad = 3) as en_retencion,
        COUNT(*) FILTER (WHERE u.id_estado_calidad = 4) as scrap,
        COUNT(*) as total_unidades
      FROM unidades u
      JOIN ordenes o ON u.id_orden = o.id
      ${whereClause};
    `;
    const res = await pool.query(query, params);
    const row = res.rows[0] || {};
    const total = Number(row.total_unidades || 0);
    const rechazadas = Number(row.en_retrabajo || 0) + Number(row.en_retencion || 0) + Number(row.scrap || 0);

    return {
      aprobadas: Number(row.aprobadas || 0),
      en_retrabajo: Number(row.en_retrabajo || 0),
      en_retencion: Number(row.en_retencion || 0),
      scrap: Number(row.scrap || 0),
      total_unidades: total,
      porcentaje_rechazo: total > 0 ? Number(((rechazadas / total) * 100).toFixed(2)) : 0,
    };
  }

  // RF-14 / RF-15 / RF-28 / P-33 / BD-05 / BD-06:
  // Top de defectos (Pareto) con las 4 categorías oficiales y filtros por modelo, línea, turno, orden y disposición
  async getParetoDefectos(filtros: {
    id_modelo?: number;
    id_linea?: number;
    id_turno?: number;
    id_orden?: number;
    id_estado_resultado?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filtros.id_modelo) {
      params.push(filtros.id_modelo);
      conditions.push(`t.id_modelo = $${params.length}`);
    }
    if (filtros.id_linea) {
      params.push(filtros.id_linea);
      conditions.push(`t.id_linea = $${params.length}`);
    }
    if (filtros.id_turno) {
      params.push(filtros.id_turno);
      conditions.push(`t.id_turno = $${params.length}`);
    }
    if (filtros.id_orden) {
      params.push(filtros.id_orden);
      conditions.push(`t.id_orden = $${params.length}`);
    }
    if (filtros.id_estado_resultado) {
      params.push(filtros.id_estado_resultado);
      conditions.push(`t.id_estado_resultado = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      WITH todos_defectos AS (
        -- 1. Defectos de inspección de calidad
        SELECT ddu.id_defecto, o.id_modelo, u.id_linea, u.id_turno, u.id_orden, ic.id_estado_resultado, 1 as cantidad
        FROM detalle_defectos_unidad ddu
        JOIN inspecciones_calidad ic ON ddu.id_inspeccion = ic.id
        JOIN unidades u ON ic.id_unidad = u.id
        JOIN ordenes o ON u.id_orden = o.id

        UNION ALL

        -- 2. Defectos de prueba funcional (BD-05: prueba_defectos)
        SELECT pd.id_defecto, o.id_modelo, pf.id_linea, pf.id_turno, pf.id_orden, NULL::int as id_estado_resultado, 1 as cantidad
        FROM prueba_defectos pd
        JOIN prueba_funcional pf ON pd.id_prueba = pf.id
        JOIN ordenes o ON pf.id_orden = o.id

        UNION ALL

        -- 3. Defectos de ensamble (BD-06: defectos_ensamble)
        SELECT de.id_defecto, o.id_modelo, e.id_linea, e.id_turno, e.id_orden, NULL::int as id_estado_resultado, de.cantidad
        FROM defectos_ensamble de
        JOIN ensamble e ON de.id_ensamble = e.id
        JOIN ordenes o ON e.id_orden = o.id
      )
      SELECT cd.id as id_defecto,
             cd.categoria,
             cd.descripcion,
             cd.severidad,
             COALESCE(SUM(t.cantidad), 0) as total_incidencias
      FROM todos_defectos t
      JOIN catalogo_defectos cd ON t.id_defecto = cd.id
      ${whereClause}
      GROUP BY cd.id, cd.categoria, cd.descripcion, cd.severidad
      ORDER BY total_incidencias DESC;
    `;
    const res = await pool.query(query, params);
    const totalGlobal = res.rows.reduce((acc, r) => acc + Number(r.total_incidencias), 0);

    return res.rows.map((r) => ({
      ...r,
      total_incidencias: Number(r.total_incidencias),
      porcentaje: totalGlobal > 0 ? Number(((Number(r.total_incidencias) / totalGlobal) * 100).toFixed(2)) : 0,
    }));
  }

  // RF-24: Cajas preparadas (abiertas), pendientes de embarcar (cerradas sin embarque) y embarcadas por cliente
  async getCajasPorCliente() {
    const query = `
      SELECT cli.id as id_cliente,
             cli.nombre_cliente,
             COUNT(c.id) FILTER (WHERE c.estado = 'Abierta') as cajas_en_preparacion,
             COUNT(c.id) FILTER (WHERE c.estado = 'Cerrada' AND ec.id IS NULL) as cajas_pendientes_embarque,
             COUNT(c.id) FILTER (WHERE c.estado = 'Cerrada' AND ec.id IS NOT NULL AND emb.estado = 'Despachado') as cajas_embarcadas,
             COUNT(c.id) as total_cajas
      FROM clientes cli
      LEFT JOIN cajas c ON cli.id = c.id_cliente
      LEFT JOIN embarque_caja ec ON c.id = ec.id_caja AND ec.fecha_retiro IS NULL
      LEFT JOIN embarque emb ON ec.id_embarque = emb.id
      GROUP BY cli.id, cli.nombre_cliente
      ORDER BY cli.id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }
}

