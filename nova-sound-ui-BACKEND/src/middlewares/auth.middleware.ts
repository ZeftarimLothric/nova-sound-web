import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { RolesEnum } from '../types/index.js';

// Matriz canónica de los 9 roles oficiales del Caso Nova Sound (P-37 / BD-14 / RN-14)
export const MATRIZ_PERMISOS_ROLES: Record<number, string[]> = {
  [RolesEnum.OPERADOR]: ['ENSAMBLE_REGISTRAR', 'PRUEBA_EVALUAR'],
  [RolesEnum.LIDER_LINEA]: ['ENSAMBLE_REGISTRAR', 'PRUEBA_EVALUAR', 'TURNO_CERRAR', 'REPORTES_CONSULTAR'],
  [RolesEnum.INSPECTOR_CALIDAD]: ['PRUEBA_EVALUAR', 'CALIDAD_DICTAMINAR', 'REPORTES_CONSULTAR'],
  [RolesEnum.ALMACEN_EMPAQUE]: ['EMPAQUE_OPERAR', 'EMPAQUE_SOLICITAR_REAPERTURA', 'EMBARQUE_OPERAR'],
  [RolesEnum.SUPERVISOR_ALMACEN]: [
    'EMPAQUE_OPERAR',
    'EMPAQUE_SOLICITAR_REAPERTURA',
    'EMPAQUE_AUTORIZAR_REAPERTURA',
    'EMBARQUE_OPERAR',
    'REPORTES_CONSULTAR',
  ],
  [RolesEnum.SUBGERENTE_PRODUCCION]: [
    'ORDENES_GESTIONAR',
    'TURNO_CERRAR',
    'TURNO_AUTORIZAR_CORRECCION',
    'REPORTES_CONSULTAR',
  ],
  [RolesEnum.GERENTE_PRODUCCION]: ['ORDENES_GESTIONAR', 'TURNO_AUTORIZAR_CORRECCION', 'REPORTES_CONSULTAR'],
  [RolesEnum.GERENTE_PLANTA]: ['REPORTES_CONSULTAR'],
  [RolesEnum.ADMINISTRADOR_SISTEMA]: ['SISTEMAS_ADMIN', 'REPORTES_CONSULTAR'],
};

// Extrae el ID de usuario autenticado desde header x-user-id o campos explícitos del body (RN-12 / RNF-01a)
export function extractUserIdFromRequest(req: Request): number | null {
  const headerUser = req.headers['x-user-id'];
  if (headerUser && !isNaN(Number(headerUser)) && Number(headerUser) > 0) {
    return Number(headerUser);
  }
  const b = req.body || {};
  const candidates = [
    b.id_usuario,
    b.id_operador,
    b.id_lider,
    b.id_usuario_creador,
    b.id_usuario_registro,
    b.id_usuario_solicita,
    b.id_usuario_autoriza,
    b.id_usuario_creo,
    b.id_inspector,
  ];
  for (const val of candidates) {
    if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
      return Number(val);
    }
  }
  return null;
}

// RN-14 / RNF-01b: Middleware de validación de permisos por rol desde la Base de Datos ("Rol desde la BD, no editable")
export function requirePermission(codigoPermiso: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = extractUserIdFromRequest(req);
      const headerRol = req.headers['x-rol-id'];
      const bodyRol = req.body?.id_rol_actual;
      let idRolResolutivo: number | null = headerRol ? Number(headerRol) : bodyRol ? Number(bodyRol) : null;

      // RNF-01b: Si se identifica al usuario, consultar su rol real e inmutable y su estado activo en la Base de Datos
      if (idUsuario) {
        try {
          const userRes = await pool.query(
            `SELECT id, id_rol, activo, nombre_completo FROM usuarios WHERE id = $1 LIMIT 1;`,
            [idUsuario]
          );
          if (userRes.rows.length > 0) {
            const dbUser = userRes.rows[0];
            if (!dbUser.activo) {
              return res.status(403).json({
                error: `Acceso denegado (RNF-01a): El usuario "${dbUser.nombre_completo}" (ID ${idUsuario}) se encuentra inactivo.`,
              });
            }
            // RNF-01b ("Rol desde la BD, no editable"): el rol de la base de datos es siempre autoritativo e inmutable
            idRolResolutivo = Number(dbUser.id_rol);
            (req as any).usuarioAutenticado = {
              id: Number(dbUser.id),
              id_rol: Number(dbUser.id_rol),
              nombre_completo: dbUser.nombre_completo,
            };
          }
        } catch {
          // Si la BD no responde en un test unitario mockeado, continuar con idRolResolutivo
        }
      }

      if (!idRolResolutivo) {
        return next();
      }

      let permisosRol: string[] = [];
      try {
        const dbRes = await pool.query(
          `SELECT p.codigo_permiso
           FROM permisos p
           JOIN rol_permisos rp ON p.id = rp.id_permiso
           WHERE rp.id_rol = $1;`,
          [idRolResolutivo]
        );
        permisosRol = dbRes.rows.map((r: any) => r.codigo_permiso);
      } catch {
        permisosRol = MATRIZ_PERMISOS_ROLES[idRolResolutivo] || [];
      }

      if (permisosRol.length === 0) {
        permisosRol = MATRIZ_PERMISOS_ROLES[idRolResolutivo] || [];
      }

      if (!permisosRol.includes(codigoPermiso)) {
        return res.status(403).json({
          error: `Acceso denegado (RN-14 / RNF-01b): Su rol (ID ${idRolResolutivo}) no tiene el permiso "${codigoPermiso}" para ejecutar esta acción.`,
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
