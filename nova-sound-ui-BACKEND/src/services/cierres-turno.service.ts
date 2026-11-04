import { CierresTurnoRepository } from '../repositories/cierres-turno.repository.js';
import { pool } from '../config/db.js';
import { RolesEnum } from '../types/index.js';

export class CierresTurnoService {
  constructor(private repo = new CierresTurnoRepository(), private dbPool: any = pool) {}

  // INC-A / INC-D / RF-07 / RF-33: Cálculo de métricas por turno, línea y orden (opcional)
  async calcularMetricas(fecha: string, idTurno: number, idLinea: number, idOrden?: number) {
    if (idOrden !== undefined) {
      return this.repo.getMetricasBalance(fecha, idTurno, idLinea, idOrden);
    }
    return this.repo.getMetricasBalance(fecha, idTurno, idLinea);
  }

  async consolidarCierre(data: {
    fecha: string;
    id_turno: number;
    id_linea: number;
    id_lider: number;
    observaciones?: string;
  }) {
    // RN-11: Verificar que un Operador (id_rol = 1) no pueda generar ni modificar un cierre de turno
    try {
      const userRes = await this.dbPool.query('SELECT id_rol, nombre_completo FROM usuarios WHERE id = $1', [data.id_lider]);
      if (userRes.rows.length > 0 && Number(userRes.rows[0].id_rol) === RolesEnum.OPERADOR) {
        const err = new Error('Violación de Gobernanza (RN-11): Un Operador no puede generar ni modificar cierres de turno.');
        (err as any).statusCode = 403;
        throw err;
      }
    } catch (e: any) {
      if (e.statusCode === 403) throw e;
    }

    // 1. Calcular métricas reales de balance de masa
    const metricas = await this.repo.getMetricasBalance(data.fecha, data.id_turno, data.id_linea);

    // 2. Crear el cierre formal
    const cierre = await this.repo.create({
      fecha: data.fecha,
      id_turno: data.id_turno,
      id_linea: data.id_linea,
      id_lider: data.id_lider,
      metricas,
      observaciones: data.observaciones,
    });

    // 3. Registrar en bitácora unificada (RN-12 / BD-15)
    await this.dbPool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.id_lider,
        'Turnos',
        'Cierre formal de turno consolidado',
        'cierres_turno',
        cierre.id,
        JSON.stringify(metricas),
        data.observaciones || 'Consolidación de fin de turno',
      ]
    );

    return {
      ok: true,
      mensaje: `Cierre de turno ${cierre.folio_cierre} registrado formalmente.`,
      cierre,
    };
  }

  // RF-08 / RN-11 / RN-12: Aplicar corrección a un cierre de turno con autorización aprobada de Subgerente/Gerente
  async corregirCierreConAutorizacion(
    idCierre: number,
    data: {
      id_autorizacion: number;
      id_usuario: number;
      observaciones?: string;
    }
  ) {
    const cierreActual = await this.repo.getById(idCierre);
    if (!cierreActual) {
      const err = new Error(`El cierre de turno con ID ${idCierre} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const solRes = await this.dbPool.query(
      `SELECT * FROM solicitudes_autorizacion WHERE id = $1 AND tipo = 'CORRECCION_CIERRE_TURNO' AND id_referencia = $2;`,
      [data.id_autorizacion, idCierre]
    );
    const solicitud = solRes.rows[0];
    if (!solicitud || solicitud.estado !== 'APROBADA') {
      const err = new Error(
        'Violación de Gobernanza (RN-11 / RF-08): No se puede modificar un cierre de turno sin una solicitud de autorización APROBADA por Subgerente o Gerente de Producción.'
      );
      (err as any).statusCode = 403;
      throw err;
    }

    const fechaStr =
      typeof cierreActual.fecha === 'string'
        ? cierreActual.fecha.split('T')[0]
        : new Date(cierreActual.fecha).toISOString().split('T')[0];

    const nuevasMetricas = await this.repo.getMetricasBalance(
      fechaStr,
      cierreActual.id_turno,
      cierreActual.id_linea
    );

    const actualizado = await this.repo.actualizarConMetricas(
      idCierre,
      nuevasMetricas,
      'Corregido',
      data.observaciones || `Corregido bajo autorización ${solicitud.folio_solicitud}`
    );

    await this.dbPool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_anterior, valor_nuevo, motivo, id_autorizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.id_usuario,
        'Turnos',
        `Corrección autorizada de cierre ${cierreActual.folio_cierre}`,
        'cierres_turno',
        idCierre,
        JSON.stringify({
          piezas_ensambladas: cierreActual.piezas_ensambladas,
          piezas_probadas: cierreActual.piezas_probadas,
          piezas_liberadas: cierreActual.piezas_liberadas,
          piezas_empacadas: cierreActual.piezas_empacadas,
          piezas_embarcadas: cierreActual.piezas_embarcadas,
          piezas_scrap: cierreActual.piezas_scrap,
          diferencia_balance: cierreActual.diferencia_balance,
          estado: cierreActual.estado,
        }),
        JSON.stringify(nuevasMetricas),
        data.observaciones || solicitud.motivo,
        solicitud.id,
      ]
    );

    return {
      ok: true,
      mensaje: `Cierre de turno ${cierreActual.folio_cierre} recalculado y actualizado con estado Corregido.`,
      cierre: actualizado,
    };
  }

  // RF-29 / INC-D: Exportar cierre(s) de turno en formato CSV compatible con Excel
  async exportarCsv(idCierre?: number): Promise<{ filename: string; csv: string }> {
    const cierres = idCierre
      ? [await this.repo.getById(idCierre)].filter(Boolean) as any[]
      : await this.repo.getAll(100);

    if (idCierre && cierres.length === 0) {
      const err = new Error(`El cierre de turno con ID ${idCierre} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const headers = [
      'Folio Cierre',
      'Fecha',
      'Linea',
      'Turno',
      'Lider de Linea',
      'Piezas Ensambladas',
      'Piezas Probadas',
      'Piezas Liberadas (Calidad)',
      'Piezas Empacadas',
      'Piezas Embarcadas',
      'Piezas Scrap',
      'Diferencia Balance',
      'Estado',
      'Fecha Hora Cierre',
      'Observaciones',
    ];

    const rows = cierres.map((c) => {
      const fechaStr =
        typeof c.fecha === 'string' ? c.fecha.split('T')[0] : new Date(c.fecha).toISOString().split('T')[0];
      return [
        c.folio_cierre,
        fechaStr,
        c.nombre_linea || `L${c.id_linea}`,
        c.nombre_turno || `T${c.id_turno}`,
        `"${String(c.nombre_lider || c.id_lider).replace(/"/g, '""')}"`,
        c.piezas_ensambladas,
        c.piezas_probadas,
        c.piezas_liberadas,
        c.piezas_empacadas,
        c.piezas_embarcadas,
        c.piezas_scrap,
        c.diferencia_balance,
        c.estado,
        c.fecha_hora_cierre ? new Date(c.fecha_hora_cierre).toISOString() : '',
        `"${String(c.observaciones || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const filename = idCierre && cierres[0] ? `cierre_${cierres[0].folio_cierre}.csv` : 'cierres_turno_nova_sound.csv';
    return { filename, csv: csvContent };
  }

  async getAll(limit = 20) {
    return this.repo.getAll(limit);
  }
}
