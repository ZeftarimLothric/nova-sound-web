import { Router } from 'express';
import { CatalogosController } from '../controllers/catalogos.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

export const catalogosRouter = Router();

catalogosRouter.get('/lineas', CatalogosController.getLineas);
catalogosRouter.get('/turnos', CatalogosController.getTurnos);
catalogosRouter.get('/modelos', CatalogosController.getModelos);
catalogosRouter.post('/modelos', requirePermission('SISTEMAS_ADMIN'), CatalogosController.createModelo);
catalogosRouter.get('/colores', CatalogosController.getColores);
catalogosRouter.post('/colores', requirePermission('SISTEMAS_ADMIN'), CatalogosController.createColor);
catalogosRouter.get('/defectos', CatalogosController.getDefectos);
catalogosRouter.post('/defectos', requirePermission('SISTEMAS_ADMIN'), CatalogosController.createDefecto);
catalogosRouter.get('/estados-calidad', CatalogosController.getEstadosCalidad);
catalogosRouter.get('/clientes', CatalogosController.getClientes);
catalogosRouter.post('/clientes', requirePermission('SISTEMAS_ADMIN'), CatalogosController.createCliente);
catalogosRouter.get('/transportistas', CatalogosController.getTransportistas);
catalogosRouter.get('/roles', CatalogosController.getRoles);
