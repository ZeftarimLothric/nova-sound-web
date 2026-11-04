import { CajasRepository } from '../repositories/cajas.repository.js';
import { UnidadesRepository } from '../repositories/unidades.repository.js';

export class CajasService {
  constructor(
    private repo = new CajasRepository(),
    private unidadesRepo = new UnidadesRepository()
  ) {}

  async getAll() {
    return this.repo.getAll();
  }

  async getById(id: number) {
    const caja = await this.repo.getById(id);
    if (!caja) {
      const err = new Error(`La caja con ID ${id} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }
    const contenido = await this.repo.getDetalleContenido(id);
    const historial = await this.repo.getHistorialMovimientos(id);
    return { ...caja, contenido, historial };
  }

  async create(data: {
    codigo_caja?: string;
    id_cliente: number;
    id_modelo: number;
    id_color?: number | null;
    id_usuario_creador: number;
  }) {
    return this.repo.create(data);
  }

  // RN-01, RN-05, RN-06, RN-07: Validación estricta para empacar
  // Previene el Incidente B (Caja con modelos o colores mezclados)
  async empacarUnidadPorSerie(data: {
    id_caja: number;
    numero_serie: string;
    id_usuario: number;
  }) {
    const caja = await this.repo.getById(data.id_caja);
    if (!caja) {
      const err = new Error(`La caja con ID ${data.id_caja} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Validar estado de la caja
    if (caja.estado !== 'Abierta') {
      const err = new Error(`Violación de Empaque (RN-09): La caja ${caja.codigo_caja} está CERRADA. Se requiere reapertura autorizada.`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Validar capacidad máxima (RN-07)
    const piezasActuales = Number(caja.piezas_actuales || 0);
    const capacidadMax = Number(caja.capacidad_maxima || 6);
    if (piezasActuales >= capacidadMax) {
      const err = new Error(`Violación de Capacidad (RN-07): La caja ${caja.codigo_caja} ya está llena (${piezasActuales}/${capacidadMax} piezas).`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Buscar unidad por serie
    const serialLimpio = data.numero_serie.trim().toUpperCase();
    const unidad = await this.unidadesRepo.findByNumeroSerie(serialLimpio);
    if (!unidad) {
      const err = new Error(`No se encontró ninguna unidad con el número de serie ${serialLimpio}.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Validar que la unidad no esté ya empacada
    if (unidad.id_caja) {
      const err = new Error(`La unidad ${serialLimpio} ya está empacada en la caja ID ${unidad.id_caja}.`);
      (err as any).statusCode = 400;
      throw err;
    }

    // RN-01 / RN-02 / F-07: Validar estrictamente que haya pasado por inspección de Calidad y esté liberada ('Aprobada')
    if (unidad.id_estado_calidad === null || !unidad.permite_empaque) {
      const err = new Error(
        `Violación de Calidad (RN-01): La unidad ${serialLimpio} no está liberada por Calidad para empaque (Estado: "${unidad.nombre_estado || 'Pendiente de Calidad'}").`
      );
      (err as any).statusCode = 400;
      throw err;
    }

    // RN-05: Validar que el modelo coincida
    if (caja.nombre_modelo && unidad.modelo && caja.nombre_modelo !== unidad.modelo) {
      const err = new Error(`Violación de Empaque (RN-05): Incompatibilidad de modelo. La caja es para "${caja.nombre_modelo}" y la unidad es "${unidad.modelo}".`);
      (err as any).statusCode = 400;
      throw err;
    }

    // RN-06: Validar política de mezcla de color del cliente
    if (!caja.permite_mezcla_colores) {
      if (caja.nombre_color && unidad.color && caja.nombre_color !== unidad.color) {
        const err = new Error(`Violación de Cliente (RN-06): El cliente no permite mezcla de colores. La caja es de color "${caja.nombre_color}" y la unidad es "${unidad.color}".`);
        (err as any).statusCode = 400;
        throw err;
      }
    }

    const detalle = await this.repo.empacarUnidad(caja.id, unidad.id, data.id_usuario);
    return {
      ok: true,
      mensaje: `Unidad ${serialLimpio} empacada con éxito en la caja ${caja.codigo_caja} (${piezasActuales + 1}/${capacidadMax}).`,
      data: detalle,
    };
  }

  async cerrar(id: number, idUsuarioCierra: number) {
    const caja = await this.repo.getById(id);
    if (!caja) {
      const err = new Error(`La caja con ID ${id} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (caja.estado === 'Cerrada') {
      const err = new Error(`La caja ${caja.codigo_caja} ya se encuentra cerrada.`);
      (err as any).statusCode = 400;
      throw err;
    }

    return this.repo.cerrar(id, idUsuarioCierra);
  }

  async reabrir(id: number, idUsuarioAutoriza: number, motivo: string) {
    if (!motivo || motivo.trim().length < 5) {
      const err = new Error('Se requiere especificar un motivo formal para la reapertura de la caja.');
      (err as any).statusCode = 400;
      throw err;
    }
    return this.repo.reabrir(id, idUsuarioAutoriza, motivo);
  }

  async retirarUnidad(idCaja: number, idUnidad: number, idUsuario: number, motivo: string) {
    if (!motivo || motivo.trim().length < 5) {
      const err = new Error('Se requiere especificar un motivo formal para retirar una unidad de la caja.');
      (err as any).statusCode = 400;
      throw err;
    }
    return this.repo.retirarUnidad(idCaja, idUnidad, idUsuario, motivo);
  }
}

