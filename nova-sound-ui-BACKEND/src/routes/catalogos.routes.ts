import { Router } from 'express';
import { CatalogosController } from '../controllers/catalogos.controller.js';

export const catalogosRouter = Router();

catalogosRouter.get('/lineas', CatalogosController.getLineas);
catalogosRouter.get('/turnos', CatalogosController.getTurnos);
catalogosRouter.get('/modelos', CatalogosController.getModelos);
catalogosRouter.get('/colores', CatalogosController.getColores);
catalogosRouter.get('/defectos', CatalogosController.getDefectos);
catalogosRouter.get('/estados-calidad', CatalogosController.getEstadosCalidad);
