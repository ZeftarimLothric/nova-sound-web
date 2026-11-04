import { pool } from '../config/db.js';
import { PruebasRepository } from '../repositories/pruebas.repository.js';
import { OrdenesRepository } from '../repositories/ordenes.repository.js';
import { EstadosCalidadEnum } from '../types/index.js';

export class PruebasService {
  constructor(
    private repo = new PruebasRepository(),
    private ordenesRepo = new OrdenesRepository(),
    private dbPool: any = pool
  ) {}

  async evaluarPrueba(data: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    id_operador: number;
    valida_encendido: boolean;
    valida_audio: boolean;
    valida_carga: boolean;
    valida_bluetooth: boolean;
    id_defecto?: number;
    descripcion_defecto?: string;
  }) {
    const orden = await this.ordenesRepo.getById(data.id_orden);
    if (!orden) {
      const err = new Error(`La orden de trabajo con ID ${data.id_orden} no existe.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const aprobado =
      data.valida_encendido &&
      data.valida_audio &&
      data.valida_carga &&
      data.valida_bluetooth;

    // F-04 / RF-11 / BD-05: Si falla, es obligatorio registrar el defecto del catálogo en prueba_defectos
    if (!aprobado && !data.id_defecto) {
      const err = new Error('Violación de Calidad (RF-11): Cuando una prueba funcional falla, se debe especificar el defecto correspondiente del catálogo.');
      (err as any).statusCode = 400;
      throw err;
    }

    const client = await this.dbPool.connect();

    try {
      await client.query('BEGIN');

      if (aprobado) {
        // F-04 / RN-04 / BD-03 / BD-08: La serie NACE en unidades apuntando a la prueba aprobada (id_prueba UNIQUE)
        const nombreModelo = orden.nombre_modelo || 'NS-PRO';
        const numeroSerie = await this.repo.generarSiguienteNumeroSerie(nombreModelo);

        const prueba = await this.repo.registrarPrueba(client, {
          id_orden: data.id_orden,
          id_linea: data.id_linea,
          id_turno: data.id_turno,
          id_usuario: data.id_operador,
          valida_encendido: true,
          valida_audio: true,
          valida_carga: true,
          valida_bluetooth: true,
          estado_prueba: 'Aprobada',
        });

        // RN-01 / F-04 / F-05 / F-07: La unidad nace con id_estado_calidad = null (Pendiente de inspección de Calidad).
        // Solo podrá empacarse una vez que Calidad registre su dictamen como 'Aprobada' (id_estado_calidad = 1).
        const unidadCreada = await this.repo.crearUnidadDesdePrueba(client, {
          id_prueba: prueba.id,
          id_orden: data.id_orden,
          id_linea: data.id_linea,
          id_turno: data.id_turno,
          numero_serie: numeroSerie,
          id_estado_calidad: null,
        });

        await client.query('COMMIT');

        return {
          ok: true,
          aprobado: true,
          numero_serie: numeroSerie,
          mensaje: `Prueba funcional aprobada. Se emitió la serie única ${numeroSerie} (pendiente de liberación por Calidad).`,
          unidad: unidadCreada,
        };
      } else {
        // F-04 / BD-03 / BD-05: Si falla, se guarda la prueba reprobada (sin serie) y su defecto en prueba_defectos
        const prueba = await this.repo.registrarPrueba(client, {
          id_orden: data.id_orden,
          id_linea: data.id_linea,
          id_turno: data.id_turno,
          id_usuario: data.id_operador,
          valida_encendido: data.valida_encendido,
          valida_audio: data.valida_audio,
          valida_carga: data.valida_carga,
          valida_bluetooth: data.valida_bluetooth,
          estado_prueba: 'Reprobada',
        });

        if (data.id_defecto) {
          await this.repo.registrarDefectoPrueba(client, {
            id_prueba: prueba.id,
            id_defecto: data.id_defecto,
            id_usuario: data.id_operador,
            descripcion: data.descripcion_defecto,
          });
        }

        await client.query('COMMIT');

        return {
          ok: true,
          aprobado: false,
          numero_serie: null,
          mensaje: 'Prueba funcional reprobada. Falla registrada en catálogo de defectos (sin serie emitida).',
        };
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getRecientes(limit = 20) {
    return this.repo.getRecientes(limit);
  }
}
