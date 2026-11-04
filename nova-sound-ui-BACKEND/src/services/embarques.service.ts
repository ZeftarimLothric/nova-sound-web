import { EmbarquesRepository } from '../repositories/embarques.repository.js';
import { CajasRepository } from '../repositories/cajas.repository.js';

export class EmbarquesService {
  constructor(
    private repo = new EmbarquesRepository(),
    private cajasRepo = new CajasRepository()
  ) {}

  async getAll() {
    return this.repo.getAll();
  }

  async create(data: {
    referencia_embarque: string;
    id_pedido?: number;
    id_cliente: number;
    id_transportista: number;
    fecha_programada: string;
    observaciones: string;
    id_usuario_creo: number;
  }) {
    return this.repo.create(data);
  }

  // F-10 / RN-10: Asignar caja validando que esté CERRADA y que pertenezca al cliente
  async asignarCaja(idEmbarque: number, idCaja: number, idUsuario: number) {
    const embarque = await this.repo.getById(idEmbarque);
    if (!embarque) {
      const err = new Error(`El embarque con ID ${idEmbarque} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const caja = await this.cajasRepo.getById(idCaja);
    if (!caja) {
      const err = new Error(`La caja con ID ${idCaja} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Regla 1: La caja debe estar cerrada
    if (caja.estado !== 'Cerrada') {
      const err = new Error(`Violación de Logística (RN-10): No se puede cargar la caja ${caja.codigo_caja} porque está ${caja.estado}. Solo se permiten cajas Cerradas.`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Regla 2: El cliente de la caja debe coincidir con el cliente del embarque
    if (caja.id_cliente !== embarque.id_cliente) {
      const err = new Error(`Violación de Logística (RN-10): La caja ${caja.codigo_caja} pertenece al cliente ID ${caja.id_cliente}, pero el embarque es para el cliente ID ${embarque.id_cliente}.`);
      (err as any).statusCode = 400;
      throw err;
    }

    return this.repo.asignarCaja(idEmbarque, idCaja, idUsuario);
  }

  // F-11 / INC-C: Revalidación obligatoria de Calidad al Confirmar Salida
  // Resuelve el Incidente C (Evita la salida de unidades retenidas o no liberadas)
  async despachar(idEmbarque: number, idUsuarioConfirmo: number) {
    const embarque = await this.repo.getById(idEmbarque);
    if (!embarque) {
      const err = new Error(`El embarque con ID ${idEmbarque} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // 1. Validar que no haya cajas abiertas asignadas
    const cajasAbiertas = await this.repo.getCajasAbiertas(idEmbarque);
    if (cajasAbiertas.length > 0) {
      const codigos = cajasAbiertas.map((c) => c.codigo_caja).join(', ');
      const err = new Error(`Bloqueo de Embarque (RN-10): No se puede despachar porque existen cajas abiertas cargadas: [${codigos}].`);
      (err as any).statusCode = 400;
      throw err;
    }

    // 2. INC-C: Revalidar el estado de calidad de CADA unidad cargada en el embarque
    const retenidas = await this.repo.getUnidadesNoLiberadas(idEmbarque);
    if (retenidas.length > 0) {
      const detalleErrores = retenidas
        .map((u) => `Serie: ${u.numero_serie} en ${u.codigo_caja} (Estado: ${u.estado_calidad})`)
        .join('; ');

      const err = new Error(
        `BLOQUEO DE EMBARQUE (Incidente C / F-11): Se detectaron ${retenidas.length} unidad(es) NO liberadas en el andén. Disposiciones no aprobadas: ${detalleErrores}.`
      );
      (err as any).statusCode = 400;
      throw err;
    }

    return this.repo.despachar(idEmbarque, idUsuarioConfirmo);
  }

  async retirarCaja(idEmbarque: number, idCaja: number, idUsuario: number, motivo: string) {
    if (!motivo || motivo.trim().length < 5) {
      const err = new Error('Se requiere un motivo válido para retirar una caja del embarque.');
      (err as any).statusCode = 400;
      throw err;
    }
    return this.repo.retirarCaja(idEmbarque, idCaja, idUsuario, motivo);
  }

  async getHistorial(idEmbarque: number) {
    return this.repo.getHistorial(idEmbarque);
  }
}

