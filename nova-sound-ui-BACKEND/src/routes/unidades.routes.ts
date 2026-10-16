import { Router } from 'express';
import { UnidadesController } from '../controllers/unidades.controller.js';

export const unidadesRouter = Router();

// Registro de unidad en Ensamble
unidadesRouter.post('/ensamble', UnidadesController.registrar);

// Dictamen de calidad
unidadesRouter.post('/calidad/dictamen', UnidadesController.dictaminar);

// Consultas
unidadesRouter.get('/recientes', UnidadesController.getRecientes);
unidadesRouter.get('/historial', UnidadesController.getHistorial);
