import { describe, it, expect, vi } from 'vitest';
import { PruebasService } from '../src/services/pruebas.service.js';

describe('Estación de Prueba Funcional y Emisión de Número de Serie (F-04, RN-04, RF-09, RF-10)', () => {
  const createMockPool = () => ({
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }),
  });

  it('Debe generar la serie única y crear la unidad si aprueba las 4 validaciones', async () => {
    const mockRepo = {
      generarSiguienteNumeroSerie: vi.fn().mockResolvedValue('NS-PRO-202610-0001'),
      registrarPrueba: vi.fn().mockResolvedValue({ id: 50, estado_prueba: 'Aprobada' }),
      crearUnidadDesdePrueba: vi.fn().mockResolvedValue({
        id: 200,
        numero_serie: 'NS-PRO-202610-0001',
        id_estado_calidad: 1,
      }),
    } as any;

    const mockOrdenesRepo = {
      getById: vi.fn().mockResolvedValue({
        id: 1,
        folio: 'ORD-001',
        nombre_modelo: 'NS-PRO',
      }),
    } as any;

    const mockPool = createMockPool();
    const service = new PruebasService(mockRepo, mockOrdenesRepo, mockPool);

    const resultado = await service.evaluarPrueba({
      id_orden: 1,
      id_linea: 1,
      id_turno: 1,
      id_operador: 2,
      valida_encendido: true,
      valida_audio: true,
      valida_carga: true,
      valida_bluetooth: true,
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.aprobado).toBe(true);
    expect(resultado.numero_serie).toBe('NS-PRO-202610-0001');
    expect(mockRepo.generarSiguienteNumeroSerie).toHaveBeenCalledWith('NS-PRO');
  });

  it('Debe rechazar la emisión de serie y registrar la falla en el catálogo si falla una validación', async () => {
    const mockRepo = {
      generarSiguienteNumeroSerie: vi.fn(),
      registrarPrueba: vi.fn().mockResolvedValue({ id: 51, estado_prueba: 'Reprobada' }),
      registrarDefectoPrueba: vi.fn().mockResolvedValue({ id: 88 }),
      crearUnidadDesdePrueba: vi.fn(),
    } as any;

    const mockOrdenesRepo = {
      getById: vi.fn().mockResolvedValue({
        id: 1,
        folio: 'ORD-001',
        nombre_modelo: 'NS-PRO',
      }),
    } as any;

    const mockPool = createMockPool();
    const service = new PruebasService(mockRepo, mockOrdenesRepo, mockPool);

    const resultado = await service.evaluarPrueba({
      id_orden: 1,
      id_linea: 1,
      id_turno: 1,
      id_operador: 2,
      valida_encendido: true,
      valida_audio: false, // ¡Falla de audio!
      valida_carga: true,
      valida_bluetooth: true,
      id_defecto: 6, // Distorsión de audio
      descripcion_defecto: 'Zumbido intermitente en canal derecho',
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.aprobado).toBe(false);
    expect(resultado.numero_serie).toBeNull(); // ¡Sin número de serie emitido!
    expect(mockRepo.generarSiguienteNumeroSerie).not.toHaveBeenCalled();
    expect(mockRepo.crearUnidadDesdePrueba).not.toHaveBeenCalled();
    expect(mockRepo.registrarDefectoPrueba).toHaveBeenCalled();
  });

  it('Debe exigir el ID de defecto si alguna prueba funcional es reprobada (RF-11)', async () => {
    const mockOrdenesRepo = {
      getById: vi.fn().mockResolvedValue({ id: 1, folio: 'ORD-001' }),
    } as any;

    const mockPool = createMockPool();
    const service = new PruebasService({} as any, mockOrdenesRepo, mockPool);

    await expect(
      service.evaluarPrueba({
        id_orden: 1,
        id_linea: 1,
        id_turno: 1,
        id_operador: 2,
        valida_encendido: false, // Falló encendido
        valida_audio: true,
        valida_carga: true,
        valida_bluetooth: true,
        // Sin id_defecto
      })
    ).rejects.toThrow('se debe especificar el defecto correspondiente del catálogo');
  });
});
