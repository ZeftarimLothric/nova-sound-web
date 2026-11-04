import { Router } from 'express';
import { catalogosRouter } from './catalogos.routes.js';
import { unidadesRouter } from './unidades.routes.js';
import { EnsambleController } from '../controllers/ensamble.controller.js';
import { PruebasController } from '../controllers/pruebas.controller.js';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import {
  CajasController,
  OrdenesController,
  EmbarquesController,
  TurnosController,
  AutorizacionesController,
  AdministracionController,
  ReportesController,
} from '../controllers/operaciones.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { pool } from '../config/db.js';

export const apiRouter = Router();

// Healthcheck y aviso de mantenimiento (RNF-07)
apiRouter.get('/health', async (_req, res) => {
  try {
    const paramRes = await pool.query(
      "SELECT clave, valor FROM parametros_sistema WHERE clave IN ('SISTEMA_MODO_MANTENIMIENTO', 'MENSAJE_MANTENIMIENTO');"
    );
    const paramsMap: Record<string, string> = {};
    for (const r of paramRes.rows) {
      paramsMap[r.clave] = r.valor;
    }
    const enMantenimiento = paramsMap['SISTEMA_MODO_MANTENIMIENTO'] === 'true';
    res.json({
      status: enMantenimiento ? 'MANTENIMIENTO' : 'ONLINE',
      modo_mantenimiento: enMantenimiento,
      mensaje_mantenimiento: paramsMap['MENSAJE_MANTENIMIENTO'] || 'Sistema operativo con normalidad',
      sistema: 'NOVA SOUND MES / SCADA API',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.json({
      status: 'ONLINE',
      modo_mantenimiento: false,
      mensaje_mantenimiento: 'Sistema operativo con normalidad',
      sistema: 'NOVA SOUND MES / SCADA API',
      timestamp: new Date().toISOString(),
    });
  }
});

// ==============================================================================
// 1. ENSAMBLE (F-03 / RF-04 / BD-06 / BD-10: Conteo de piezas sin serie)
// ==============================================================================
apiRouter.post('/ensamble/conteo', requirePermission('ENSAMBLE_REGISTRAR'), EnsambleController.registrarConteo);
apiRouter.get('/ensamble/recientes', EnsambleController.getRecientes);
apiRouter.post('/ensamble/defecto', requirePermission('ENSAMBLE_REGISTRAR'), EnsambleController.registrarDefecto);

// ==============================================================================
// 2. PRUEBA FUNCIONAL (F-04 / RN-04 / RF-09..11 / BD-03..05: Nacimiento de Serie)
// ==============================================================================
apiRouter.post('/pruebas/evaluar', requirePermission('PRUEBA_EVALUAR'), PruebasController.evaluar);
apiRouter.get('/pruebas/recientes', PruebasController.getRecientes);

// ==============================================================================
// 3. CALIDAD Y UNIDADES (F-05, F-06, RN-13, RF-25: Trazabilidad 360°)
// ==============================================================================
apiRouter.use('/unidades', unidadesRouter);

// ==============================================================================
// 4. CAJAS Y EMPAQUE (F-08, F-09, RN-05 a RN-09, Incidente B)
// ==============================================================================
apiRouter.get('/cajas', CajasController.getAll);
apiRouter.get('/cajas/:id', CajasController.getById);
apiRouter.post('/cajas', requirePermission('EMPAQUE_OPERAR'), CajasController.create);
apiRouter.post('/cajas/empacar-serie', requirePermission('EMPAQUE_OPERAR'), CajasController.empacarPorSerie);
apiRouter.patch('/cajas/:id/cerrar', requirePermission('EMPAQUE_OPERAR'), CajasController.cerrar);
apiRouter.post('/cajas/:id/retirar-unidad', requirePermission('EMPAQUE_AUTORIZAR_REAPERTURA'), CajasController.retirarUnidad);

// ==============================================================================
// 5. ÓRDENES DE PRODUCCIÓN Y OBJETIVOS (F-01, F-02, RF-01..05, BD-11)
// ==============================================================================
apiRouter.get('/ordenes', OrdenesController.getAll);
apiRouter.post('/ordenes', requirePermission('ORDENES_GESTIONAR'), OrdenesController.create);
apiRouter.post('/ordenes/importar', requirePermission('ORDENES_GESTIONAR'), OrdenesController.importar);
apiRouter.patch('/ordenes/:id/asignar-linea', requirePermission('ORDENES_GESTIONAR'), OrdenesController.asignarLinea);
apiRouter.get('/objetivos', ReportesController.getObjetivos);
apiRouter.post('/objetivos', requirePermission('ORDENES_GESTIONAR'), ReportesController.upsertObjetivo);

// ==============================================================================
// 6. EMBARQUES Y LOGÍSTICA (F-10, F-11, Incidente C, RNF-03)
// ==============================================================================
apiRouter.get('/embarques', EmbarquesController.getAll);
apiRouter.get('/embarques/:id/historial', EmbarquesController.getHistorial);
apiRouter.post('/embarques', requirePermission('EMBARQUE_OPERAR'), EmbarquesController.create);
apiRouter.post('/embarques/asignar-caja', requirePermission('EMBARQUE_OPERAR'), EmbarquesController.asignarCaja);
apiRouter.post('/embarques/retirar-caja', requirePermission('EMBARQUE_OPERAR'), EmbarquesController.retirarCaja);
apiRouter.patch('/embarques/:id/despachar', requirePermission('EMBARQUE_OPERAR'), EmbarquesController.despachar);

// ==============================================================================
// 7. CIERRES DE TURNO Y REPORTES (F-12, RF-07, RF-08, RF-15, RF-24..33, INC-A, INC-D)
// ==============================================================================
apiRouter.get('/turnos/metricas', TurnosController.getMetricas);
apiRouter.post('/turnos/cierre', requirePermission('TURNO_CERRAR'), TurnosController.consolidarCierre);
apiRouter.get('/turnos/cierres', TurnosController.getAllCierres);
apiRouter.get('/turnos/cierres/exportar', TurnosController.exportarCsv);
apiRouter.get('/turnos/cierres/:id/exportar', TurnosController.exportarCsv);
apiRouter.patch('/turnos/cierres/:id/corregir', requirePermission('TURNO_AUTORIZAR_CORRECCION'), TurnosController.corregirCierre);
apiRouter.get('/reportes/conteo-etapas', TurnosController.getMetricas);
apiRouter.get('/reportes/distribucion-calidad', ReportesController.getDistribucionCalidad);
apiRouter.get('/reportes/pareto-defectos', ReportesController.getParetoDefectos);
apiRouter.get('/reportes/cajas-por-cliente', ReportesController.getCajasPorCliente);
apiRouter.get('/reportes/exportar', ReportesController.exportarReporteCsv);

// ==============================================================================
// 8. AUTORIZACIONES Y GOBERNANZA (BD-13, RN-09, RN-11, RN-14)
// ==============================================================================
apiRouter.get('/autorizaciones', AutorizacionesController.getAll);
apiRouter.post('/autorizaciones/solicitar', AutorizacionesController.solicitar);
apiRouter.patch('/autorizaciones/:id/resolver', AutorizacionesController.resolver);

// ==============================================================================
// 9. CATÁLOGOS Y SEGURIDAD
// ==============================================================================
apiRouter.use('/catalogos', catalogosRouter);
apiRouter.post('/auth/login', UsuariosController.login);
apiRouter.get('/usuarios', UsuariosController.getAll);
apiRouter.post('/usuarios', requirePermission('SISTEMAS_ADMIN'), UsuariosController.create);
apiRouter.patch('/usuarios/:id/toggle-activo', requirePermission('SISTEMAS_ADMIN'), UsuariosController.toggleActivo);

// ==============================================================================
// 10. ADMINISTRACIÓN, PARÁMETROS Y BITÁCORA
// ==============================================================================
apiRouter.get('/parametros', AdministracionController.getParametros);
apiRouter.patch('/parametros/:id', requirePermission('SISTEMAS_ADMIN'), AdministracionController.updateParametro);
apiRouter.get('/bitacora', AdministracionController.getBitacora);
apiRouter.post('/bitacora', AdministracionController.createBitacora);
apiRouter.get('/respaldos', AdministracionController.getRespaldos);
apiRouter.post('/respaldos', requirePermission('SISTEMAS_ADMIN'), AdministracionController.createRespaldo);
