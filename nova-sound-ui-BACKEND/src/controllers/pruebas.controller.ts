import type { Request, Response } from 'express';
import { z } from 'zod';
import { PruebasService } from '../services/pruebas.service.js';

const service = new PruebasService();

const evaluarPruebaSchema = z.object({
  id_orden: z.number().int().positive('El ID de orden es obligatorio'),
  id_linea: z.number().int().positive('El ID de línea es obligatorio'),
  id_turno: z.number().int().positive('El ID de turno es obligatorio'),
  id_operador: z.number().int().positive('El ID de operador es obligatorio'),
  valida_encendido: z.boolean(),
  valida_audio: z.boolean(),
  valida_carga: z.boolean(),
  valida_bluetooth: z.boolean(),
  id_defecto: z.number().int().positive().optional(),
  descripcion_defecto: z.string().optional(),
});

export class PruebasController {
  // F-04 / RF-09 / RF-10: Estación de prueba funcional (genera serie si pasa)
  static async evaluar(req: Request, res: Response) {
    try {
      const parsed = evaluarPruebaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const resultado = await service.evaluarPrueba(parsed.data);
      const status = resultado.aprobado ? 201 : 200;
      res.status(status).json(resultado);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  }

  static async getRecientes(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const data = await service.getRecientes(limit);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

