import type { Request, Response } from 'express';
import { z } from 'zod';
import { EnsambleService } from '../services/ensamble.service.js';

const service = new EnsambleService();

const conteoSchema = z.object({
  id_orden: z.number().int().positive('El ID de orden es obligatorio'),
  id_linea: z.number().int().positive('El ID de línea es obligatorio'),
  id_turno: z.number().int().positive('El ID de turno es obligatorio'),
  id_operador: z.number().int().positive('El ID de operador es obligatorio'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
});

const defectoSchema = z.object({
  id_ensamble: z.number().int().positive('El ID del registro de ensamble es obligatorio (BD-06)'),
  id_defecto: z.number().int().positive('El ID de defecto del catálogo es obligatorio (BD-06)'),
  etapa: z.string().optional(),
  cantidad: z.number().int().positive().optional().default(1),
  motivo: z.string().min(3, 'El motivo es obligatorio'),
  id_usuario: z.number().int().positive().optional().default(1),
});

export class EnsambleController {
  // F-03 / RF-04: Registrar piezas terminadas por conteo
  static async registrarConteo(req: Request, res: Response) {
    try {
      const parsed = conteoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const resultado = await service.registrarConteo(parsed.data);
      res.status(201).json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async getRecientes(req: Request, res: Response) {
    try {
      const idLinea = req.query.id_linea ? Number(req.query.id_linea) : undefined;
      const data = await service.getHistorialReciente(idLinea);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async registrarDefecto(req: Request, res: Response) {
    try {
      const parsed = defectoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const nuevo = await service.registrarDefecto(parsed.data);
      res.status(201).json({
        ok: true,
        mensaje: 'Defecto de ensamble registrado formalmente.',
        data: nuevo,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }
}

