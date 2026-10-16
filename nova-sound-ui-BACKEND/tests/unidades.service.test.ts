import { describe, it, expect, vi } from 'vitest';
import { UnidadesService } from '../src/services/unidades.service.js';
import { EstadosCalidadEnum } from '../src/types/index.js';

describe('Pruebas Unitarias de Reglas de Calidad (UnidadesService)', () => {
  it('Debe registrar una unidad correctamente si el número de serie es nuevo', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue(null),
      insertUnidad: vi.fn().mockImplementation((data) =>
        Promise.resolve({ id: 101, ...data, fecha_ensamble: '2026-10-15' })
      ),
    } as any;

    const service = new UnidadesService(mockRepo);
    const resultado = await service.registrarEnsamble({
      numero_serie: 'UN-9999',
      id_linea: 1,
      id_turno: 1,
    });

    expect(mockRepo.findByNumeroSerie).toHaveBeenCalledWith('UN-9999');
    expect(mockRepo.insertUnidad).toHaveBeenCalled();
    expect(resultado.numero_serie).toBe('UN-9999');
    expect(resultado.id_estado_calidad).toBeNull(); // null = Pendiente de Calidad
  });

  it('Debe rechazar con código 409 si se intenta registrar un número de serie duplicado', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue({ id: 1, numero_serie: 'UN-0001' }),
    } as any;

    const service = new UnidadesService(mockRepo);

    await expect(
      service.registrarEnsamble({ numero_serie: 'UN-0001' })
    ).rejects.toThrow('ya fue registrada previamente');
  });

  it('Violación de Calidad: No debe permitir dictaminar como APROBADA si falla una prueba de audio', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue({
        id: 1,
        numero_serie: 'UN-0025',
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_estado_calidad: 0,
      }),
      insertPruebaFuncional: vi.fn(),
      updateEstadoCalidad: vi.fn(),
      insertHistorial: vi.fn(),
    } as any;

    const service = new UnidadesService(mockRepo);

    await expect(
      service.dictaminarCalidad({
        numero_serie: 'UN-0025',
        id_estado_calidad: EstadosCalidadEnum.APROBADA,
        id_usuario: 1,
        pruebas: {
          valida_encendido: true,
          valida_audio: false, // ¡Audio falló!
          valida_carga: true,
          valida_bluetooth: true,
        },
        motivo: 'Intento de aprobación indebida',
      })
    ).rejects.toThrow('Violación de calidad: No se puede aprobar una unidad con pruebas funcionales reprobadas.');
  });

  it('Debe dictaminar exitosamente como APROBADA si todas las pruebas funcionales pasaron', async () => {
    const mockRepo = {
      findByNumeroSerie: vi.fn().mockResolvedValue({
        id: 1,
        numero_serie: 'UN-0025',
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_estado_calidad: 0,
      }),
      insertPruebaFuncional: vi.fn().mockResolvedValue(undefined),
      updateEstadoCalidad: vi.fn().mockResolvedValue(undefined),
      insertHistorial: vi.fn().mockResolvedValue(undefined),
    } as any;

    const service = new UnidadesService(mockRepo);

    const res = await service.dictaminarCalidad({
      numero_serie: 'UN-0025',
      id_estado_calidad: EstadosCalidadEnum.APROBADA,
      id_usuario: 1,
      pruebas: {
        valida_encendido: true,
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: true,
      },
      motivo: 'Todo OK',
    });

    expect(res.ok).toBe(true);
    expect(res.estado_nuevo).toBe('Aprobada');
    expect(mockRepo.updateEstadoCalidad).toHaveBeenCalledWith(1, EstadosCalidadEnum.APROBADA);
  });
});
