import type { Request, Response } from 'express';
import { CatalogosRepository } from '../repositories/catalogos.repository.js';

const repo = new CatalogosRepository();

export class CatalogosController {
  static async getLineas(_req: Request, res: Response) {
    try {
      const data = await repo.getLineas();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  static async getTurnos(_req: Request, res: Response) {
    try {
      const data = await repo.getTurnos();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  static async getModelos(_req: Request, res: Response) {
    try {
      const data = await repo.getModelos();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  static async getColores(_req: Request, res: Response) {
    try {
      const data = await repo.getColores();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  static async getDefectos(_req: Request, res: Response) {
    try {
      const data = await repo.getDefectos();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  static async getEstadosCalidad(_req: Request, res: Response) {
    try {
      const data = await repo.getEstadosCalidad();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
