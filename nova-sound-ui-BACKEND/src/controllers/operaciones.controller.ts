import type { Request, Response } from 'express';
import { z } from 'zod';
import { CajasService } from '../services/cajas.service.js';
import { EmbarquesService } from '../services/embarques.service.js';
import { CierresTurnoService } from '../services/cierres-turno.service.js';
import { AutorizacionesService } from '../services/autorizaciones.service.js';
import { OrdenesRepository } from '../repositories/ordenes.repository.js';
import { ReportesRepository } from '../repositories/reportes.repository.js';
import {
  ParametrosRepository,
  BitacoraRepository,
  RespaldosRepository,
} from '../repositories/administracion.repository.js';
import { extractUserIdFromRequest } from '../middlewares/auth.middleware.js';

const cajasService = new CajasService();
const embarquesService = new EmbarquesService();
const cierresService = new CierresTurnoService();
const autorizacionesService = new AutorizacionesService();
const ordenesRepo = new OrdenesRepository();
const reportesRepo = new ReportesRepository();
const paramRepo = new ParametrosRepository();
const bitacoraRepo = new BitacoraRepository();
const respaldosRepo = new RespaldosRepository();

function resolveActorId(req: Request, explicitId?: number): number {
  if (explicitId && !isNaN(Number(explicitId)) && Number(explicitId) > 0) {
    return Number(explicitId);
  }
  const extracted = extractUserIdFromRequest(req);
  if (extracted) return extracted;
  return 1;
}

// ==============================================================================
// 1. CONTROLADOR DE CAJAS Y EMPAQUE (RN-05 a RN-09, Incidente B)
// ==============================================================================
const createCajaSchema = z.object({
  id_cliente: z.number().int().positive('El ID de cliente es obligatorio'),
  id_modelo: z.number().int().positive('El ID de modelo es obligatorio'),
  id_color: z.number().int().positive().nullable().optional(),
  codigo_caja: z.string().optional(),
  id_usuario_creador: z.number().int().positive().optional(),
});

const empacarSerieSchema = z.object({
  id_caja: z.number().int().positive('El ID de caja es obligatorio'),
  numero_serie: z.string().min(3, 'El número de serie es obligatorio'),
  id_usuario: z.number().int().positive().optional(),
});

export class CajasController {
  static async getAll(_req: Request, res: Response) {
    try {
      const data = await cajasService.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await cajasService.getById(id);
      res.json(data);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = createCajaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const nueva = await cajasService.create({
        ...parsed.data,
        id_usuario_creador: resolveActorId(req, parsed.data.id_usuario_creador),
      });
      res.status(201).json({
        ok: true,
        mensaje: `Caja ${nueva.codigo_caja} abierta con éxito.`,
        data: nueva,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async empacarPorSerie(req: Request, res: Response) {
    try {
      const parsed = empacarSerieSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const resultado = await cajasService.empacarUnidadPorSerie({
        ...parsed.data,
        id_usuario: resolveActorId(req, parsed.data.id_usuario),
      });
      res.status(201).json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async cerrar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const idUsuario = resolveActorId(req, req.body?.id_usuario);
      const updated = await cajasService.cerrar(id, idUsuario);
      res.json({
        ok: true,
        mensaje: `Caja ${updated.codigo_caja} cerrada formalmente.`,
        data: updated,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async retirarUnidad(req: Request, res: Response) {
    try {
      const idCaja = Number(req.params.id);
      const { id_unidad, id_usuario, motivo } = req.body;
      const resultado = await cajasService.retirarUnidad(
        idCaja,
        Number(id_unidad),
        resolveActorId(req, id_usuario),
        motivo
      );
      res.json({
        ok: true,
        mensaje: 'Unidad retirada formalmente de la caja.',
        data: resultado,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }
}

// ==============================================================================
// 2. CONTROLADOR DE ÓRDENES DE PRODUCCIÓN (F-01, F-02, RF-01, RF-02)
// ==============================================================================
const createOrdenSchema = z.object({
  folio: z.string().min(3, 'El folio es obligatorio'),
  id_pedido: z.number().int().positive().optional(),
  id_cliente: z.number().int().positive('El cliente es obligatorio'),
  id_modelo: z.number().int().positive('El modelo es obligatorio'),
  id_color: z.number().int().positive('El color es obligatorio'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  fecha_compromiso: z.string().min(8, 'Fecha compromiso obligatoria'),
  id_usuario_registro: z.number().int().positive().optional(),
  id_linea_asignada: z.number().int().positive().optional(),
});

export class OrdenesController {
  static async getAll(req: Request, res: Response) {
    try {
      const idLinea = req.query.id_linea ? Number(req.query.id_linea) : undefined;
      const data = await ordenesRepo.getAll(idLinea);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = createOrdenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const nueva = await ordenesRepo.create({
        ...parsed.data,
        id_usuario_registro: resolveActorId(req, parsed.data.id_usuario_registro),
      });
      res.status(201).json({
        ok: true,
        mensaje: `Orden ${nueva.folio} creada exitosamente.`,
        data: nueva,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // RF-01: Importación masiva de órdenes de trabajo (JSON array o CSV)
  static async importar(req: Request, res: Response) {
    try {
      const idUsuario = resolveActorId(req, req.body?.id_usuario_registro || req.body?.id_usuario);
      let items: any[] = [];

      if (Array.isArray(req.body?.ordenes)) {
        items = req.body.ordenes;
      } else if (typeof req.body?.csv === 'string') {
        const lines = req.body.csv
          .split(/\r?\n/)
          .map((l: string) => l.trim())
          .filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c: string) => c.trim());
          if (i === 0 && cols[0].toLowerCase().includes('folio')) continue;
          if (cols.length < 6) continue;
          items.push({
            folio: cols[0],
            id_cliente: Number(cols[1]),
            id_modelo: Number(cols[2]),
            id_color: Number(cols[3]),
            cantidad: Number(cols[4]),
            fecha_compromiso: cols[5],
            id_linea_asignada: cols[6] ? Number(cols[6]) : undefined,
          });
        }
      } else {
        return res.status(400).json({
          error: 'Debe enviar un arreglo "ordenes" o una cadena "csv" con las órdenes a importar (RF-01).',
        });
      }

      if (items.length === 0) {
        return res.status(400).json({ error: 'No se encontraron órdenes válidas para importar.' });
      }

      const importadas = await ordenesRepo.importarMasivo(items, idUsuario);
      res.status(201).json({
        ok: true,
        mensaje: `Se importaron exitosamente ${importadas.length} órdenes de trabajo.`,
        total_importadas: importadas.length,
        data: importadas,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async asignarLinea(req: Request, res: Response) {
    try {
      const idOrden = Number(req.params.id);
      const { id_linea, id_usuario } = req.body;
      if (!id_linea) {
        return res.status(400).json({ error: 'Debe especificar el ID de línea a asignar.' });
      }

      const updated = await ordenesRepo.asignarLinea(
        idOrden,
        Number(id_linea),
        resolveActorId(req, id_usuario)
      );
      if (!updated) {
        return res.status(404).json({ error: `La orden ${idOrden} no fue encontrada.` });
      }

      res.json({
        ok: true,
        mensaje: `Orden ${updated.folio} asignada a la Línea ${id_linea} con éxito.`,
        data: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

// ==============================================================================
// 3. CONTROLADOR DE EMBARQUES (F-10, F-11, Incidente C, RNF-03)
// ==============================================================================
export class EmbarquesController {
  static async getAll(_req: Request, res: Response) {
    try {
      const data = await embarquesService.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const nuevo = await embarquesService.create({
        ...req.body,
        id_usuario_creo: resolveActorId(req, req.body?.id_usuario_creo || req.body?.id_usuario),
      });
      res.status(201).json(nuevo);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async despachar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const idUsuario = resolveActorId(req, req.body?.id_usuario);
      const updated = await embarquesService.despachar(id, idUsuario);
      res.json({
        ok: true,
        mensaje: `Embarque ${updated.referencia_embarque} despachado exitosamente.`,
        data: updated,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async asignarCaja(req: Request, res: Response) {
    try {
      const { id_embarque, id_caja, id_usuario } = req.body;
      const asignado = await embarquesService.asignarCaja(
        Number(id_embarque),
        Number(id_caja),
        resolveActorId(req, id_usuario)
      );
      res.status(201).json({
        ok: true,
        mensaje: 'Caja asignada y cargada en andén exitosamente.',
        data: asignado,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async retirarCaja(req: Request, res: Response) {
    try {
      const { id_embarque, id_caja, id_usuario, motivo } = req.body;
      const retirado = await embarquesService.retirarCaja(
        Number(id_embarque),
        Number(id_caja),
        resolveActorId(req, id_usuario),
        motivo
      );
      res.json({
        ok: true,
        mensaje: 'Caja retirada del embarque formalmente.',
        data: retirado,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async getHistorial(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const historial = await embarquesService.getHistorial(id);
      res.json(historial);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

// ==============================================================================
// 4. CONTROLADOR DE CIERRES DE TURNO (F-12, RF-07, RF-08, RF-29, INC-A, INC-D)
// ==============================================================================
export class TurnosController {
  static async getMetricas(req: Request, res: Response) {
    try {
      const fecha = (req.query.fecha as string) || new Date().toISOString().split('T')[0];
      const idTurno = Number(req.query.id_turno) || 1;
      const idLinea = Number(req.query.id_linea) || 1;
      const idOrden = req.query.id_orden ? Number(req.query.id_orden) : undefined;
      const metricas = await cierresService.calcularMetricas(fecha, idTurno, idLinea, idOrden);
      res.json(metricas);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async consolidarCierre(req: Request, res: Response) {
    try {
      const { fecha, id_turno, id_linea, id_lider, observaciones } = req.body;
      const resultado = await cierresService.consolidarCierre({
        fecha: fecha || new Date().toISOString().split('T')[0],
        id_turno: Number(id_turno),
        id_linea: Number(id_linea),
        id_lider: resolveActorId(req, id_lider),
        observaciones,
      });
      res.status(201).json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async corregirCierre(req: Request, res: Response) {
    try {
      const idCierre = Number(req.params.id);
      const { id_autorizacion, id_usuario, observaciones } = req.body;
      const resultado = await cierresService.corregirCierreConAutorizacion(idCierre, {
        id_autorizacion: Number(id_autorizacion),
        id_usuario: resolveActorId(req, id_usuario),
        observaciones,
      });
      res.json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async exportarCsv(req: Request, res: Response) {
    try {
      const idCierre = req.params.id ? Number(req.params.id) : undefined;
      const { filename, csv } = await cierresService.exportarCsv(idCierre);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async getAllCierres(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const cierres = await cierresService.getAll(limit);
      res.json(cierres);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

// ==============================================================================
// 5. CONTROLADOR DE GOBERNANZA Y AUTORIZACIONES (BD-13, RN-09, RN-11)
// ==============================================================================
export class AutorizacionesController {
  static async getAll(req: Request, res: Response) {
    try {
      const estado = req.query.estado as string | undefined;
      const data = await autorizacionesService.getAll(estado);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async solicitar(req: Request, res: Response) {
    try {
      const { tipo, id_referencia, id_usuario_solicita, motivo } = req.body;
      const resultado = await autorizacionesService.solicitar({
        tipo,
        id_referencia: Number(id_referencia),
        id_usuario_solicita: resolveActorId(req, id_usuario_solicita),
        motivo,
      });
      res.status(201).json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async resolver(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { estado, id_usuario_autoriza, comentario_resolucion } = req.body;
      const resultado = await autorizacionesService.resolver(id, {
        estado,
        id_usuario_autoriza: resolveActorId(req, id_usuario_autoriza),
        comentario_resolucion: comentario_resolucion || 'Resolución de supervisión',
      });
      res.json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }
}

// ==============================================================================
// 6. CONTROLADOR DE ADMINISTRACIÓN, PARÁMETROS Y AUDITORÍA
// ==============================================================================
export class AdministracionController {
  static async getParametros(_req: Request, res: Response) {
    try {
      const data = await paramRepo.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateParametro(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const valor = req.body.valor;
      const updated = await paramRepo.update(id, valor);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getBitacora(_req: Request, res: Response) {
    try {
      const data = await bitacoraRepo.getAll(100);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createBitacora(req: Request, res: Response) {
    try {
      const { id_usuario, modulo, accion } = req.body;
      const nuevo = await bitacoraRepo.insert(resolveActorId(req, id_usuario), modulo, accion);
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getRespaldos(_req: Request, res: Response) {
    try {
      const data = await respaldosRepo.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createRespaldo(req: Request, res: Response) {
    try {
      const { id_usuario, exitoso } = req.body;
      const nuevo = await respaldosRepo.insert(resolveActorId(req, id_usuario), exitoso !== false);
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

// ==============================================================================
// 7. CONTROLADOR DE OBJETIVOS Y REPORTES GERENCIALES (RF-05, RF-15, RF-24..29)
// ==============================================================================
export class ReportesController {
  static async getObjetivos(req: Request, res: Response) {
    try {
      const data = await reportesRepo.getObjetivos({
        fecha: req.query.fecha as string | undefined,
        id_turno: req.query.id_turno ? Number(req.query.id_turno) : undefined,
        id_linea: req.query.id_linea ? Number(req.query.id_linea) : undefined,
        id_modelo: req.query.id_modelo ? Number(req.query.id_modelo) : undefined,
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async upsertObjetivo(req: Request, res: Response) {
    try {
      const { fecha, id_turno, id_linea, id_modelo, cantidad_objetivo } = req.body;
      const obj = await reportesRepo.upsertObjetivo({
        fecha: fecha || new Date().toISOString().split('T')[0],
        id_turno: Number(id_turno),
        id_linea: Number(id_linea),
        id_modelo: Number(id_modelo),
        cantidad_objetivo: Number(cantidad_objetivo),
      });
      res.status(201).json({
        ok: true,
        mensaje: 'Objetivo de producción registrado formalmente.',
        data: obj,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getDistribucionCalidad(req: Request, res: Response) {
    try {
      const data = await reportesRepo.getDistribucionCalidad({
        id_linea: req.query.id_linea ? Number(req.query.id_linea) : undefined,
        id_turno: req.query.id_turno ? Number(req.query.id_turno) : undefined,
        id_modelo: req.query.id_modelo ? Number(req.query.id_modelo) : undefined,
        id_orden: req.query.id_orden ? Number(req.query.id_orden) : undefined,
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getParetoDefectos(req: Request, res: Response) {
    try {
      const data = await reportesRepo.getParetoDefectos({
        id_modelo: req.query.id_modelo ? Number(req.query.id_modelo) : undefined,
        id_linea: req.query.id_linea ? Number(req.query.id_linea) : undefined,
        id_turno: req.query.id_turno ? Number(req.query.id_turno) : undefined,
        id_orden: req.query.id_orden ? Number(req.query.id_orden) : undefined,
        id_estado_resultado: req.query.id_estado_resultado ? Number(req.query.id_estado_resultado) : undefined,
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getCajasPorCliente(_req: Request, res: Response) {
    try {
      const data = await reportesRepo.getCajasPorCliente();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // RF-29: Exportar reporte de Pareto de defectos / calidad en CSV
  static async exportarReporteCsv(req: Request, res: Response) {
    try {
      const pareto = await reportesRepo.getParetoDefectos({
        id_modelo: req.query.id_modelo ? Number(req.query.id_modelo) : undefined,
        id_linea: req.query.id_linea ? Number(req.query.id_linea) : undefined,
        id_turno: req.query.id_turno ? Number(req.query.id_turno) : undefined,
      });
      const headers = ['ID Defecto', 'Categoria', 'Descripcion', 'Severidad', 'Total Incidencias', 'Porcentaje'];
      const rows = pareto.map((r) =>
        [
          r.id_defecto,
          r.categoria,
          `"${String(r.descripcion).replace(/"/g, '""')}"`,
          r.severidad,
          r.total_incidencias,
          `${r.porcentaje}%`,
        ].join(',')
      );
      const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_pareto_defectos.csv"');
      res.status(200).send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
