import { pool } from '../config/db.js';
import type { Unidad } from '../types/index.js';

export class UnidadesRepository {
  async findByNumeroSerie(numeroSerie: string): Promise<Unidad | null> {
    const query = `
      SELECT u.*, 
             COALESCE(ec.nombre_estado, 'Pendiente de Calidad') as nombre_estado, 
             COALESCE(ec.permite_empaque, FALSE) as permite_empaque,
             m.nombre_modelo as modelo,
             col.nombre_color as color,
             o.folio as folio_orden
      FROM unidades u
      LEFT JOIN catalogo_estados_calidad ec ON u.id_estado_calidad = ec.id
      LEFT JOIN ordenes o ON u.id_orden = o.id
      LEFT JOIN modelos m ON o.id_modelo = m.id
      LEFT JOIN colores col ON o.id_color = col.id
      WHERE UPPER(u.numero_serie) = UPPER($1);
    `;
    const res = await pool.query(query, [numeroSerie]);
    return res.rows[0] || null;
  }

  async updateEstadoCalidad(idUnidad: number, idEstadoCalidad: number): Promise<void> {
    await pool.query('UPDATE unidades SET id_estado_calidad = $1 WHERE id = $2', [idEstadoCalidad, idUnidad]);
  }

  async insertInspeccion(data: {
    id_unidad: number;
    id_inspector: number;
    id_estado_resultado: number;
    comentarios?: string;
  }): Promise<number> {
    const query = `
      INSERT INTO inspecciones_calidad (id_unidad, id_inspector, id_estado_resultado, comentarios)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const res = await pool.query(query, [
      data.id_unidad,
      data.id_inspector,
      data.id_estado_resultado,
      data.comentarios || 'Inspección de calidad formal',
    ]);
    return res.rows[0].id;
  }

  async insertDefectoInspeccion(idInspeccion: number, idDefecto: number): Promise<void> {
    await pool.query(
      'INSERT INTO detalle_defectos_unidad (id_inspeccion, id_defecto) VALUES ($1, $2)',
      [idInspeccion, idDefecto]
    );
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

    // BD-15 / RN-12: Registrar en la bitácora unificada de auditoría
    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.id_usuario,
        'Calidad',
        `Dictamen de calidad: ${data.estado_anterior} -> ${data.estado_nuevo}`,
        'unidades',
        data.id_unidad,
        data.estado_anterior,
        data.estado_nuevo,
        data.motivo,
      ]
    );
  }

  // RF-25 / P-42: Trazabilidad 360° por Número de Serie
  async getTrazabilidadCompleta(numeroSerie: string) {
    const serialUpper = numeroSerie.trim().toUpperCase();

    // 1. Datos generales de la unidad
    const unidadQuery = `
      SELECT u.id, u.id_prueba, u.numero_serie, u.fecha_creacion,
             o.folio as folio_orden, o.cantidad as orden_cantidad,
             m.nombre_modelo, col.nombre_color,
             c.nombre_cliente,
             l.nombre_linea, t.nombre_turno,
             COALESCE(ec.nombre_estado, 'Pendiente de Calidad') as estado_calidad_actual,
             COALESCE(ec.permite_empaque, FALSE) as permite_empaque
      FROM unidades u
      JOIN ordenes o ON u.id_orden = o.id
      JOIN modelos m ON o.id_modelo = m.id
      JOIN colores col ON o.id_color = col.id
      JOIN clientes c ON o.id_cliente = c.id
      JOIN lineas l ON u.id_linea = l.id
      JOIN turnos t ON u.id_turno = t.id
      LEFT JOIN catalogo_estados_calidad ec ON u.id_estado_calidad = ec.id
      WHERE UPPER(u.numero_serie) = $1;
    `;
    const resUnidad = await pool.query(unidadQuery, [serialUpper]);
    if (resUnidad.rows.length === 0) return null;

    const infoUnidad = resUnidad.rows[0];

    // 2. Datos de la prueba funcional aprobada ligada por id_prueba (BD-03 / BD-08)
    const pruebaQuery = `
      SELECT pf.*, u.nombre_completo as nombre_operador_prueba
      FROM prueba_funcional pf
      JOIN usuarios u ON pf.id_usuario = u.id
      WHERE pf.id = $1;
    `;
    const resPrueba = await pool.query(pruebaQuery, [infoUnidad.id_prueba]);

    // 3. Historial de inspecciones de calidad y defectos
    const calidadQuery = `
      SELECT ic.id, ic.fecha_inspeccion, ic.comentarios,
             u.nombre_completo as inspector,
             ec.nombre_estado as resultado_disposicion,
             ARRAY_AGG(cd.descripcion) FILTER (WHERE cd.descripcion IS NOT NULL) as defectos
      FROM inspecciones_calidad ic
      JOIN usuarios u ON ic.id_inspector = u.id
      JOIN catalogo_estados_calidad ec ON ic.id_estado_resultado = ec.id
      LEFT JOIN detalle_defectos_unidad ddu ON ic.id = ddu.id_inspeccion
      LEFT JOIN catalogo_defectos cd ON ddu.id_defecto = cd.id
      WHERE ic.id_unidad = $1
      GROUP BY ic.id, ic.fecha_inspeccion, ic.comentarios, u.nombre_completo, ec.nombre_estado
      ORDER BY ic.id DESC;
    `;
    const resCalidad = await pool.query(calidadQuery, [infoUnidad.id]);

    // 4. Datos de empaque y caja
    const empaqueQuery = `
      SELECT dc.fecha_asignacion as fecha_empaque, dc.activo,
             c.codigo_caja, c.estado as estado_caja,
             u_asigna.nombre_completo as empacador,
             u_cierra.nombre_completo as quien_cerro_caja,
             dc.fecha_retiro, dc.motivo_retiro,
             u_retira.nombre_completo as quien_retiro
      FROM detalle_caja dc
      JOIN cajas c ON dc.id_caja = c.id
      JOIN usuarios u_asigna ON dc.id_usuario_asigna = u_asigna.id
      LEFT JOIN usuarios u_cierra ON c.id_usuario_cierra = u_cierra.id
      LEFT JOIN usuarios u_retira ON dc.id_usuario_retira = u_retira.id
      WHERE dc.id_unidad = $1
      ORDER BY dc.id DESC;
    `;
    const resEmpaque = await pool.query(empaqueQuery, [infoUnidad.id]);

    // 5. Datos de embarque
    const embarqueQuery = `
      SELECT e.referencia_embarque, e.fecha_programada, e.fecha_salida, e.estado as estado_embarque,
             t.nombre as transportista,
             u_creo.nombre_completo as creo_embarque,
             u_conf.nombre_completo as confirmo_embarque
      FROM detalle_caja dc
      JOIN embarque_caja ec ON dc.id_caja = ec.id_caja AND ec.fecha_retiro IS NULL
      JOIN embarque e ON ec.id_embarque = e.id
      JOIN transportista t ON e.id_transportista = t.id
      JOIN usuarios u_creo ON e.id_usuario_creo = u_creo.id
      LEFT JOIN usuarios u_conf ON e.id_usuario_confirmo = u_conf.id
      WHERE dc.id_unidad = $1 AND dc.activo = TRUE
      LIMIT 1;
    `;
    const resEmbarque = await pool.query(embarqueQuery, [infoUnidad.id]);

    return {
      unidad: infoUnidad,
      prueba_funcional: resPrueba.rows[0] || null,
      inspecciones_calidad: resCalidad.rows,
      empaque: resEmpaque.rows,
      embarque: resEmbarque.rows[0] || null,
    };
  }

  async getRecientes(limit = 10): Promise<any[]> {
    const query = `
      SELECT u.*, 
             ec.nombre_estado,
             COALESCE(m.nombre_modelo, 'NS-PRO') as modelo,
             COALESCE(col.nombre_color, 'Negro') as color,
             o.folio as folio_orden
      FROM unidades u
      LEFT JOIN catalogo_estados_calidad ec ON u.id_estado_calidad = ec.id
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
