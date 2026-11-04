import type { Request, Response } from 'express';
import { CatalogosRepository } from '../repositories/catalogos.repository.js';
import { extractUserIdFromRequest } from '../middlewares/auth.middleware.js';
import { pool } from '../config/db.js';

const repo = new CatalogosRepository();

export class CatalogosController {
  static async getLineas(_req: Request, res: Response) {
    try {
      const data = await repo.getLineas();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTurnos(_req: Request, res: Response) {
    try {
      const data = await repo.getTurnos();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getModelos(_req: Request, res: Response) {
    try {
      const data = await repo.getModelos();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // RF-32 / P-38: Alta de modelos en catálogo con capacidad de caja oficial
  static async createModelo(req: Request, res: Response) {
    try {
      const { nombre_modelo, capacidad_caja, descripcion } = req.body;
      if (!nombre_modelo || !capacidad_caja || Number(capacidad_caja) <= 0) {
        return res.status(400).json({ error: 'Nombre de modelo y capacidad de caja (> 0) son obligatorios.' });
      }
      const nuevo = await repo.createModelo({
        nombre_modelo,
        capacidad_caja: Number(capacidad_caja),
        descripcion,
      });
      const idUsuario = extractUserIdFromRequest(req) || 1;
      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idUsuario, 'Configuración', `Alta de modelo ${nuevo.nombre_modelo}`, 'modelos', nuevo.id, JSON.stringify(nuevo), 'Gestión de catálogos (RF-32)']
      );
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getColores(_req: Request, res: Response) {
    try {
      const data = await repo.getColores();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createColor(req: Request, res: Response) {
    try {
      const { nombre_color } = req.body;
      if (!nombre_color) {
        return res.status(400).json({ error: 'El nombre del color es obligatorio.' });
      }
      const nuevo = await repo.createColor({ nombre_color });
      const idUsuario = extractUserIdFromRequest(req) || 1;
      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idUsuario, 'Configuración', `Alta de color ${nuevo.nombre_color}`, 'colores', nuevo.id, JSON.stringify(nuevo), 'Gestión de catálogos (RF-32)']
      );
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getDefectos(_req: Request, res: Response) {
    try {
      const data = await repo.getDefectos();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createDefecto(req: Request, res: Response) {
    try {
      const { categoria, descripcion, severidad } = req.body;
      const categoriasOficiales = ['Apariencia', 'Funcional', 'Identificación', 'Empaque'];
      if (!categoria || !categoriasOficiales.includes(categoria) || !descripcion) {
        return res.status(400).json({
          error: 'Categoría oficial (Apariencia, Funcional, Identificación, Empaque) y descripción son obligatorias (RF-14).',
        });
      }
      const nuevo = await repo.createDefecto({ categoria, descripcion, severidad });
      const idUsuario = extractUserIdFromRequest(req) || 1;
      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idUsuario, 'Configuración', `Alta de defecto: ${nuevo.descripcion}`, 'catalogo_defectos', nuevo.id, JSON.stringify(nuevo), 'Gestión de catálogos (RF-32)']
      );
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getEstadosCalidad(_req: Request, res: Response) {
    try {
      const data = await repo.getEstadosCalidad();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getClientes(_req: Request, res: Response) {
    try {
      const data = await repo.getClientes();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createCliente(req: Request, res: Response) {
    try {
      const { nombre_cliente, tipo_cliente, permite_mezcla_colores, requiere_etiqueta, requisitos_empaque } = req.body;
      if (!nombre_cliente) {
        return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
      }
      const nuevo = await repo.createCliente({
        nombre_cliente,
        tipo_cliente,
        permite_mezcla_colores,
        requiere_etiqueta,
        requisitos_empaque,
      });
      const idUsuario = extractUserIdFromRequest(req) || 1;
      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, valor_nuevo, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idUsuario, 'Configuración', `Alta de cliente ${nuevo.nombre_cliente}`, 'clientes', nuevo.id, JSON.stringify(nuevo), 'Gestión de catálogos (RF-32)']
      );
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTransportistas(_req: Request, res: Response) {
    try {
      const data = await repo.getTransportistas();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getRoles(_req: Request, res: Response) {
    try {
      const data = await repo.getRoles();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
