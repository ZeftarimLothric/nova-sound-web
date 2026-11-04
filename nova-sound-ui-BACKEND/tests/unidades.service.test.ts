import { describe, it, expect, vi } from 'vitest';
import { UnidadesService } from '../src/services/unidades.service.js';
import { EstadosCalidadEnum } from '../src/types/index.js';

describe('Pruebas Unitarias de Dictámenes de Calidad y Trazabilidad (UnidadesService)', () => {
  it('Debe rechazar con código 404 si la serie no existe al dictaminar', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue(null),
    } as any;

    const service = new UnidadesService(mockRepo);

    await expect(
      service.dictaminarCalidad({
        numero_serie: 'NS-INEXISTENTE',
        id_estado_calidad: EstadosCalidadEnum.APROBADA,
        id_usuario: 1,
      })
    ).rejects.toThrow('No se encontró ninguna unidad');
  });

  it('Violación de Calidad: No debe permitir dictaminar como APROBADA si alguna prueba funcional falló', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue({
        id: 1,
        numero_serie: 'NS-PRO-202610-0001',
        id_estado_calidad: null,
      }),
    } as any;

    const service = new UnidadesService(mockRepo);

    await expect(
      service.dictaminarCalidad({
        numero_serie: 'NS-PRO-202610-0001',
        id_estado_calidad: EstadosCalidadEnum.APROBADA,
        id_usuario: 1,
        pruebas: {
          valida_encendido: true,
          valida_audio: false, // Falló audio
          valida_carga: true,
          valida_bluetooth: true,
        },
      })
    ).rejects.toThrow('No se puede aprobar una unidad con pruebas funcionales reprobadas');
  });

  it('Debe registrar la inspección formal y actualizar el estado cuando se dictamina', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue({
        id: 10,
        numero_serie: 'NS-PRO-202610-0010',
        id_estado_calidad: null,
      }),
      insertInspeccion: vi.fn().mockResolvedValue(55),
      insertDefectoInspeccion: vi.fn().mockResolvedValue(undefined),
      updateEstadoCalidad: vi.fn().mockResolvedValue(undefined),
      insertHistorial: vi.fn().mockResolvedValue(undefined),
    } as any;

    const service = new UnidadesService(mockRepo);

    const res = await service.dictaminarCalidad({
      numero_serie: 'NS-PRO-202610-0010',
      id_estado_calidad: EstadosCalidadEnum.EN_RETENCION,
      id_usuario: 2,
      id_defectos: [1],
      comentarios: 'Retenida por sospecha en lote de tornillos',
    });

    expect(res.ok).toBe(true);
    expect(res.estado_nuevo).toBe('En retención');
    expect(mockRepo.insertInspeccion).toHaveBeenCalledWith({
      id_unidad: 10,
      id_inspector: 2,
      id_estado_resultado: EstadosCalidadEnum.EN_RETENCION,
      comentarios: 'Retenida por sospecha en lote de tornillos',
    });
    expect(mockRepo.insertDefectoInspeccion).toHaveBeenCalledWith(55, 1);
    expect(mockRepo.updateEstadoCalidad).toHaveBeenCalledWith(10, EstadosCalidadEnum.EN_RETENCION);
  });

  it('RF-25: Consulta de trazabilidad debe retornar el árbol genealógico completo de la pieza', async () => {
    const mockRepo = {
      getTrazabilidadCompleta: vi.fn().mockResolvedValue({
        unidad: { numero_serie: 'NS-PRO-202610-0001', nombre_modelo: 'NS-PRO' },
        prueba_funcional: { estado_prueba: 'Aprobada' },
        inspecciones_calidad: [{ resultado_disposicion: 'Aprobada' }],
        empaque: [{ codigo_caja: 'BOX-00001' }],
        embarque: { referencia_embarque: 'EMB-001' },
      }),
    } as any;

    const service = new UnidadesService(mockRepo);
    const trazabilidad = await service.getTrazabilidad('NS-PRO-202610-0001');

    expect(trazabilidad).toBeDefined();
    expect(trazabilidad.unidad.numero_serie).toBe('NS-PRO-202610-0001');
    expect(trazabilidad.embarque.referencia_embarque).toBe('EMB-001');
  });
});
