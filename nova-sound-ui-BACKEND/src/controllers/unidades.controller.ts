import type { Request, Response } from 'express';
import { z } from 'zod';
import { UnidadesService } from '../services/unidades.service.js';

const service = new UnidadesService();

const dictamenSchema = z.object({
  numero_serie: z.string().min(1, 'El número de serie es obligatorio'),
  id_estado_calidad: z.number().int().min(1).max(4),
  id_usuario: z.number().int().positive().optional().default(1),
  id_defectos: z.array(z.number().int()).optional(),
  comentarios: z.string().optional(),
  pruebas: z
    .object({
      valida_encendido: z.boolean(),
      valida_audio: z.boolean(),
      valida_carga: z.boolean(),
      valida_bluetooth: z.boolean(),
    })
    .optional(),
  motivo: z.string().optional(),
});

export class UnidadesController {
  // F-05 / F-06 / RN-13 / BD-09: Dictamen formal en calidad
  static async dictaminar(req: Request, res: Response) {
    try {
      const parsed = dictamenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const resultado = await service.dictaminarCalidad(parsed.data);
      res.json({
        ok: true,
        mensaje: `Dictamen registrado formalmente para la unidad ${resultado.numero_serie}.`,
        data: resultado,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  // RF-25 / P-42: Consulta integral de trazabilidad por serie
  static async getTrazabilidad(req: Request, res: Response) {
    try {
      const numero_serie = String(req.params.numero_serie);
      const data = await service.getTrazabilidad(numero_serie);
      res.json(data);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async getRecientes(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const data = await service.getRecientes(limit);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getHistorial(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const data = await service.getHistorial(limit);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
