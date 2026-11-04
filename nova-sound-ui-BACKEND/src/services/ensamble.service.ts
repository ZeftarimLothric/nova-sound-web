import { EnsambleRepository } from '../repositories/ensamble.repository.js';
import { OrdenesRepository } from '../repositories/ordenes.repository.js';
import { pool } from '../config/db.js';

export class EnsambleService {
  constructor(
    private repo = new EnsambleRepository(),
    private ordenesRepo = new OrdenesRepository()
  ) {}

  async registrarConteo(data: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    id_operador: number;
    cantidad: number;
  }) {
    if (!data.cantidad || data.cantidad <= 0) {
      const err = new Error('La cantidad de piezas ensambladas debe ser mayor a 0.');
      (err as any).statusCode = 400;
      throw err;
    }

    const orden = await this.ordenesRepo.getById(data.id_orden);
    if (!orden) {
      const err = new Error(`La orden de producción con ID ${data.id_orden} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // F-02: Validar que la orden esté asignada a la línea en la que se opera
    if (orden.id_linea_asignada && orden.id_linea_asignada !== data.id_linea) {
      const err = new Error(`Violación de línea (F-02): La orden ${orden.folio} está asignada a la Línea ${orden.id_linea_asignada}, no a la Línea ${data.id_linea}.`);
      (err as any).statusCode = 400;
      throw err;
    }

    const registro = await this.repo.registrarConteo({
      id_orden: data.id_orden,
      id_linea: data.id_linea,
      id_turno: data.id_turno,
      id_operador: data.id_operador,
      cantidad: data.cantidad,
      id_usuario_registro: data.id_operador,
    });

    // Auditoría automática en bitácora (RN-12)
    await pool.query(
      `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.id_operador,
        'Ensamble',
        'Registro de conteo de producción',
        'ensamble',
        registro.id,
        JSON.stringify({ cantidad: data.cantidad, id_orden: data.id_orden }),
        'Conteo de piezas terminadas en línea',
      ]
    );

    return {
      ok: true,
      mensaje: `Se registraron exitosamente ${data.cantidad} piezas ensambladas para la orden ${orden.folio}.`,
      data: registro,
    };
  }

  async getHistorialReciente(idLinea?: number) {
    return this.repo.getHistorialReciente(idLinea);
  }

  async registrarDefecto(data: {
    id_ensamble: number;
    id_defecto: number;
    etapa?: string;
    cantidad: number;
    motivo: string;
    id_usuario: number;
  }) {
    return this.repo.registrarDefecto({
      id_ensamble: data.id_ensamble,
      id_defecto: data.id_defecto,
      etapa: data.etapa,
      cantidad: data.cantidad || 1,
      motivo: data.motivo,
      id_usuario_registro: data.id_usuario,
    });
  }
}

