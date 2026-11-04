import { describe, it, expect, vi } from 'vitest';
import { CajasService } from '../src/services/cajas.service.js';
import { EmbarquesService } from '../src/services/embarques.service.js';
import { CierresTurnoService } from '../src/services/cierres-turno.service.js';
import { AutorizacionesService } from '../src/services/autorizaciones.service.js';
import { RolesEnum } from '../src/types/index.js';
import { MATRIZ_PERMISOS_ROLES, requirePermission } from '../src/middlewares/auth.middleware.js';

describe('Auditoría de Incidentes Críticos como Casos de Prueba (Nova Sound MES)', () => {

  // ============================================================================
  // INCIDENTE A: 87 unidades "desaparecidas" (Balance de masa en las 5 etapas: RF-33)
  // ============================================================================
  describe('INCIDENTE A: Reconciliación de Producción y Balance de Masa (5 etapas)', () => {
    it('Debe calcular conteos en las 5 etapas (ensambladas, probadas, liberadas, empacadas, embarcadas) y la diferencia de 87', async () => {
      const mockRepo = {
        getMetricasBalance: vi.fn().mockResolvedValue({
          piezas_ensambladas: 1000,
          piezas_probadas: 950,
          piezas_liberadas: 900,
          piezas_empacadas: 850,
          piezas_embarcadas: 800,
          piezas_scrap: 13,
          diferencia_balance: 87, // ¡Las 87 unidades desaparecidas identificadas!
          diferencias_entre_etapas: {
            ensamble_a_prueba: 50,
            prueba_a_liberadas: 50,
            liberadas_a_empaque: 50,
            empaque_a_embarque: 50,
          },
        }),
      } as any;

      const service = new CierresTurnoService(mockRepo);
      const metricas = await service.calcularMetricas('2026-10-31', 1, 1);

      expect(metricas.piezas_ensambladas).toBe(1000);
      expect(metricas.piezas_embarcadas).toBe(800);
      expect(metricas.diferencia_balance).toBe(87);
      expect(mockRepo.getMetricasBalance).toHaveBeenCalledWith('2026-10-31', 1, 1);
    });
  });

  // ============================================================================
  // INCIDENTE B: Caja NS-PRO Negro con 6 NS-SPORT Azul (Reglas RN-05 y RN-06)
  // ============================================================================
  describe('INCIDENTE B: Empaque y Validación Estricta de Modelo y Color', () => {
    it('Debe rechazar con error 400 si se intenta empacar un modelo diferente al de la caja (RN-05)', async () => {
      const mockCajasRepo = {
        getById: vi.fn().mockResolvedValue({
          id: 1,
          codigo_caja: 'BOX-00001',
          estado: 'Abierta',
          nombre_modelo: 'NS-PRO',
          nombre_color: 'Negro',
          permite_mezcla_colores: false,
          capacidad_maxima: 6,
          piezas_actuales: 0,
        }),
      } as any;

      const mockUnidadesRepo = {
        findByNumeroSerie: vi.fn().mockResolvedValue({
          id: 10,
          numero_serie: 'NS-SPORT-202610-0010',
          modelo: 'NS-SPORT',
          color: 'Negro',
          permite_empaque: true,
          id_caja: null,
        }),
      } as any;

      const service = new CajasService(mockCajasRepo, mockUnidadesRepo);

      await expect(
        service.empacarUnidadPorSerie({
          id_caja: 1,
          numero_serie: 'NS-SPORT-202610-0010',
          id_usuario: 4,
        })
      ).rejects.toThrow('Incompatibilidad de modelo');
    });

    it('Debe rechazar con error 400 si se intenta mezclar colores cuando el cliente no lo permite (RN-06)', async () => {
      const mockCajasRepo = {
        getById: vi.fn().mockResolvedValue({
          id: 2,
          codigo_caja: 'BOX-00002',
          estado: 'Abierta',
          nombre_modelo: 'NS-PRO',
          nombre_color: 'Negro',
          permite_mezcla_colores: false,
          capacidad_maxima: 6,
          piezas_actuales: 0,
        }),
      } as any;

      const mockUnidadesRepo = {
        findByNumeroSerie: vi.fn().mockResolvedValue({
          id: 11,
          numero_serie: 'NS-PRO-202610-0011',
          modelo: 'NS-PRO',
          color: 'Azul',
          permite_empaque: true,
          id_caja: null,
        }),
      } as any;

      const service = new CajasService(mockCajasRepo, mockUnidadesRepo);

      await expect(
        service.empacarUnidadPorSerie({
          id_caja: 2,
          numero_serie: 'NS-PRO-202610-0011',
          id_usuario: 4,
        })
      ).rejects.toThrow('El cliente no permite mezcla de colores');
    });

    it('Debe rechazar con error 400 si la unidad no está liberada por Calidad (RN-01)', async () => {
      const mockCajasRepo = {
        getById: vi.fn().mockResolvedValue({
          id: 3,
          codigo_caja: 'BOX-00003',
          estado: 'Abierta',
          nombre_modelo: 'NS-PRO',
          nombre_color: 'Negro',
          permite_mezcla_colores: false,
          capacidad_maxima: 6,
          piezas_actuales: 0,
        }),
      } as any;

      const mockUnidadesRepo = {
        findByNumeroSerie: vi.fn().mockResolvedValue({
          id: 12,
          numero_serie: 'NS-PRO-202610-0012',
          modelo: 'NS-PRO',
          color: 'Negro',
          permite_empaque: false,
          nombre_estado: 'En retención',
          id_caja: null,
        }),
      } as any;

      const service = new CajasService(mockCajasRepo, mockUnidadesRepo);

      await expect(
        service.empacarUnidadPorSerie({
          id_caja: 3,
          numero_serie: 'NS-PRO-202610-0012',
          id_usuario: 4,
        })
      ).rejects.toThrow('no está liberada');
    });
  });

  // ============================================================================
  // INCIDENTE C: Unidades retenidas dentro de un embarque (Regla F-11 y RN-10)
  // ============================================================================
  describe('INCIDENTE C: Bloqueo de Despacho por Unidades Retenidas', () => {
    it('Debe bloquear el despacho y arrojar error 400 detallando las unidades retenidas', async () => {
      const mockEmbarquesRepo = {
        getById: vi.fn().mockResolvedValue({ id: 100, referencia_embarque: 'EMB-2026-001' }),
        getCajasAbiertas: vi.fn().mockResolvedValue([]),
        getUnidadesNoLiberadas: vi.fn().mockResolvedValue([
          { numero_serie: 'NS-PRO-202610-0050', codigo_caja: 'BOX-00001', estado_calidad: 'En retención' },
        ]),
        despachar: vi.fn(),
      } as any;

      const service = new EmbarquesService(mockEmbarquesRepo, {} as any);

      await expect(service.despachar(100, 5)).rejects.toThrow(
        'BLOQUEO DE EMBARQUE (Incidente C / F-11)'
      );
      expect(mockEmbarquesRepo.despachar).not.toHaveBeenCalled();
    });

    it('Debe autorizar el despacho si todas las unidades están 100% liberadas', async () => {
      const mockEmbarquesRepo = {
        getById: vi.fn().mockResolvedValue({ id: 101, referencia_embarque: 'EMB-2026-002' }),
        getCajasAbiertas: vi.fn().mockResolvedValue([]),
        getUnidadesNoLiberadas: vi.fn().mockResolvedValue([]),
        despachar: vi.fn().mockResolvedValue({ id: 101, referencia_embarque: 'EMB-2026-002', estado: 'Despachado' }),
      } as any;

      const service = new EmbarquesService(mockEmbarquesRepo, {} as any);
      const resultado = await service.despachar(101, 5);

      expect(resultado.estado).toBe('Despachado');
      expect(mockEmbarquesRepo.despachar).toHaveBeenCalledWith(101, 5);
    });
  });

  // ============================================================================
  // INCIDENTE D & RN-14 / P-37: Gobernanza, 9 Roles y RBAC en Backend
  // ============================================================================
  describe('INCIDENTE D & RN-14: Gobernanza, Autorizaciones y los 9 Roles Oficiales', () => {
    it('Debe permitir solicitar reapertura de caja, ligarla a bitacora_permisos (BD-13) y ejecutarla al ser autorizada', async () => {
      const mockAutorizacionesRepo = {
        create: vi.fn().mockResolvedValue({
          id: 1,
          folio_solicitud: 'SOL-00001',
          tipo: 'REAPERTURA_CAJA',
          id_referencia: 50,
          id_usuario_solicita: 4,
          motivo: 'Se requiere cambio de etiqueta dañada',
          estado: 'PENDIENTE',
        }),
        getById: vi.fn().mockResolvedValue({
          id: 1,
          folio_solicitud: 'SOL-00001',
          tipo: 'REAPERTURA_CAJA',
          id_referencia: 50,
          estado: 'PENDIENTE',
          motivo: 'Se requiere cambio de etiqueta dañada',
        }),
        resolver: vi.fn().mockResolvedValue({
          id: 1,
          folio_solicitud: 'SOL-00001',
          estado: 'APROBADA',
        }),
      } as any;

      const mockCajasRepo = {
        reabrir: vi.fn().mockResolvedValue({ id: 50, estado: 'Abierta' }),
      } as any;

      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      } as any;

      const service = new AutorizacionesService(mockAutorizacionesRepo, mockCajasRepo, mockPool);

      const sol = await service.solicitar({
        tipo: 'REAPERTURA_CAJA',
        id_referencia: 50,
        id_usuario_solicita: 4,
        motivo: 'Se requiere cambio de etiqueta dañada',
      });
      expect(sol.ok).toBe(true);

      const res = await service.resolver(1, {
        estado: 'APROBADA',
        id_usuario_autoriza: 5, // Supervisor de almacén
        comentario_resolucion: 'Autorizado por Supervisor de almacén',
      });

      expect(res.ok).toBe(true);
      expect(mockCajasRepo.reabrir).toHaveBeenCalledWith(50, 5, 'Se requiere cambio de etiqueta dañada', 1);
    });

    it('P-37 / RN-14: Debe tener los 9 roles oficiales y bloquear con 403 si un Operador intenta cerrar un turno', async () => {
      expect(Object.keys(RolesEnum)).toHaveLength(9);
      expect(Object.keys(MATRIZ_PERMISOS_ROLES)).toHaveLength(9);

      const middleware = requirePermission('TURNO_CERRAR');
      const req = {
        headers: { 'x-rol-id': String(RolesEnum.OPERADOR) },
        body: {},
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
