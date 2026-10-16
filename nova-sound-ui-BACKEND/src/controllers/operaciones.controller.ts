import type { Request, Response } from 'express';
import { CajasRepository } from '../repositories/cajas.repository.js';
import { OrdenesRepository } from '../repositories/ordenes.repository.js';
import { EmbarquesRepository } from '../repositories/embarques.repository.js';
import {
  ParametrosRepository,
  BitacoraRepository,
  RespaldosRepository,
} from '../repositories/administracion.repository.js';

const cajasRepo = new CajasRepository();
const ordenesRepo = new OrdenesRepository();
const embarquesRepo = new EmbarquesRepository();
const paramRepo = new ParametrosRepository();
const bitacoraRepo = new BitacoraRepository();
const respaldosRepo = new RespaldosRepository();

export class CajasController {
  static async getAll(_req: Request, res: Response) {
    try {
      const data = await cajasRepo.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { id_cat_caja, id_usuario_creador } = req.body;
      const nueva = await cajasRepo.create(Number(id_cat_caja) || 1, Number(id_usuario_creador) || 1);
      res.status(201).json(nueva);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async cerrar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const updated = await cajasRepo.cerrar(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async empacar(req: Request, res: Response) {
    try {
      const { id_unidad, id_caja } = req.body;
      const updated = await cajasRepo.empacarUnidad(Number(id_unidad), Number(id_caja));
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export class OrdenesController {
  static async getAll(_req: Request, res: Response) {
    try {
      const data = await ordenesRepo.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export class EmbarquesController {
  static async getAll(_req: Request, res: Response) {
    try {
      const data = await embarquesRepo.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const nuevo = await embarquesRepo.create(req.body);
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async despachar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const idUsuario = Number(req.body.id_usuario) || 1;
      const updated = await embarquesRepo.despachar(id, idUsuario);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async asignarCaja(req: Request, res: Response) {
    try {
      const { id_embarque, id_caja, id_usuario } = req.body;
      const asignado = await embarquesRepo.asignarCaja(Number(id_embarque), Number(id_caja), Number(id_usuario) || 1);
      res.status(201).json(asignado);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async retirarCaja(req: Request, res: Response) {
    try {
      const { id_embarque, id_caja, motivo } = req.body;
      const retirado = await embarquesRepo.retirarCaja(Number(id_embarque), Number(id_caja), motivo || 'Retiro de andén');
      res.json(retirado);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

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
      const valor = Number(req.body.valor);
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
      const nuevo = await bitacoraRepo.insert(Number(id_usuario) || 1, modulo, accion);
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
      const nuevo = await respaldosRepo.insert(Number(id_usuario) || 1, exitoso !== false);
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
