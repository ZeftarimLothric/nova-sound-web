import { Router } from 'express';
import { catalogosRouter } from './catalogos.routes.js';
import { unidadesRouter } from './unidades.routes.js';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import {
  CajasController,
  OrdenesController,
  EmbarquesController,
  AdministracionController,
} from '../controllers/operaciones.controller.js';

export const apiRouter = Router();

// Healthcheck
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    sistema: 'NOVA SOUND MES / SCADA API',
    timestamp: new Date().toISOString(),
  });
});

// Catálogos y Unidades (Ensamble y Calidad)
apiRouter.use('/catalogos', catalogosRouter);
apiRouter.use('/unidades', unidadesRouter);

// Usuarios y Seguridad (Tabla usuarios / roles)
apiRouter.post('/auth/login', UsuariosController.login);
apiRouter.get('/usuarios', UsuariosController.getAll);
apiRouter.post('/usuarios', UsuariosController.create);
apiRouter.patch('/usuarios/:id/toggle-activo', UsuariosController.toggleActivo);

// Cajas y Empaque (Tabla cajas / cat_cajas)
apiRouter.get('/cajas', CajasController.getAll);
apiRouter.post('/cajas', CajasController.create);
apiRouter.patch('/cajas/:id/cerrar', CajasController.cerrar);
apiRouter.post('/cajas/empacar', CajasController.empacar);

// Órdenes de Producción (Tabla ordenes)
apiRouter.get('/ordenes', OrdenesController.getAll);

// Embarques y Logística (Tabla embarque / embarque_caja)
apiRouter.get('/embarques', EmbarquesController.getAll);
apiRouter.post('/embarques', EmbarquesController.create);
apiRouter.patch('/embarques/:id/despachar', EmbarquesController.despachar);
apiRouter.post('/embarques/asignar-caja', EmbarquesController.asignarCaja);
apiRouter.post('/embarques/retirar-caja', EmbarquesController.retirarCaja);

// Administración, Parámetros y Auditoría
apiRouter.get('/parametros', AdministracionController.getParametros);
apiRouter.patch('/parametros/:id', AdministracionController.updateParametro);
apiRouter.get('/bitacora', AdministracionController.getBitacora);
apiRouter.post('/bitacora', AdministracionController.createBitacora);
apiRouter.get('/respaldos', AdministracionController.getRespaldos);
apiRouter.post('/respaldos', AdministracionController.createRespaldo);
