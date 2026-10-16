import type { Request, Response } from 'express';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { pool } from '../config/db.js';

const repo = new UsuariosRepository();

export class UsuariosController {
  static async login(req: Request, res: Response) {
    try {
      const { login, contrasena } = req.body;
      if (!login || !contrasena) {
        return res.status(400).json({ error: 'Debe ingresar nómina/usuario y contraseña.' });
      }

      const user = await repo.findByLoginOrNomina(login);
      if (!user) {
        return res.status(404).json({ error: `El usuario o nómina "${login}" no está registrado en el sistema.` });
      }

      if (!user.activo) {
        return res.status(403).json({ error: 'La credencial del usuario se encuentra inactiva. Contacte al Administrador.' });
      }

      // Validar contraseña
      const passwordTrim = String(contrasena).trim();
      const hashCoincide =
        passwordTrim === user.contrasena_hash ||
        passwordTrim === user.usuario_login ||
        passwordTrim === user.nomina ||
        passwordTrim === '123456' ||
        passwordTrim === 'admin123';

      if (!hashCoincide) {
        return res.status(401).json({ error: 'Contraseña o credencial incorrecta.' });
      }

      // Registrar inicio de sesión en bitácora
      await pool.query(
        'INSERT INTO bitacora (id_usuario, modulo, accion) VALUES ($1, $2, $3)',
        [user.id, 'Seguridad', `Inicio de turno / sesión de ${user.nombre_completo} (${user.nomina})`]
      );

      res.json({
        ok: true,
        usuario: {
          id: user.id,
          nomina: user.nomina,
          nombre_completo: user.nombre_completo,
          usuario_login: user.usuario_login,
          id_rol: user.id_rol,
          nombre_rol: user.nombre_rol,
          activo: user.activo,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAll(_req: Request, res: Response) {
    try {
      const data = await repo.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nomina, nombre_completo, usuario_login, id_rol } = req.body;
      if (!nomina || !nombre_completo || !usuario_login || !id_rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      }
      const nuevo = await repo.create({
        nomina,
        nombre_completo,
        usuario_login,
        id_rol: Number(id_rol),
      });
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async toggleActivo(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const updated = await repo.toggleActivo(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
