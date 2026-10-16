import { UnidadesRepository } from '../repositories/unidades.repository.js';
import { EstadosCalidadEnum } from '../types/index.js';

export class UnidadesService {
  constructor(private repo = new UnidadesRepository()) {}

  async registrarEnsamble(data: {
    numero_serie: string;
    id_orden?: number;
    id_linea?: number;
    id_turno?: number;
  }) {
    const serialLimpio = data.numero_serie.trim().toUpperCase();

    // Regla de Calidad 1: Validar formato mínimo de serie
    if (!serialLimpio || serialLimpio.length < 3) {
      throw new Error('El número de serie es inválido o demasiado corto.');
    }

    // Regla de Calidad 2: Trazabilidad única (No duplicar número de serie)
    const existente = await this.repo.findByNumeroSerie(serialLimpio);
    if (existente) {
      const err = new Error(`La unidad con serie ${serialLimpio} ya fue registrada previamente en el sistema.`);
      (err as any).statusCode = 409;
      throw err;
    }

    const nueva = await this.repo.insertUnidad({
      id_orden: data.id_orden || 1,
      id_linea: data.id_linea || 1,
      id_turno: data.id_turno || 1,
      numero_serie: serialLimpio,
      id_estado_calidad: null, // null = Pendiente de inspección en calidad
    });

    return nueva;
  }

  async dictaminarCalidad(payload: {
    numero_serie: string;
    id_estado_calidad: number;
    id_usuario: number;
    pruebas: {
      valida_encendido: boolean;
      valida_audio: boolean;
      valida_carga: boolean;
      valida_bluetooth: boolean;
    };
    motivo: string;
  }) {
    const serialLimpio = payload.numero_serie.trim().toUpperCase();
    const unidad = await this.repo.findByNumeroSerie(serialLimpio);

    if (!unidad) {
      const err = new Error(`No se encontró ninguna unidad con el número de serie ${serialLimpio}.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Regla de Calidad 3: Coherencia de pruebas funcionales
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

    const estadoMap: Record<number, string> = {
      0: 'Pendiente',
      [EstadosCalidadEnum.APROBADA]: 'Aprobada',
      [EstadosCalidadEnum.EN_RETRABAJO]: 'En retrabajo',
      [EstadosCalidadEnum.EN_RETENCION]: 'En retención',
      [EstadosCalidadEnum.SCRAP]: 'Scrap',
    };

    const estadoAnterior = (unidad.id_estado_calidad !== null ? estadoMap[unidad.id_estado_calidad] : null) || 'Pendiente';
    const estadoNuevo = estadoMap[payload.id_estado_calidad] || 'Desconocido';

    // 1. Guardar resultado de prueba funcional
    await this.repo.insertPruebaFuncional({
      id_orden: unidad.id_orden,
      id_linea: unidad.id_linea,
      id_usuario: payload.id_usuario,
      id_turno: unidad.id_turno,
      numero_serie: serialLimpio,
      valida_encendido: payload.pruebas.valida_encendido,
      valida_audio: payload.pruebas.valida_audio,
      valida_carga: payload.pruebas.valida_carga,
      valida_bluetooth: payload.pruebas.valida_bluetooth,
      estado_prueba: todasLasPruebasPasaron ? 'Pasa' : 'Falla',
    });

    // 2. Actualizar estado de la unidad
    await this.repo.updateEstadoCalidad(unidad.id, payload.id_estado_calidad);

    // 3. Registrar auditoría e historial de calidad
    await this.repo.insertHistorial({
      id_unidad: unidad.id,
      id_usuario: payload.id_usuario,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      motivo: payload.motivo || 'Evaluación en banco de calidad',
    });

    return {
      ok: true,
      numero_serie: serialLimpio,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
    };
  }

  async getRecientes(limit = 10) {
    return this.repo.getRecientes(limit);
  }

  async getHistorial(limit = 10) {
    return this.repo.getHistorial(limit);
  }
}
