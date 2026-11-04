import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { pool } from '../config/db.js';

const repo = new UsuariosRepository();

export class UsuariosController {
  // RNF-01b / RNF-01c / P-02: Login seguro exclusivamente con hash bcrypt y retorno de permisos RBAC desde la BD
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

      // RNF-01c / P-02: Validación estricta de contraseña con hash bcrypt (prohibido texto plano)
      const passwordTrim = String(contrasena).trim();
      if (!user.contrasena_hash || !user.contrasena_hash.startsWith('$2')) {
        return res.status(401).json({
          error: 'Violación de Seguridad (RNF-01c): La cuenta no cuenta con un hash criptográfico válido (bcrypt).',
        });
      }

      const passwordValida = await bcrypt.compare(passwordTrim, user.contrasena_hash);
      if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas. Contraseña incorrecta.' });
      }

      // Obtener matriz de permisos del rol desde la BD (RNF-01b, BD-14)
      const permisos = await repo.getPermisosByRol(user.id_rol);

      // Registrar inicio de sesión en bitácora unificada (RN-12 / BD-15)
      await pool.query(
        `INSERT INTO bitacora (id_usuario, modulo, accion, entidad, id_registro_afectado, motivo)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          'Seguridad',
          `Inicio de sesión de ${user.nombre_completo} (${user.nomina})`,
          'usuarios',
          user.id,
          `Autenticación de turno con rol ${user.nombre_rol}`,
        ]
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
          permisos,
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
      const { nomina, nombre_completo, usuario_login, id_rol, contrasena } = req.body;
      if (!nomina || !nombre_completo || !usuario_login || !id_rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      }

      // Hashear contraseña con bcrypt (RNF-01c)
      const salt = await bcrypt.genSalt(10);
      const contrasena_hash = await bcrypt.hash(contrasena || '123456', salt);

      const nuevo = await repo.create({
        nomina,
        nombre_completo,
        usuario_login,
        id_rol: Number(id_rol),
        contrasena_hash,
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
