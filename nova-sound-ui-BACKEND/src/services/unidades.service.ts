import { UnidadesRepository } from '../repositories/unidades.repository.js';
import { EstadosCalidadEnum } from '../types/index.js';

export class UnidadesService {
  constructor(private repo = new UnidadesRepository()) {}

  // F-05 / F-06 / RN-13 / BD-09: Dictamen de Inspección de Calidad
  async dictaminarCalidad(payload: {
    numero_serie: string;
    id_estado_calidad: number;
    id_usuario: number;
    id_defectos?: number[];
    comentarios?: string;
    pruebas?: {
      valida_encendido: boolean;
      valida_audio: boolean;
      valida_carga: boolean;
      valida_bluetooth: boolean;
    };
    motivo?: string;
  }) {
    const serialLimpio = payload.numero_serie.trim().toUpperCase();
    const unidad = await this.repo.findByNumeroSerie(serialLimpio);

    if (!unidad) {
      const err = new Error(`No se encontró ninguna unidad con el número de serie ${serialLimpio}.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Si vienen pruebas opcionales en el payload, verificar consistencia
    if (payload.pruebas) {
      const todasLasPruebasPasaron =
        payload.pruebas.valida_encendido &&
        payload.pruebas.valida_audio &&
        payload.pruebas.valida_carga &&
        payload.pruebas.valida_bluetooth;

      if (payload.id_estado_calidad === EstadosCalidadEnum.APROBADA && !todasLasPruebasPasaron) {
        const err = new Error('Violación de calidad: No se puede aprobar una unidad con pruebas funcionales reprobadas.');
        (err as any).statusCode = 400;
        throw err;
      }
    }

    const estadoMap: Record<number, string> = {
      0: 'Pendiente',
      [EstadosCalidadEnum.APROBADA]: 'Aprobada',
      [EstadosCalidadEnum.EN_RETRABAJO]: 'En retrabajo',
      [EstadosCalidadEnum.EN_RETENCION]: 'En retención',
      [EstadosCalidadEnum.SCRAP]: 'Scrap',
    };

    const estadoAnterior = (unidad.id_estado_calidad !== null ? estadoMap[unidad.id_estado_calidad] : null) || 'Pendiente';
    const estadoNuevo = estadoMap[payload.id_estado_calidad] || 'Desconocido';

    // 1. Guardar resultado de inspección formal en inspecciones_calidad (BD-09)
    const idInspeccion = await this.repo.insertInspeccion({
      id_unidad: unidad.id,
      id_inspector: payload.id_usuario,
      id_estado_resultado: payload.id_estado_calidad,
      comentarios: payload.comentarios || payload.motivo || 'Dictamen de calidad',
    });

    // 2. Asociar defectos del catálogo si se reportaron
    if (payload.id_defectos && payload.id_defectos.length > 0) {
      for (const idDefecto of payload.id_defectos) {
        await this.repo.insertDefectoInspeccion(idInspeccion, idDefecto);
      }
    }

    // 3. Actualizar estado de la unidad
    await this.repo.updateEstadoCalidad(unidad.id, payload.id_estado_calidad);

    // 4. Registrar auditoría e historial de calidad (RN-12 / BD-15)
    await this.repo.insertHistorial({
      id_unidad: unidad.id,
      id_usuario: payload.id_usuario,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      motivo: payload.motivo || payload.comentarios || 'Inspección en estación de calidad',
    });

    return {
      ok: true,
      numero_serie: serialLimpio,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
    };
  }

  // RF-25 / P-42: Consulta de Trazabilidad 360° por Número de Serie
  async getTrazabilidad(numeroSerie: string) {
    if (!numeroSerie || numeroSerie.trim().length < 3) {
      const err = new Error('El número de serie ingresado no es válido.');
      (err as any).statusCode = 400;
      throw err;
    }

    const trazabilidad = await this.repo.getTrazabilidadCompleta(numeroSerie);
    if (!trazabilidad) {
      const err = new Error(`No se encontró registro para la unidad con número de serie "${numeroSerie.trim().toUpperCase()}".`);
      (err as any).statusCode = 404;
      throw err;
    }

    return trazabilidad;
  }

  async getRecientes(limit = 10) {
    return this.repo.getRecientes(limit);
  }

  async getHistorial(limit = 10) {
    return this.repo.getHistorial(limit);
  }
}
