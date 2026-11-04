import { pool } from '../config/db.js';
import type { CierreTurno } from '../types/index.js';

export class CierresTurnoRepository {
  // RF-33 / INC-A: Conteo por las 5 etapas por turno y orden: ensambladas, probadas, liberadas, empacadas, embarcadas
  async getMetricasBalance(fecha: string, idTurno: number, idLinea: number, idOrden?: number) {
    const ordenFilterEns = idOrden ? ' AND id_orden = $4' : '';
    const ordenFilterPf = idOrden ? ' AND id_orden = $4' : '';
    const ordenFilterUni = idOrden ? ' AND id_orden = $4' : '';
    const ordenFilterEmb = idOrden ? ' AND u.id_orden = $4' : '';
    const baseParams = idOrden ? [fecha, idTurno, idLinea, idOrden] : [fecha, idTurno, idLinea];

    // 1. Total ensambladas (BD-10: fecha_produccion)
    const resEns = await pool.query(
      `SELECT COALESCE(SUM(cantidad), 0) as total FROM ensamble WHERE fecha_produccion = $1 AND id_turno = $2 AND id_linea = $3${ordenFilterEns};`,
      baseParams
    );
    const piezasEnsambladas = Number(resEns.rows[0]?.total || 0);

    // 2. Total probadas
    const resProb = await pool.query(
      `SELECT COUNT(*) as total FROM prueba_funcional WHERE DATE(fecha_hora) = $1 AND id_turno = $2 AND id_linea = $3${ordenFilterPf};`,
      baseParams
    );
    const piezasProbadas = Number(resProb.rows[0]?.total || 0);

    // 3. Total liberadas (Aprobadas en Calidad: id_estado_calidad = 1)
    const resLib = await pool.query(
      `SELECT COUNT(*) as total FROM unidades WHERE DATE(fecha_creacion) = $1 AND id_turno = $2 AND id_linea = $3 AND id_estado_calidad = 1${ordenFilterUni};`,
      baseParams
    );
    const piezasLiberadas = Number(resLib.rows[0]?.total || 0);

    // 4. Total empacadas
    const resEmp = await pool.query(
      `SELECT COUNT(*) as total FROM unidades WHERE DATE(fecha_creacion) = $1 AND id_turno = $2 AND id_linea = $3 AND id_caja IS NOT NULL${ordenFilterUni};`,
      baseParams
    );
    const piezasEmpacadas = Number(resEmp.rows[0]?.total || 0);

    // 5. Total embarcadas (RF-33 / INC-A: unidades dentro de cajas de embarques despachados)
    const resEmb = await pool.query(
      `SELECT COUNT(DISTINCT u.id) as total
       FROM unidades u
       JOIN detalle_caja dc ON u.id = dc.id_unidad AND dc.activo = TRUE
       JOIN embarque_caja ec ON dc.id_caja = ec.id_caja AND ec.fecha_retiro IS NULL
       JOIN embarque emb ON ec.id_embarque = emb.id
       WHERE DATE(u.fecha_creacion) = $1
         AND u.id_turno = $2
         AND u.id_linea = $3
         AND emb.estado = 'Despachado'${ordenFilterEmb};`,
      baseParams
    );
    const piezasEmbarcadas = Number(resEmb.rows[0]?.total || 0);

    // 6. Total scrap
    const resScrap = await pool.query(
      `SELECT COUNT(*) as total FROM unidades WHERE DATE(fecha_creacion) = $1 AND id_turno = $2 AND id_linea = $3 AND id_estado_calidad = 4${ordenFilterUni};`,
      baseParams
    );
    const piezasScrap = Number(resScrap.rows[0]?.total || 0);

    // 7. RF-33: Desglose de las 5 etapas por cada orden activa en el turno/línea
    const resPorOrden = await pool.query(
      `SELECT o.id as id_orden,
              o.folio as folio_orden,
              m.nombre_modelo,
              col.nombre_color,
              COALESCE((SELECT SUM(e.cantidad) FROM ensamble e WHERE e.id_orden = o.id AND e.fecha_produccion = $1 AND e.id_turno = $2 AND e.id_linea = $3), 0) as piezas_ensambladas,
              (SELECT COUNT(*) FROM prueba_funcional pf WHERE pf.id_orden = o.id AND DATE(pf.fecha_hora) = $1 AND pf.id_turno = $2 AND pf.id_linea = $3) as piezas_probadas,
              (SELECT COUNT(*) FROM unidades u WHERE u.id_orden = o.id AND DATE(u.fecha_creacion) = $1 AND u.id_turno = $2 AND u.id_linea = $3 AND u.id_estado_calidad = 1) as piezas_liberadas,
              (SELECT COUNT(*) FROM unidades u WHERE u.id_orden = o.id AND DATE(u.fecha_creacion) = $1 AND u.id_turno = $2 AND u.id_linea = $3 AND u.id_caja IS NOT NULL) as piezas_empacadas,
              (SELECT COUNT(DISTINCT u.id) FROM unidades u JOIN detalle_caja dc ON u.id = dc.id_unidad AND dc.activo = TRUE JOIN embarque_caja ec ON dc.id_caja = ec.id_caja AND ec.fecha_retiro IS NULL JOIN embarque emb ON ec.id_embarque = emb.id WHERE u.id_orden = o.id AND DATE(u.fecha_creacion) = $1 AND u.id_turno = $2 AND u.id_linea = $3 AND emb.estado = 'Despachado') as piezas_embarcadas,
              (SELECT COUNT(*) FROM unidades u WHERE u.id_orden = o.id AND DATE(u.fecha_creacion) = $1 AND u.id_turno = $2 AND u.id_linea = $3 AND u.id_estado_calidad = 4) as piezas_scrap
       FROM ordenes o
       JOIN modelos m ON o.id_modelo = m.id
       JOIN colores col ON o.id_color = col.id
       WHERE o.id_linea_asignada = $3
       ORDER BY o.id ASC;`,
      [fecha, idTurno, idLinea]
    );

    // INC-A: Balance de masa y diferencias entre cada etapa
    const diferenciaBalance = piezasEnsambladas - (piezasLiberadas + piezasScrap);

    return {
      piezas_ensambladas: piezasEnsambladas,
      piezas_probadas: piezasProbadas,
      piezas_liberadas: piezasLiberadas,
      piezas_empacadas: piezasEmpacadas,
      piezas_embarcadas: piezasEmbarcadas,
      piezas_scrap: piezasScrap,
      diferencia_balance: diferenciaBalance,
      diferencias_entre_etapas: {
        ensamble_a_prueba: piezasEnsambladas - piezasProbadas,
        prueba_a_liberadas: piezasProbadas - piezasLiberadas,
        liberadas_a_empaque: piezasLiberadas - piezasEmpacadas,
        empaque_a_embarque: piezasEmpacadas - piezasEmbarcadas,
      },
      desglose_por_orden: resPorOrden.rows.map((r: any) => ({
        id_orden: Number(r.id_orden),
        folio_orden: r.folio_orden,
        nombre_modelo: r.nombre_modelo,
        nombre_color: r.nombre_color,
        piezas_ensambladas: Number(r.piezas_ensambladas || 0),
        piezas_probadas: Number(r.piezas_probadas || 0),
        piezas_liberadas: Number(r.piezas_liberadas || 0),
        piezas_empacadas: Number(r.piezas_empacadas || 0),
        piezas_embarcadas: Number(r.piezas_embarcadas || 0),
        piezas_scrap: Number(r.piezas_scrap || 0),
      })),
    };
  }

  async generarFolioCierre(): Promise<string> {
    const query = `SELECT id FROM cierres_turno ORDER BY id DESC LIMIT 1;`;
    const res = await pool.query(query);
    const nextId = res.rows.length > 0 ? Number(res.rows[0].id) + 1 : 1;
    return `CRTE-${String(nextId).padStart(5, '0')}`;
  }

  async create(data: {
    fecha: string;
    id_turno: number;
    id_linea: number;
    id_lider: number;
    metricas: {
      piezas_ensambladas: number;
      piezas_probadas: number;
      piezas_liberadas: number;
      piezas_empacadas: number;
      piezas_embarcadas: number;
      piezas_scrap: number;
      diferencia_balance: number;
    };
    observaciones?: string;
  }): Promise<CierreTurno> {
    const folio = await this.generarFolioCierre();
    const query = `
      INSERT INTO cierres_turno (
        folio_cierre, fecha, id_turno, id_linea, id_lider,
        piezas_ensambladas, piezas_probadas, piezas_liberadas, piezas_empacadas, piezas_embarcadas, piezas_scrap,
        diferencia_balance, estado, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Cerrado', $13)
      RETURNING *;
    `;
    const values = [
      folio,
      data.fecha,
      data.id_turno,
      data.id_linea,
      data.id_lider,
      data.metricas.piezas_ensambladas,
      data.metricas.piezas_probadas,
      data.metricas.piezas_liberadas,
      data.metricas.piezas_empacadas,
      data.metricas.piezas_embarcadas || 0,
      data.metricas.piezas_scrap,
      data.metricas.diferencia_balance,
      data.observaciones || 'Cierre de turno formal',
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  async getById(id: number): Promise<CierreTurno | null> {
    const query = `
      SELECT ct.*, 
             t.nombre_turno, 
             l.nombre_linea, 
             u.nombre_completo as nombre_lider
      FROM cierres_turno ct
      JOIN turnos t ON ct.id_turno = t.id
      JOIN lineas l ON ct.id_linea = l.id
      JOIN usuarios u ON ct.id_lider = u.id
      WHERE ct.id = $1;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  async updateEstado(id: number, estado: 'Abierto' | 'Cerrado' | 'En Revisión' | 'Corregido', observaciones?: string): Promise<CierreTurno | null> {
    const query = `
      UPDATE cierres_turno
      SET estado = $1,
          observaciones = COALESCE($2, observaciones)
      WHERE id = $3
      RETURNING *;
    `;
    const res = await pool.query(query, [estado, observaciones || null, id]);
    return res.rows[0] || null;
  }

  async actualizarConMetricas(
    id: number,
    metricas: {
      piezas_ensambladas: number;
      piezas_probadas: number;
      piezas_liberadas: number;
      piezas_empacadas: number;
      piezas_embarcadas: number;
      piezas_scrap: number;
      diferencia_balance: number;
    },
    estado: 'Abierto' | 'Cerrado' | 'En Revisión' | 'Corregido',
    observaciones?: string
  ): Promise<CierreTurno | null> {
    const query = `
      UPDATE cierres_turno
      SET piezas_ensambladas = $1,
          piezas_probadas = $2,
          piezas_liberadas = $3,
          piezas_empacadas = $4,
          piezas_embarcadas = $5,
          piezas_scrap = $6,
          diferencia_balance = $7,
          estado = $8,
          observaciones = COALESCE($9, observaciones)
      WHERE id = $10
      RETURNING *;
    `;
    const res = await pool.query(query, [
      metricas.piezas_ensambladas,
      metricas.piezas_probadas,
      metricas.piezas_liberadas,
      metricas.piezas_empacadas,
      metricas.piezas_embarcadas,
      metricas.piezas_scrap,
      metricas.diferencia_balance,
      estado,
      observaciones || null,
      id,
    ]);
    return res.rows[0] || null;
  }

  async getAll(limit = 20): Promise<CierreTurno[]> {
    const query = `
      SELECT ct.*, 
             t.nombre_turno, 
             l.nombre_linea, 
             u.nombre_completo as nombre_lider
      FROM cierres_turno ct
      JOIN turnos t ON ct.id_turno = t.id
      JOIN lineas l ON ct.id_linea = l.id
      JOIN usuarios u ON ct.id_lider = u.id
      ORDER BY ct.id DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }
}
