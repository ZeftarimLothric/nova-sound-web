import { Router } from 'express';
import { UnidadesController } from '../controllers/unidades.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

export const unidadesRouter = Router();

// Dictamen formal de calidad (F-05 / F-06 / RN-13 / BD-09)
unidadesRouter.post('/calidad/dictamen', requirePermission('CALIDAD_DICTAMINAR'), UnidadesController.dictaminar);
unidadesRouter.post('/dictaminar', requirePermission('CALIDAD_DICTAMINAR'), UnidadesController.dictaminar);

// RF-25 / P-42: Consulta integral de trazabilidad por número de serie
unidadesRouter.get('/trazabilidad/:numero_serie', UnidadesController.getTrazabilidad);

// Consultas
unidadesRouter.get('/recientes', UnidadesController.getRecientes);
unidadesRouter.get('/historial', UnidadesController.getHistorial);
