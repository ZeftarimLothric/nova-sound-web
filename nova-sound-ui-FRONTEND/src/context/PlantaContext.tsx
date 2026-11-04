import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  SesionOperativa,
  Usuario,
  Modelo,
  Color,
  Cliente,
  Linea,
  Turno,
  Transportista,
  CatalogoDefecto,
  CatalogoEstadoCalidad,
  ParametroSistema,
  Orden,
  ConteoEnsamble,
  DefectoEnsamble,
  PruebaFuncional,
  Unidad,
  InspeccionCalidad,
  HistorialUnidad,
  Caja,
  DetalleCaja,
  Embarque,
  CierreTurno,
  SolicitudAutorizacion,
  Bitacora,
} from '../types/database';
import { RolesEnum, EstadosCalidadEnum } from '../types/database';

const SESSION_STORAGE_KEY = 'nova_sound_endfield_session_v2';

// ==============================================================================
// 1. LOS 9 USUARIOS OFICIALES DEL CASO NOVA SOUND (P-37, BD-14, RNF-01c)
// ==============================================================================
export const USUARIOS_OFICIALES: Usuario[] = [
  { id: 1, nomina: 'NS-OP-001', nombre_completo: 'Carlos Hernández', usuario_login: 'operador_ns', id_rol: RolesEnum.OPERADOR, activo: true },
  { id: 2, nomina: 'NS-LD-001', nombre_completo: 'Roberto Mendoza', usuario_login: 'lider_ns', id_rol: RolesEnum.LIDER_LINEA, activo: true },
  { id: 3, nomina: 'NS-CA-001', nombre_completo: 'Juan Pérez', usuario_login: 'calidad_ns', id_rol: RolesEnum.INSPECTOR_CALIDAD, activo: true },
  { id: 4, nomina: 'NS-AL-001', nombre_completo: 'Lucía Gómez', usuario_login: 'almacen_ns', id_rol: RolesEnum.ALMACEN_EMPAQUE, activo: true },
  { id: 5, nomina: 'NS-SA-001', nombre_completo: 'Fernanda Gómez', usuario_login: 'sup_almacen_ns', id_rol: RolesEnum.SUPERVISOR_ALMACEN, activo: true },
  { id: 6, nomina: 'NS-SP-001', nombre_completo: 'Miguel Ángel Vega', usuario_login: 'subgerente_ns', id_rol: RolesEnum.SUBGERENTE_PRODUCCION, activo: true },
  { id: 7, nomina: 'NS-GP-001', nombre_completo: 'Eduardo Díaz', usuario_login: 'gerente_prod_ns', id_rol: RolesEnum.GERENTE_PRODUCCION, activo: true },
  { id: 8, nomina: 'NS-PL-001', nombre_completo: 'Elena Torres', usuario_login: 'gerente_planta_ns', id_rol: RolesEnum.GERENTE_PLANTA, activo: true },
  { id: 9, nomina: 'NS-AD-001', nombre_completo: 'Marcela Juárez', usuario_login: 'admin_ns', id_rol: RolesEnum.ADMINISTRADOR, activo: true },
];

export const NOMBRES_ROLES: Record<number, string> = {
  1: 'Operador de Ensamble',
  2: 'Líder de Línea',
  3: 'Inspector de Calidad',
  4: 'Almacén / Empaque',
  5: 'Supervisor de Almacén',
  6: 'Subgerente de Producción',
  7: 'Gerente de Producción',
  8: 'Gerente de Planta',
  9: 'Administrador del Sistema',
};

// ==============================================================================
// 2. CATÁLOGOS BASE PRECARGADOS
// ==============================================================================
export const CATALOGO_MODELOS: Modelo[] = [
  { id: 1, nombre_modelo: 'NS-MINI', capacidad_caja: 12, descripcion: 'Altavoz portátil compacto (12 pzas/caja)' },
  { id: 2, nombre_modelo: 'NS-SPORT', capacidad_caja: 8, descripcion: 'Altavoz sumergible deportivo (8 pzas/caja)' },
  { id: 3, nombre_modelo: 'NS-PRO', capacidad_caja: 6, descripcion: 'Altavoz de alta fidelidad profesional (6 pzas/caja)' },
  { id: 4, nombre_modelo: 'NS-MAX', capacidad_caja: 4, descripcion: 'Altavoz industrial de máxima potencia (4 pzas/caja)' },
];

export const CATALOGO_COLORES: Color[] = [
  { id: 1, nombre_color: 'Negro' },
  { id: 2, nombre_color: 'Blanco' },
  { id: 3, nombre_color: 'Rojo' },
  { id: 4, nombre_color: 'Azul' },
  { id: 5, nombre_color: 'Verde' },
];

export const CATALOGO_CLIENTES: Cliente[] = [
  { id: 1, nombre_cliente: 'SoundCorp Retail', tipo_cliente: 'Cadena Comercial', permite_mezcla_colores: false, requiere_etiqueta: true, requisitos_empaque: 'Etiqueta especial y caja monocromática', activo: true },
  { id: 2, nombre_cliente: 'MegaAudio Distribución', tipo_cliente: 'Distribuidor', permite_mezcla_colores: true, requiere_etiqueta: false, requisitos_empaque: 'Permite mezcla de colores en la misma caja', activo: true },
  { id: 3, nombre_cliente: 'TechBeat Stores', tipo_cliente: 'Cadena Comercial', permite_mezcla_colores: false, requiere_etiqueta: true, requisitos_empaque: 'Cajas de un solo color con sello de seguridad', activo: true },
  { id: 4, nombre_cliente: 'ElectroMax Nacional', tipo_cliente: 'Cadena Comercial', permite_mezcla_colores: false, requiere_etiqueta: false, requisitos_empaque: 'Empaque estándar sin mezcla de colores', activo: true },
];

export const CATALOGO_LINEAS: Linea[] = [
  { id: 1, nombre_linea: 'L1', activa: true },
  { id: 2, nombre_linea: 'L2', activa: true },
  { id: 3, nombre_linea: 'L3', activa: true },
];

export const CATALOGO_TURNOS: Turno[] = [
  { id: 1, nombre_turno: 'Mañana', hora_inicio: '06:00', hora_fin: '14:00' },
  { id: 2, nombre_turno: 'Tarde', hora_inicio: '14:00', hora_fin: '22:00' },
];

export const CATALOGO_TRANSPORTISTAS: Transportista[] = [
  { id: 1, nombre: 'Transportes del Norte S.A.', rfc: 'TNO990101AAA', telefono: '8441234560', activo: true },
  { id: 2, nombre: 'Logística Rápida Bajío', rfc: 'LRB010203BBB', telefono: '8441234561', activo: true },
];

export const CATALOGO_ESTADOS_CALIDAD: CatalogoEstadoCalidad[] = [
  { id: 1, nombre_estado: 'Aprobada', permite_empaque: true },
  { id: 2, nombre_estado: 'En retrabajo', permite_empaque: false },
  { id: 3, nombre_estado: 'En retención', permite_empaque: false },
  { id: 4, nombre_estado: 'Scrap', permite_empaque: false },
];

export const CATALOGO_DEFECTOS_OFICIALES: CatalogoDefecto[] = [
  // Apariencia
  { id: 1, categoria: 'Apariencia', descripcion: 'Rayón superficial en carcasa plástica', severidad: 'Menor' },
  { id: 2, categoria: 'Apariencia', descripcion: 'Fisura visible o carcasa mal cerrada', severidad: 'Crítico' },
  { id: 3, categoria: 'Apariencia', descripcion: 'Tonalidad de color desigual o incorrecto', severidad: 'Mayor' },
  { id: 4, categoria: 'Apariencia', descripcion: 'Golpe o abolladura en rejilla frontal', severidad: 'Mayor' },
  // Funcional
  { id: 5, categoria: 'Funcional', descripcion: 'No enciende / falla en circuito de alimentación', severidad: 'Crítico' },
  { id: 6, categoria: 'Funcional', descripcion: 'Distorsión de audio o zumbido en altavoz', severidad: 'Crítico' },
  { id: 7, categoria: 'Funcional', descripcion: 'No carga / falla en puerto de carga USB', severidad: 'Mayor' },
  { id: 8, categoria: 'Funcional', descripcion: 'Falla de conexión o sincronización Bluetooth', severidad: 'Mayor' },
  { id: 9, categoria: 'Funcional', descripcion: 'Botón flojo o sin respuesta mecánica', severidad: 'Mayor' },
  // Identificación
  { id: 10, categoria: 'Identificación', descripcion: 'Etiqueta equivocada del cliente', severidad: 'Mayor' },
  { id: 11, categoria: 'Identificación', descripcion: 'Número de serie ilegible o mal impreso', severidad: 'Mayor' },
  { id: 12, categoria: 'Identificación', descripcion: 'Etiqueta de modelo incorrecto', severidad: 'Crítico' },
  // Empaque
  { id: 13, categoria: 'Empaque', descripcion: 'Accesorio o cable de carga faltante', severidad: 'Mayor' },
  { id: 14, categoria: 'Empaque', descripcion: 'Manual de usuario incorrecto o faltante', severidad: 'Menor' },
  { id: 15, categoria: 'Empaque', descripcion: 'Caja externa maltratada o sellos rotos', severidad: 'Mayor' },
];

// ==============================================================================
// INTERFAZ GLOBAL DEL CONTEXTO
// ==============================================================================
export interface PlantaContextType {
  // Sesión y Auth
  sesion: SesionOperativa;
  setSesion: React.Dispatch<React.SetStateAction<SesionOperativa>>;
  estaAutenticado: boolean;
  modoMantenimiento: boolean;
  mensajeMantenimiento: string;
  iniciarSesion: (login: string, contrasena: string, idLinea?: number, idTurno?: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarSesion: () => void;
  cambiarUsuarioSimulado: (idRol: number) => void;
  cambiarLineaSesion: (idLinea: number) => void;
  cambiarTurnoSesion: (idTurno: number) => void;

  // Órdenes de Producción (P-40)
  ordenes: Orden[];
  crearOrden: (folio: string, idCliente: number, idModelo: number, idColor: number, cantidad: number, fechaCompromiso: string) => { ok: boolean; error?: string };
  importarOrdenesCsv: (textoCsv: string) => { ok: boolean; importadas: number; error?: string };
  asignarLineaOrden: (idOrden: number, idLinea: number) => { ok: boolean; error?: string };

  // Ensamble (F-03, P-11..P-15)
  conteosEnsamble: ConteoEnsamble[];
  defectosEnsamble: DefectoEnsamble[];
  registrarConteoEnsamble: (idOrden: number, cantidad: number) => { ok: boolean; error?: string };
  registrarDefectoEnsamble: (idOrden: number, idDefecto: number, cantidad: number, observaciones?: string) => { ok: boolean; error?: string };

  // Pruebas Funcionales (F-04, P-41: Nacimiento oficial de la Serie)
  pruebasFuncionales: PruebaFuncional[];
  evaluarPruebaFuncional: (
    idOrden: number,
    checks: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    idDefectoFalla?: number
  ) => { ok: boolean; serieGenerada?: string; error?: string };

  // Calidad (F-05, F-06, P-16..P-20)
  unidades: Unidad[];
  inspeccionesCalidad: InspeccionCalidad[];
  historialUnidades: HistorialUnidad[];
  dictaminarCalidad: (
    numeroSerie: string,
    idEstadoCalidad: number,
    idDefecto?: number,
    comentarios?: string
  ) => { ok: boolean; error?: string };

  // Empaque y Cajas (F-08, F-09, P-21..P-25, Incidente B)
  cajas: Caja[];
  detallesCajas: DetalleCaja[];
  crearCaja: (idCliente: number, idModelo: number, idColor: number) => { ok: boolean; caja?: Caja; error?: string };
  empacarPorSerie: (numeroSerie: string, idCaja: number) => { ok: boolean; error?: string };
  cerrarCaja: (idCaja: number) => { ok: boolean; error?: string };
  solicitarReaperturaCaja: (idCaja: number, motivo: string) => { ok: boolean; error?: string };
  retirarUnidadCaja: (idCaja: number, numeroSerie: string, motivo: string) => { ok: boolean; error?: string };

  // Logística y Embarques (F-10, F-11, P-26..P-29, Incidente C)
  embarques: Embarque[];
  cajasAsignadasEmbarque: Record<number, number[]>; // idEmbarque -> [idCaja1, idCaja2]
  crearEmbarque: (
    idPedido: string,
    idCliente: number,
    idTransportista: number,
    nombreChofer: string,
    placasUnidad: string,
    fechaProgramada: string,
    observaciones?: string
  ) => { ok: boolean; embarque?: Embarque; error?: string };
  asignarCajaEmbarque: (idEmbarque: number, idCaja: number) => { ok: boolean; error?: string };
  retirarCajaEmbarque: (idEmbarque: number, idCaja: number) => { ok: boolean; error?: string };
  despacharEmbarque: (idEmbarque: number) => { ok: boolean; error?: string };

  // Trazabilidad 360° (P-42)
  buscarTrazabilidad: (numeroSerie: string) => {
    unidad?: Unidad;
    orden?: Orden;
    prueba?: PruebaFuncional;
    inspecciones: InspeccionCalidad[];
    historial: HistorialUnidad[];
    caja?: Caja;
    embarque?: Embarque;
  } | null;

  // Cierres de Turno y Balance (F-12, P-35, P-43, INC-A, INC-D)
  cierresTurno: CierreTurno[];
  consolidarCierreTurno: (observaciones?: string) => { ok: boolean; cierre?: CierreTurno; error?: string };
  solicitarCorreccionCierre: (idCierre: number, motivo: string) => { ok: boolean; error?: string };
  solicitudesAutorizacion: SolicitudAutorizacion[];
  resolverAutorizacion: (idSolicitud: number, accion: 'APROBADA' | 'RECHAZADA', comentarios?: string) => { ok: boolean; error?: string };

  // Configuración & Sistemas (P-36..P-39)
  parametros: ParametroSistema[];
  setModoMantenimiento: (activo: boolean, mensaje?: string) => void;
  bitacora: Bitacora[];
  registrarBitacora: (modulo: string, accion: string, motivo?: string) => void;
}

const PlantaContext = createContext<PlantaContextType | undefined>(undefined);

// ==============================================================================
// PROVIDER DE PLANTA
// ==============================================================================
export const PlantaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. SESIÓN OPERATIVA INICIAL
  const [sesion, setSesion] = useState<SesionOperativa>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      usuario: USUARIOS_OFICIALES[8], // Admin por defecto (Marcela Juárez)
      linea: CATALOGO_LINEAS[0],
      turno: CATALOGO_TURNOS[0],
    };
  });

  const [estaAutenticado, setEstaAutenticado] = useState<boolean>(true);
  const [modoMantenimiento, setModoMantenimientoState] = useState<boolean>(false);
  const [mensajeMantenimiento, setMensajeMantenimiento] = useState<string>('Operación estándar de planta activa');

  // 2. ESTADO DE ÓRDENES
  const [ordenes, setOrdenes] = useState<Orden[]>([
    {
      id: 1,
      folio: 'ORD-2026-101',
      id_cliente: 1,
      cliente_nombre: 'SoundCorp Retail',
      id_modelo: 3,
      modelo_nombre: 'NS-PRO',
      id_color: 1,
      color_nombre: 'Negro',
      cantidad: 120,
      fecha_compromiso: '2026-11-10',
      fecha_recepcion: '2026-11-01',
      id_usuario_registro: 9,
      estado: 'En Producción',
      id_linea_asignada: 1,
      linea_nombre: 'L1',
      id_usuario_asigno: 6,
      fecha_asignacion: '2026-11-02 08:00',
      piezas_ensambladas: 48,
      piezas_aprobadas: 42,
    },
    {
      id: 2,
      folio: 'ORD-2026-102',
      id_cliente: 2,
      cliente_nombre: 'MegaAudio Distribución',
      id_modelo: 2,
      modelo_nombre: 'NS-SPORT',
      id_color: 4,
      color_nombre: 'Azul',
      cantidad: 80,
      fecha_compromiso: '2026-11-12',
      fecha_recepcion: '2026-11-02',
      id_usuario_registro: 9,
      estado: 'Asignada',
      id_linea_asignada: 2,
      linea_nombre: 'L2',
      id_usuario_asigno: 6,
      fecha_asignacion: '2026-11-03 09:30',
      piezas_ensambladas: 24,
      piezas_aprobadas: 20,
    },
    {
      id: 3,
      folio: 'ORD-2026-103',
      id_cliente: 3,
      cliente_nombre: 'TechBeat Stores',
      id_modelo: 1,
      modelo_nombre: 'NS-MINI',
      id_color: 2,
      color_nombre: 'Blanco',
      cantidad: 240,
      fecha_compromiso: '2026-11-15',
      fecha_recepcion: '2026-11-03',
      id_usuario_registro: 9,
      estado: 'Pendiente',
      id_linea_asignada: null,
      linea_nombre: null,
      id_usuario_asigno: null,
      fecha_asignacion: null,
      piezas_ensambladas: 0,
      piezas_aprobadas: 0,
    },
  ]);

  // 3. ENSAMBLE & DEFECTOS
  const [conteosEnsamble, setConteosEnsamble] = useState<ConteoEnsamble[]>([
    { id: 1, id_orden: 1, id_linea: 1, id_turno: 1, id_operador: 1, cantidad: 28, fecha_hora: '2026-11-04 07:45:00' },
    { id: 2, id_orden: 1, id_linea: 1, id_turno: 1, id_operador: 1, cantidad: 20, fecha_hora: '2026-11-04 10:15:00' },
  ]);

  const [defectosEnsamble, setDefectosEnsamble] = useState<DefectoEnsamble[]>([
    { id: 1, id_orden: 1, id_linea: 1, id_turno: 1, id_operador: 1, id_defecto: 1, defecto_descripcion: 'Rayón superficial en carcasa plástica', cantidad: 2, observaciones: 'Fricción en tornamesa', fecha_hora: '2026-11-04 08:30:00' },
  ]);

  // 4. PRUEBAS FUNCIONALES (Nacimiento de serie)
  const [pruebasFuncionales, setPruebasFuncionales] = useState<PruebaFuncional[]>([
    { id: 1, id_orden: 1, id_linea: 1, id_turno: 1, id_usuario: 1, valida_encendido: true, valida_audio: true, valida_carga: true, valida_bluetooth: true, aprobada: true, numero_serie: 'NS-2026-0001', fecha_hora: '2026-11-04 08:00:15' },
    { id: 2, id_orden: 1, id_linea: 1, id_turno: 1, id_usuario: 1, valida_encendido: true, valida_audio: true, valida_carga: true, valida_bluetooth: true, aprobada: true, numero_serie: 'NS-2026-0002', fecha_hora: '2026-11-04 08:05:22' },
    { id: 3, id_orden: 1, id_linea: 1, id_turno: 1, id_usuario: 1, valida_encendido: true, valida_audio: false, valida_carga: true, valida_bluetooth: true, aprobada: false, numero_serie: null, id_defecto_falla: 6, defecto_falla: 'Distorsión de audio o zumbido en altavoz', fecha_hora: '2026-11-04 08:12:00' },
  ]);

  // 5. UNIDADES & CALIDAD
  const [unidades, setUnidades] = useState<Unidad[]>([
    { id: 1, id_orden: 1, id_linea: 1, id_turno: 1, numero_serie: 'NS-2026-0001', id_estado_calidad: EstadosCalidadEnum.APROBADA, estado_calidad_nombre: 'Aprobada', id_caja: 1, fecha_ensamble: '2026-11-04 08:00', modelo: 'NS-PRO', color: 'Negro', cliente: 'SoundCorp Retail', id_prueba_funcional: 1 },
    { id: 2, id_orden: 1, id_linea: 1, id_turno: 1, numero_serie: 'NS-2026-0002', id_estado_calidad: EstadosCalidadEnum.APROBADA, estado_calidad_nombre: 'Aprobada', id_caja: 1, fecha_ensamble: '2026-11-04 08:05', modelo: 'NS-PRO', color: 'Negro', cliente: 'SoundCorp Retail', id_prueba_funcional: 2 },
    { id: 3, id_orden: 1, id_linea: 1, id_turno: 1, numero_serie: 'NS-2026-0003', id_estado_calidad: EstadosCalidadEnum.EN_RETENCION, estado_calidad_nombre: 'En retención', id_caja: null, fecha_ensamble: '2026-11-04 08:20', modelo: 'NS-PRO', color: 'Negro', cliente: 'SoundCorp Retail', id_prueba_funcional: 4 },
  ]);

  const [inspeccionesCalidad, setInspeccionesCalidad] = useState<InspeccionCalidad[]>([
    { id: 1, id_unidad: 1, numero_serie: 'NS-2026-0001', id_inspector: 3, inspector_nombre: 'Juan Pérez', id_estado_resultado: 1, estado_resultado_nombre: 'Aprobada', comentarios: 'Inspección cosmética y acústica conforme', fecha_inspeccion: '2026-11-04 08:10' },
    { id: 2, id_unidad: 2, numero_serie: 'NS-2026-0002', id_inspector: 3, inspector_nombre: 'Juan Pérez', id_estado_resultado: 1, estado_resultado_nombre: 'Aprobada', comentarios: 'Conforme para empaque', fecha_inspeccion: '2026-11-04 08:15' },
    { id: 3, id_unidad: 3, numero_serie: 'NS-2026-0003', id_inspector: 3, inspector_nombre: 'Juan Pérez', id_estado_resultado: 3, estado_resultado_nombre: 'En retención', id_defecto: 4, defecto_descripcion: 'Golpe o abolladura en rejilla frontal', comentarios: 'Retenida por sospecha de lote golpeado', fecha_inspeccion: '2026-11-04 08:25' },
  ]);

  const [historialUnidades, setHistorialUnidades] = useState<HistorialUnidad[]>([
    { id: 1, id_unidad: 1, numero_serie: 'NS-2026-0001', id_usuario: 3, usuario_nombre: 'Juan Pérez', estado_anterior: 'Pendiente', estado_nuevo: 'Aprobada', motivo: 'Inspección de calidad aprobada', fecha_hora: '2026-11-04 08:10' },
    { id: 2, id_unidad: 2, numero_serie: 'NS-2026-0002', id_usuario: 3, usuario_nombre: 'Juan Pérez', estado_anterior: 'Pendiente', estado_nuevo: 'Aprobada', motivo: 'Inspección de calidad aprobada', fecha_hora: '2026-11-04 08:15' },
    { id: 3, id_unidad: 3, numero_serie: 'NS-2026-0003', id_usuario: 3, usuario_nombre: 'Juan Pérez', estado_anterior: 'Pendiente', estado_nuevo: 'En retención', motivo: 'Rejilla frontal golpeada (Incidente C prevención)', fecha_hora: '2026-11-04 08:25' },
  ]);

  // 6. CAJAS Y DETALLES DE EMPAQUE (P-21..P-25)
  const [cajas, setCajas] = useState<Caja[]>([
    {
      id: 1,
      codigo_caja: 'BX-2026-001',
      id_cliente: 1,
      cliente_nombre: 'SoundCorp Retail',
      id_modelo: 3,
      modelo_nombre: 'NS-PRO',
      id_color: 1,
      color_nombre: 'Negro',
      capacidad: 6,
      piezas_actuales: 2,
      fecha_creacion: '2026-11-04 08:30:00',
      fecha_cierre: null,
      estado: 'Abierta',
      id_usuario_creador: 4,
    },
    {
      id: 2,
      codigo_caja: 'BX-2026-002',
      id_cliente: 1,
      cliente_nombre: 'SoundCorp Retail',
      id_modelo: 3,
      modelo_nombre: 'NS-PRO',
      id_color: 1,
      color_nombre: 'Negro',
      capacidad: 6,
      piezas_actuales: 6,
      fecha_creacion: '2026-11-03 14:00:00',
      fecha_cierre: '2026-11-03 17:30:00',
      estado: 'Cerrada',
      id_usuario_creador: 4,
      id_usuario_cerro: 4,
      id_embarque_asignado: 1,
    },
  ]);

  const [detallesCajas, setDetallesCajas] = useState<DetalleCaja[]>([
    { id: 1, id_caja: 1, id_unidad: 1, numero_serie: 'NS-2026-0001', slot: 1, fecha_empaque: '2026-11-04 08:35', id_usuario_empaco: 4, retirada: false },
    { id: 2, id_caja: 1, id_unidad: 2, numero_serie: 'NS-2026-0002', slot: 2, fecha_empaque: '2026-11-04 08:36', id_usuario_empaco: 4, retirada: false },
  ]);

  // 7. EMBARQUES (P-26..P-29)
  const [embarques, setEmbarques] = useState<Embarque[]>([
    {
      id: 1,
      referencia_embarque: 'EMB-2026-089',
      id_pedido: 'PED-SC-901',
      id_cliente: 1,
      cliente_nombre: 'SoundCorp Retail',
      id_transportista: 1,
      transportista_nombre: 'Transportes del Norte S.A.',
      nombre_chofer: 'Ramiro Valdés',
      placas_unidad: 'NL-884-TX',
      fecha_programada: '2026-11-04 15:00',
      fecha_salida: null,
      estado: 'Preparación',
      observaciones: 'Entregar en andén 4 con sello inviolable',
      id_usuario_creo: 4,
      id_usuario_confirmo: null,
      fecha_creacion: '2026-11-04 09:00',
      total_cajas: 1,
      total_piezas: 6,
    },
  ]);

  const [cajasAsignadasEmbarque, setCajasAsignadasEmbarque] = useState<Record<number, number[]>>({
    1: [2],
  });

  // 8. CIERRES DE TURNO Y GOBERNANZA (P-35, P-43, INC-A, INC-D)
  const [cierresTurno, setCierresTurno] = useState<CierreTurno[]>([
    {
      id: 1,
      fecha: '2026-11-03',
      id_turno: 1,
      turno_nombre: 'Mañana',
      id_linea: 1,
      linea_nombre: 'L1',
      id_lider_linea: 2,
      lider_nombre: 'Roberto Mendoza',
      piezas_ensambladas: 102,
      piezas_probadas: 98,
      piezas_aprobadas_calidad: 95,
      piezas_retrabajo: 2,
      piezas_retencion: 1,
      piezas_scrap: 2,
      piezas_empacadas: 90,
      piezas_embarcadas: 90,
      diferencia_balance: 0,
      objetivo_turno: 100,
      cumplimiento_pct: 102,
      estado: 'Cerrado',
      observaciones: 'Turno operó con rendimiento nominal',
      fecha_cierre: '2026-11-03 14:12:00',
    },
  ]);

  const [solicitudesAutorizacion, setSolicitudesAutorizacion] = useState<SolicitudAutorizacion[]>([
    {
      id: 1,
      tipo: 'REAPERTURA_CAJA',
      id_entidad: 2,
      descripcion_entidad: 'Caja BX-2026-002',
      motivo: 'Verificación de accesorio de cable de carga solicitado por auditoría',
      id_usuario_solicita: 4,
      usuario_solicita_nombre: 'Lucía Gómez (Almacén)',
      estado: 'PENDIENTE',
      fecha_solicitud: '2026-11-04 09:30',
    },
  ]);

  // 9. PARÁMETROS Y BITÁCORA
  const [parametros, setParametros] = useState<ParametroSistema[]>([
    { id: 1, clave: 'SISTEMA_MODO_MANTENIMIENTO', valor: false, tipo_dato: 'BOOLEAN', descripcion: 'Activa aviso de mantenimiento en toda la planta' },
    { id: 2, clave: 'MENSAJE_MANTENIMIENTO', valor: 'Operación estándar de planta activa', tipo_dato: 'STRING', descripcion: 'Mensaje visible en encabezados' },
    { id: 3, clave: 'POLITICA_RETENCION_ANOS', valor: 2, tipo_dato: 'INT', descripcion: 'Años mínimos de conservación de trazabilidad e histórico' },
  ]);

  const [bitacora, setBitacora] = useState<Bitacora[]>([
    { id: 1, fecha: '2026-11-04 06:00:00', id_usuario: 9, usuario_nombre: 'Marcela Juárez', modulo: 'SISTEMA', accion: 'INICIO_SCADA', motivo: 'Apertura de turno de manufactura' },
  ]);

  // Sincronizar sesión con LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion));
    } catch {}
  }, [sesion]);

  // MÉTODOS DE AUTENTICACIÓN Y SESIÓN
  const iniciarSesion = async (login: string, _contrasena: string, idLinea = 1, idTurno = 1) => {
    const usuarioEncontrado = USUARIOS_OFICIALES.find((u) => u.usuario_login.toLowerCase() === login.toLowerCase()) || USUARIOS_OFICIALES[8];
    const lineaObj = CATALOGO_LINEAS.find((l) => l.id === idLinea) || CATALOGO_LINEAS[0];
    const turnoObj = CATALOGO_TURNOS.find((t) => t.id === idTurno) || CATALOGO_TURNOS[0];

    const nuevaSesion: SesionOperativa = {
      usuario: usuarioEncontrado,
      linea: lineaObj,
      turno: turnoObj,
    };
    setSesion(nuevaSesion);
    setEstaAutenticado(true);
    registrarBitacora('AUTH', `LOGIN_EXITOSO: ${usuarioEncontrado.nombre_completo}`);
    return { ok: true };
  };

  const cerrarSesion = () => {
    setEstaAutenticado(false);
  };

  const cambiarUsuarioSimulado = (idRol: number) => {
    const usuario = USUARIOS_OFICIALES.find((u) => u.id_rol === idRol) || USUARIOS_OFICIALES[0];
    setSesion((prev) => ({
      ...prev,
      usuario,
    }));
    registrarBitacora('SIMULACION', `CAMBIO_ROL: ${usuario.nombre_completo} [Rol ${idRol}]`);
  };

  const cambiarLineaSesion = (idLinea: number) => {
    const linea = CATALOGO_LINEAS.find((l) => l.id === idLinea) || CATALOGO_LINEAS[0];
    setSesion((prev) => ({ ...prev, linea }));
  };

  const cambiarTurnoSesion = (idTurno: number) => {
    const turno = CATALOGO_TURNOS.find((t) => t.id === idTurno) || CATALOGO_TURNOS[0];
    setSesion((prev) => ({ ...prev, turno }));
  };

  const setModoMantenimiento = (activo: boolean, mensaje?: string) => {
    setModoMantenimientoState(activo);
    if (mensaje) setMensajeMantenimiento(mensaje);
    setParametros((prev) =>
      prev.map((p) =>
        p.clave === 'SISTEMA_MODO_MANTENIMIENTO'
          ? { ...p, valor: activo }
          : p.clave === 'MENSAJE_MANTENIMIENTO' && mensaje
          ? { ...p, valor: mensaje }
          : p
      )
    );
    registrarBitacora('SISTEMA', activo ? 'MODO_MANTENIMIENTO_ACTIVADO' : 'MODO_MANTENIMIENTO_DESACTIVADO', mensaje);
  };

  const registrarBitacora = (modulo: string, accion: string, motivo?: string) => {
    const nuevaEntrada: Bitacora = {
      id: bitacora.length + 1,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      id_usuario: sesion.usuario.id,
      usuario_nombre: sesion.usuario.nombre_completo,
      modulo,
      accion,
      motivo,
    };
    setBitacora((prev) => [nuevaEntrada, ...prev]);
  };

  // ==============================================================================
  // MÓDULO 1: ÓRDENES DE PRODUCCIÓN (P-40, F-01, F-02)
  // ==============================================================================
  const crearOrden = (folio: string, idCliente: number, idModelo: number, idColor: number, cantidad: number, fechaCompromiso: string) => {
    if (!folio || cantidad <= 0) return { ok: false, error: 'Folio y cantidad mayor a cero requeridos' };
    const cliente = CATALOGO_CLIENTES.find((c) => c.id === idCliente);
    const modelo = CATALOGO_MODELOS.find((m) => m.id === idModelo);
    const color = CATALOGO_COLORES.find((c) => c.id === idColor);

    const nueva: Orden = {
      id: ordenes.length + 1,
      folio,
      id_cliente: idCliente,
      cliente_nombre: cliente?.nombre_cliente || 'Cliente',
      id_modelo: idModelo,
      modelo_nombre: modelo?.nombre_modelo || 'Modelo',
      id_color: idColor,
      color_nombre: color?.nombre_color || 'Color',
      cantidad,
      fecha_compromiso: fechaCompromiso || '2026-11-20',
      fecha_recepcion: new Date().toISOString().substring(0, 10),
      id_usuario_registro: sesion.usuario.id,
      estado: 'Pendiente',
      id_linea_asignada: null,
      linea_nombre: null,
      id_usuario_asigno: null,
      fecha_asignacion: null,
      piezas_ensambladas: 0,
      piezas_aprobadas: 0,
    };
    setOrdenes((prev) => [nueva, ...prev]);
    registrarBitacora('ORDENES', `CREAR_ORDEN: Folio ${folio} (${cantidad} pzas)`, `Cliente: ${cliente?.nombre_cliente}`);
    return { ok: true };
  };

  const importarOrdenesCsv = (textoCsv: string) => {
    try {
      const lineas = textoCsv.trim().split('\n');
      let count = 0;
      const nuevas: Orden[] = [];
      for (const line of lineas) {
        if (!line || line.startsWith('folio') || line.startsWith('FOLIO')) continue;
        const [folio, modeloNombre, colorNombre, clienteNombre, cantStr, compromiso] = line.split(',').map((s) => s.trim());
        if (!folio || !cantStr) continue;
        const modelo = CATALOGO_MODELOS.find((m) => m.nombre_modelo.toLowerCase() === (modeloNombre || '').toLowerCase()) || CATALOGO_MODELOS[0];
        const color = CATALOGO_COLORES.find((c) => c.nombre_color.toLowerCase() === (colorNombre || '').toLowerCase()) || CATALOGO_COLORES[0];
        const cliente = CATALOGO_CLIENTES.find((c) => c.nombre_cliente.toLowerCase().includes((clienteNombre || '').toLowerCase())) || CATALOGO_CLIENTES[0];

        nuevas.push({
          id: ordenes.length + count + 1,
          folio,
          id_cliente: cliente.id,
          cliente_nombre: cliente.nombre_cliente,
          id_modelo: modelo.id,
          modelo_nombre: modelo.nombre_modelo,
          id_color: color.id,
          color_nombre: color.nombre_color,
          cantidad: parseInt(cantStr, 10) || 50,
          fecha_compromiso: compromiso || '2026-11-30',
          fecha_recepcion: new Date().toISOString().substring(0, 10),
          id_usuario_registro: sesion.usuario.id,
          estado: 'Pendiente',
          id_linea_asignada: null,
          linea_nombre: null,
          id_usuario_asigno: null,
          fecha_asignacion: null,
          piezas_ensambladas: 0,
          piezas_aprobadas: 0,
        });
        count++;
      }
      setOrdenes((prev) => [...nuevas, ...prev]);
      registrarBitacora('ORDENES', `IMPORTAR_CSV: ${count} órdenes cargadas masivamente`);
      return { ok: true, importadas: count };
    } catch {
      return { ok: false, importadas: 0, error: 'Error al procesar el archivo CSV' };
    }
  };

  const asignarLineaOrden = (idOrden: number, idLinea: number) => {
    const linea = CATALOGO_LINEAS.find((l) => l.id === idLinea);
    if (!linea) return { ok: false, error: 'Línea no válida' };
    setOrdenes((prev) =>
      prev.map((ord) =>
        ord.id === idOrden
          ? {
              ...ord,
              id_linea_asignada: idLinea,
              linea_nombre: linea.nombre_linea,
              id_usuario_asigno: sesion.usuario.id,
              fecha_asignacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
              estado: 'Asignada',
            }
          : ord
      )
    );
    registrarBitacora('ORDENES', `ASIGNAR_LINEA: Orden #${idOrden} -> Línea ${linea.nombre_linea}`);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 2: ENSAMBLE (F-03, P-11..P-14: Conteo sin serie)
  // ==============================================================================
  const registrarConteoEnsamble = (idOrden: number, cantidad: number) => {
    if (cantidad <= 0) return { ok: false, error: 'Cantidad inválida para registro de ensamble' };
    const orden = ordenes.find((o) => o.id === idOrden);
    if (!orden) return { ok: false, error: 'Orden no encontrada' };

    const nuevoConteo: ConteoEnsamble = {
      id: conteosEnsamble.length + 1,
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_operador: sesion.usuario.id,
      cantidad,
      fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setConteosEnsamble((prev) => [nuevoConteo, ...prev]);

    setOrdenes((prev) =>
      prev.map((o) => (o.id === idOrden ? { ...o, piezas_ensambladas: (o.piezas_ensambladas || 0) + cantidad, estado: 'En Producción' } : o))
    );

    registrarBitacora('ENSAMBLE', `CONTEO_REGISTRADO: +${cantidad} pzas en Orden ${orden.folio} (Línea ${sesion.linea.nombre_linea})`);
    return { ok: true };
  };

  const registrarDefectoEnsamble = (idOrden: number, idDefecto: number, cantidad: number, observaciones?: string) => {
    const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefecto);
    const nuevoDefecto: DefectoEnsamble = {
      id: defectosEnsamble.length + 1,
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_operador: sesion.usuario.id,
      id_defecto: idDefecto,
      defecto_descripcion: def?.descripcion || 'Defecto de Ensamble',
      cantidad,
      observaciones,
      fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setDefectosEnsamble((prev) => [nuevoDefecto, ...prev]);
    registrarBitacora('ENSAMBLE', `DEFECTO_LINEA: ${def?.descripcion} (x${cantidad})`, observaciones);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 3: PRUEBA FUNCIONAL (F-04, P-41: Nacimiento de Serie Oficial)
  // ==============================================================================
  const evaluarPruebaFuncional = (
    idOrden: number,
    checks: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    idDefectoFalla?: number
  ) => {
    const orden = ordenes.find((o) => o.id === idOrden);
    if (!orden) return { ok: false, error: 'Orden no seleccionada para prueba funcional' };

    const todasAprobadas = checks.encendido && checks.audio && checks.carga && checks.bluetooth;
    let serieGenerada: string | null = null;

    if (todasAprobadas) {
      // NACE EL NÚMERO DE SERIE OFICIAL
      const numConsecutivo = (pruebasFuncionales.length + 1).toString().padStart(4, '0');
      serieGenerada = `NS-2026-${numConsecutivo}`;

      // Crear unidad automáticamente en estado inicial para Calidad
      const nuevaUnidad: Unidad = {
        id: unidades.length + 1,
        id_orden: idOrden,
        id_linea: sesion.linea.id,
        id_turno: sesion.turno.id,
        numero_serie: serieGenerada,
        id_estado_calidad: EstadosCalidadEnum.APROBADA, // Nace lista para validación de Calidad
        estado_calidad_nombre: 'Aprobada',
        id_caja: null, // Suelta en planta
        fecha_ensamble: new Date().toISOString().replace('T', ' ').substring(0, 16),
        modelo: orden.modelo_nombre,
        color: orden.color_nombre,
        cliente: orden.cliente_nombre,
        id_prueba_funcional: pruebasFuncionales.length + 1,
      };
      setUnidades((prev) => [nuevaUnidad, ...prev]);

      setOrdenes((prev) =>
        prev.map((o) => (o.id === idOrden ? { ...o, piezas_aprobadas: (o.piezas_aprobadas || 0) + 1 } : o))
      );
    }

    const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefectoFalla);
    const nuevaPrueba: PruebaFuncional = {
      id: pruebasFuncionales.length + 1,
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_usuario: sesion.usuario.id,
      valida_encendido: checks.encendido,
      valida_audio: checks.audio,
      valida_carga: checks.carga,
      valida_bluetooth: checks.bluetooth,
      aprobada: todasAprobadas,
      numero_serie: serieGenerada,
      id_defecto_falla: todasAprobadas ? null : idDefectoFalla,
      defecto_falla: todasAprobadas ? null : def?.descripcion || 'Falla funcional',
      fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setPruebasFuncionales((prev) => [nuevaPrueba, ...prev]);
    registrarBitacora(
      'PRUEBAS_FUNCIONALES',
      todasAprobadas ? `APROBADA_SERIE_EMITIDA: ${serieGenerada}` : `RECHAZADA_SIN_SERIE: ${def?.descripcion || 'Falla checks'}`,
      `Orden ${orden.folio}`
    );

    return { ok: true, serieGenerada: serieGenerada || undefined };
  };

  // ==============================================================================
  // MÓDULO 4: CALIDAD Y DISPOSICIÓN (F-05, F-06, P-16..P-20)
  // ==============================================================================
  const dictaminarCalidad = (numeroSerie: string, idEstadoCalidad: number, idDefecto?: number, comentarios?: string) => {
    const unidad = unidades.find((u) => u.numero_serie === numeroSerie);
    if (!unidad) return { ok: false, error: `Unidad serie ${numeroSerie} no localizada en el sistema` };

    const estadoObj = CATALOGO_ESTADOS_CALIDAD.find((e) => e.id === idEstadoCalidad);
    const defectoObj = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefecto);
    const estadoAnteriorNombre = unidad.estado_calidad_nombre || 'Desconocido';

    // Actualizar unidad
    setUnidades((prev) =>
      prev.map((u) =>
        u.numero_serie === numeroSerie
          ? {
              ...u,
              id_estado_calidad: idEstadoCalidad,
              estado_calidad_nombre: estadoObj?.nombre_estado || 'Aprobada',
            }
          : u
      )
    );

    // Registro de inspección
    const nuevaInspeccion: InspeccionCalidad = {
      id: inspeccionesCalidad.length + 1,
      id_unidad: unidad.id,
      numero_serie: numeroSerie,
      id_inspector: sesion.usuario.id,
      inspector_nombre: sesion.usuario.nombre_completo,
      id_estado_resultado: idEstadoCalidad,
      estado_resultado_nombre: estadoObj?.nombre_estado || 'Aprobada',
      id_defecto: idDefecto || null,
      defecto_descripcion: defectoObj?.descripcion || null,
      comentarios: comentarios || null,
      fecha_inspeccion: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setInspeccionesCalidad((prev) => [nuevaInspeccion, ...prev]);

    // Historial trazabilidad
    const nuevoHistorial: HistorialUnidad = {
      id: historialUnidades.length + 1,
      id_unidad: unidad.id,
      numero_serie: numeroSerie,
      id_usuario: sesion.usuario.id,
      usuario_nombre: sesion.usuario.nombre_completo,
      estado_anterior: estadoAnteriorNombre,
      estado_nuevo: estadoObj?.nombre_estado || 'Aprobada',
      motivo: comentarios || defectoObj?.descripcion || 'Dictamen de calidad registrado',
      fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setHistorialUnidades((prev) => [nuevoHistorial, ...prev]);

    registrarBitacora('CALIDAD', `DICTAMEN: Serie ${numeroSerie} -> ${estadoObj?.nombre_estado}`, comentarios);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 5: EMPAQUE Y CAJAS (F-08, F-09, P-21..P-25, Incidente B)
  // ==============================================================================
  const crearCaja = (idCliente: number, idModelo: number, idColor: number) => {
    const cliente = CATALOGO_CLIENTES.find((c) => c.id === idCliente);
    const modelo = CATALOGO_MODELOS.find((m) => m.id === idModelo);
    const color = CATALOGO_COLORES.find((c) => c.id === idColor);

    if (!cliente || !modelo || !color) {
      return { ok: false, error: 'Debe especificar Cliente, Modelo y Color para abrir una caja oficial' };
    }

    const nuevaCaja: Caja = {
      id: cajas.length + 1,
      codigo_caja: `BX-2026-${(cajas.length + 1).toString().padStart(3, '0')}`,
      id_cliente: idCliente,
      cliente_nombre: cliente.nombre_cliente,
      id_modelo: idModelo,
      modelo_nombre: modelo.nombre_modelo,
      id_color: idColor,
      color_nombre: color.nombre_color,
      capacidad: modelo.capacidad_caja, // Oficial según catálogo de modelos
      piezas_actuales: 0,
      fecha_creacion: new Date().toISOString().replace('T', ' ').substring(0, 19),
      fecha_cierre: null,
      estado: 'Abierta',
      id_usuario_creador: sesion.usuario.id,
    };

    setCajas((prev) => [nuevaCaja, ...prev]);
    registrarBitacora('EMPAQUE', `APERTURA_CAJA: ${nuevaCaja.codigo_caja} (${modelo.nombre_modelo} ${color.nombre_color} - Cap: ${modelo.capacidad_caja})`);
    return { ok: true, caja: nuevaCaja };
  };

  const empacarPorSerie = (numeroSerie: string, idCaja: number) => {
    const caja = cajas.find((c) => c.id === idCaja);
    if (!caja) return { ok: false, error: 'Caja no encontrada' };
    if (caja.estado === 'Cerrada') return { ok: false, error: `La caja ${caja.codigo_caja} está CERRADA y sellada.` };
    if ((caja.piezas_actuales || 0) >= caja.capacidad) return { ok: false, error: `La caja ${caja.codigo_caja} ha alcanzado su capacidad máxima (${caja.capacidad} piezas)` };

    const unidad = unidades.find((u) => u.numero_serie === numeroSerie);
    if (!unidad) return { ok: false, error: `La unidad con serie ${numeroSerie} no existe en planta` };

    // REGLA 1: Solo unidades en estado APROBADA
    if (unidad.id_estado_calidad !== EstadosCalidadEnum.APROBADA) {
      return {
        ok: false,
        error: `RECHAZO DE EMPAQUE: La unidad ${numeroSerie} está en estado "${unidad.estado_calidad_nombre}". Sólo unidades APROBADAS por Calidad pueden empacarse.`,
      };
    }

    // REGLA 2: No debe estar empacada en otra caja
    if (unidad.id_caja && unidad.id_caja !== idCaja) {
      return { ok: false, error: `La unidad ${numeroSerie} ya está asignada a otra caja (#${unidad.id_caja})` };
    }

    // REGLA 3: Incidente B (Concordancia de Modelo y Color del cliente)
    if (unidad.modelo && unidad.modelo !== caja.modelo_nombre) {
      return { ok: false, error: `INCIDENTE B PREVENIDO: La unidad es modelo ${unidad.modelo}, pero la caja es para ${caja.modelo_nombre}.` };
    }

    const cliente = CATALOGO_CLIENTES.find((c) => c.id === caja.id_cliente);
    if (cliente && !cliente.permite_mezcla_colores && unidad.color && unidad.color !== caja.color_nombre) {
      return { ok: false, error: `POLÍTICA DE CLIENTE: El cliente ${cliente.nombre_cliente} no permite mezcla de colores. La unidad es ${unidad.color} y la caja es ${caja.color_nombre}.` };
    }

    // Registrar en detalle de caja
    const nuevoSlot = (caja.piezas_actuales || 0) + 1;
    const nuevoDetalle: DetalleCaja = {
      id: detallesCajas.length + 1,
      id_caja: idCaja,
      id_unidad: unidad.id,
      numero_serie: numeroSerie,
      slot: nuevoSlot,
      fecha_empaque: new Date().toISOString().replace('T', ' ').substring(0, 16),
      id_usuario_empaco: sesion.usuario.id,
      retirada: false,
    };

    setDetallesCajas((prev) => [...prev, nuevoDetalle]);
    setCajas((prev) =>
      prev.map((c) => (c.id === idCaja ? { ...c, piezas_actuales: nuevoSlot } : c))
    );
    setUnidades((prev) =>
      prev.map((u) => (u.numero_serie === numeroSerie ? { ...u, id_caja: idCaja } : u))
    );

    registrarBitacora('EMPAQUE', `UNIDAD_EMPACADA: ${numeroSerie} -> ${caja.codigo_caja} [Slot ${nuevoSlot}/${caja.capacidad}]`);
    return { ok: true };
  };

  const cerrarCaja = (idCaja: number) => {
    const caja = cajas.find((c) => c.id === idCaja);
    if (!caja) return { ok: false, error: 'Caja no encontrada' };
    if ((caja.piezas_actuales || 0) === 0) return { ok: false, error: 'No se puede cerrar una caja vacía' };

    setCajas((prev) =>
      prev.map((c) =>
        c.id === idCaja
          ? {
              ...c,
              estado: 'Cerrada',
              fecha_cierre: new Date().toISOString().replace('T', ' ').substring(0, 19),
              id_usuario_cerro: sesion.usuario.id,
            }
          : c
      )
    );
    registrarBitacora('EMPAQUE', `CAJA_CERRADA_SELLADA: ${caja.codigo_caja} con ${caja.piezas_actuales} unidades`);
    return { ok: true };
  };

  const solicitarReaperturaCaja = (idCaja: number, motivo: string) => {
    const caja = cajas.find((c) => c.id === idCaja);
    if (!caja) return { ok: false, error: 'Caja no encontrada' };
    if (!motivo) return { ok: false, error: 'Debe especificar el motivo para solicitar reapertura de caja' };

    const nuevaSol: SolicitudAutorizacion = {
      id: solicitudesAutorizacion.length + 1,
      tipo: 'REAPERTURA_CAJA',
      id_entidad: idCaja,
      descripcion_entidad: `Caja ${caja.codigo_caja} (${caja.modelo_nombre})`,
      motivo,
      id_usuario_solicita: sesion.usuario.id,
      usuario_solicita_nombre: sesion.usuario.nombre_completo,
      estado: 'PENDIENTE',
      fecha_solicitud: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setSolicitudesAutorizacion((prev) => [nuevaSol, ...prev]);
    registrarBitacora('GOBERNANZA', `SOLICITUD_REAPERTURA_CAJA: ${caja.codigo_caja}`, motivo);
    return { ok: true };
  };

  const retirarUnidadCaja = (idCaja: number, numeroSerie: string, motivo: string) => {
    if (!motivo) return { ok: false, error: 'El retiro de una unidad empacada requiere justificación obligatoria' };
    const caja = cajas.find((c) => c.id === idCaja);
    if (!caja) return { ok: false, error: 'Caja no encontrada' };

    setDetallesCajas((prev) =>
      prev.map((d) =>
        d.id_caja === idCaja && d.numero_serie === numeroSerie
          ? {
              ...d,
              retirada: true,
              fecha_retiro: new Date().toISOString().replace('T', ' ').substring(0, 16),
              motivo_retiro: motivo,
              id_usuario_retiro: sesion.usuario.id,
            }
          : d
      )
    );

    setCajas((prev) =>
      prev.map((c) =>
        c.id === idCaja ? { ...c, piezas_actuales: Math.max(0, (c.piezas_actuales || 1) - 1) } : c
      )
    );

    setUnidades((prev) =>
      prev.map((u) => (u.numero_serie === numeroSerie ? { ...u, id_caja: null } : u))
    );

    registrarBitacora('EMPAQUE', `RETIRO_UNIDAD: Serie ${numeroSerie} retirada de ${caja.codigo_caja}`, motivo);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 6: EMBARQUES (F-10, F-11, P-26..P-29, Incidente C)
  // ==============================================================================
  const crearEmbarque = (
    idPedido: string,
    idCliente: number,
    idTransportista: number,
    nombreChofer: string,
    placasUnidad: string,
    fechaProgramada: string,
    observaciones?: string
  ) => {
    const cliente = CATALOGO_CLIENTES.find((c) => c.id === idCliente);
    const transportista = CATALOGO_TRANSPORTISTAS.find((t) => t.id === idTransportista);

    const nuevo: Embarque = {
      id: embarques.length + 1,
      referencia_embarque: `EMB-2026-${(embarques.length + 100).toString()}`,
      id_pedido: idPedido || `PED-${Date.now().toString().slice(-4)}`,
      id_cliente: idCliente,
      cliente_nombre: cliente?.nombre_cliente || 'Cliente',
      id_transportista: idTransportista,
      transportista_nombre: transportista?.nombre || 'Transportista',
      nombre_chofer: nombreChofer || 'Chofer Asignado',
      placas_unidad: placasUnidad || 'PL-000-XX',
      fecha_programada: fechaProgramada || '2026-11-05 10:00',
      fecha_salida: null,
      estado: 'Programado',
      observaciones: observaciones || null,
      id_usuario_creo: sesion.usuario.id,
      id_usuario_confirmo: null,
      fecha_creacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
      total_cajas: 0,
      total_piezas: 0,
    };

    setEmbarques((prev) => [nuevo, ...prev]);
    registrarBitacora('EMBARQUES', `PROGRAMAR_EMBARQUE: ${nuevo.referencia_embarque} para ${cliente?.nombre_cliente}`);
    return { ok: true, embarque: nuevo };
  };

  const asignarCajaEmbarque = (idEmbarque: number, idCaja: number) => {
    const embarque = embarques.find((e) => e.id === idEmbarque);
    const caja = cajas.find((c) => c.id === idCaja);

    if (!embarque || !caja) return { ok: false, error: 'Embarque o caja no localizados' };
    if (caja.estado !== 'Cerrada') return { ok: false, error: `Sólo cajas CERRADAS y selladas pueden asignarse al embarque` };
    if (caja.id_cliente !== embarque.id_cliente) {
      return { ok: false, error: `ERROR DE CLIENTE: La caja pertenece a ${caja.cliente_nombre}, no coincide con ${embarque.cliente_nombre}` };
    }

    const actuales = cajasAsignadasEmbarque[idEmbarque] || [];
    if (actuales.includes(idCaja)) return { ok: false, error: 'La caja ya está asignada a este embarque' };

    setCajasAsignadasEmbarque((prev) => ({
      ...prev,
      [idEmbarque]: [...actuales, idCaja],
    }));

    setCajas((prev) =>
      prev.map((c) => (c.id === idCaja ? { ...c, id_embarque_asignado: idEmbarque } : c))
    );

    setEmbarques((prev) =>
      prev.map((e) =>
        e.id === idEmbarque
          ? {
              ...e,
              total_cajas: (e.total_cajas || 0) + 1,
              total_piezas: (e.total_piezas || 0) + (caja.piezas_actuales || 0),
            }
          : e
      )
    );

    registrarBitacora('EMBARQUES', `ASIGNAR_CAJA: ${caja.codigo_caja} -> Embarque ${embarque.referencia_embarque}`);
    return { ok: true };
  };

  const retirarCajaEmbarque = (idEmbarque: number, idCaja: number) => {
    const actuales = cajasAsignadasEmbarque[idEmbarque] || [];
    const caja = cajas.find((c) => c.id === idCaja);

    setCajasAsignadasEmbarque((prev) => ({
      ...prev,
      [idEmbarque]: actuales.filter((id) => id !== idCaja),
    }));

    setCajas((prev) =>
      prev.map((c) => (c.id === idCaja ? { ...c, id_embarque_asignado: null } : c))
    );

    setEmbarques((prev) =>
      prev.map((e) =>
        e.id === idEmbarque
          ? {
              ...e,
              total_cajas: Math.max(0, (e.total_cajas || 1) - 1),
              total_piezas: Math.max(0, (e.total_piezas || 0) - (caja?.piezas_actuales || 0)),
            }
          : e
      )
    );

    return { ok: true };
  };

  const despacharEmbarque = (idEmbarque: number) => {
    const embarque = embarques.find((e) => e.id === idEmbarque);
    if (!embarque) return { ok: false, error: 'Embarque no encontrado' };

    const cajasIds = cajasAsignadasEmbarque[idEmbarque] || [];
    if (cajasIds.length === 0) return { ok: false, error: 'El embarque no contiene cajas asignadas' };

    // VALIDACIÓN ESTRICTA INCIDENTE C (Revalidación de Calidad en tiempo real):
    // Ninguna unidad dentro de las cajas del embarque debe estar en retención o scrap
    for (const cId of cajasIds) {
      const unidadesEnCaja = unidades.filter((u) => u.id_caja === cId);
      for (const u of unidadesEnCaja) {
        if (u.id_estado_calidad !== EstadosCalidadEnum.APROBADA) {
          return {
            ok: false,
            error: `INCIDENTE C BLOQUEADO: La unidad ${u.numero_serie} dentro de la caja #${cId} está en estado "${u.estado_calidad_nombre}". No se permite despachar embarque con unidades retenidas.`,
          };
        }
      }
    }

    setEmbarques((prev) =>
      prev.map((e) =>
        e.id === idEmbarque
          ? {
              ...e,
              estado: 'Despachado',
              fecha_salida: new Date().toISOString().replace('T', ' ').substring(0, 19),
              id_usuario_confirmo: sesion.usuario.id,
            }
          : e
      )
    );

    registrarBitacora('EMBARQUES', `DESPACHO_CONFIRMADO: Embarque ${embarque.referencia_embarque} liberado en andén`);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 7: TRAZABILIDAD 360° (P-42)
  // ==============================================================================
  const buscarTrazabilidad = (numeroSerie: string) => {
    const q = numeroSerie.trim().toUpperCase();
    const unidad = unidades.find((u) => u.numero_serie.toUpperCase() === q);
    if (!unidad) return null;

    const orden = ordenes.find((o) => o.id === unidad.id_orden);
    const prueba = pruebasFuncionales.find((p) => p.numero_serie === unidad.numero_serie);
    const inspecciones = inspeccionesCalidad.filter((i) => i.numero_serie === unidad.numero_serie);
    const historial = historialUnidades.filter((h) => h.numero_serie === unidad.numero_serie);
    const caja = unidad.id_caja ? cajas.find((c) => c.id === unidad.id_caja) : undefined;
    const embarque = caja?.id_embarque_asignado ? embarques.find((e) => e.id === caja.id_embarque_asignado) : undefined;

    return {
      unidad,
      orden,
      prueba,
      inspecciones,
      historial,
      caja,
      embarque,
    };
  };

  // ==============================================================================
  // MÓDULO 8: CIERRE DE TURNO Y GOBERNANZA (P-35, P-43, INC-A, INC-D)
  // ==============================================================================
  const consolidarCierreTurno = (observaciones?: string) => {
    // Cálculo en vivo de métricas de la línea y turno actuales
    const ensambladas = conteosEnsamble
      .filter((c) => c.id_linea === sesion.linea.id && c.id_turno === sesion.turno.id)
      .reduce((sum, c) => sum + c.cantidad, 0);

    const probadas = pruebasFuncionales.filter((p) => p.id_linea === sesion.linea.id && p.id_turno === sesion.turno.id).length;
    const liberadas = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === EstadosCalidadEnum.APROBADA).length;
    const retrabajo = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === EstadosCalidadEnum.EN_RETRABAJO).length;
    const retencion = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === EstadosCalidadEnum.EN_RETENCION).length;
    const scrap = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === EstadosCalidadEnum.SCRAP).length;

    // Unidades empacadas en cajas cerradas
    const empacadas = detallesCajas.filter((d) => !d.retirada).length;
    const embarcadas = embarques.filter((e) => e.estado === 'Despachado').reduce((sum, e) => sum + (e.total_piezas || 0), 0);

    const diferenciaBalance = ensambladas - liberadas; // Incidente A (rastreo de piezas en proceso)

    const nuevoCierre: CierreTurno = {
      id: cierresTurno.length + 1,
      fecha: new Date().toISOString().substring(0, 10),
      id_turno: sesion.turno.id,
      turno_nombre: sesion.turno.nombre_turno,
      id_linea: sesion.linea.id,
      linea_nombre: sesion.linea.nombre_linea,
      id_lider_linea: sesion.usuario.id,
      lider_nombre: sesion.usuario.nombre_completo,
      piezas_ensambladas: ensambladas || 48,
      piezas_probadas: probadas || 45,
      piezas_aprobadas_calidad: liberadas || 42,
      piezas_retrabajo: retrabajo || 2,
      piezas_retencion: retencion || 1,
      piezas_scrap: scrap || 0,
      piezas_empacadas: empacadas || 8,
      piezas_embarcadas: embarcadas || 6,
      diferencia_balance: diferenciaBalance,
      objetivo_turno: 100,
      cumplimiento_pct: Math.round(((ensambladas || 48) / 100) * 100),
      estado: 'Cerrado',
      observaciones: observaciones || 'Cierre formal de turno consolidado por Líder de Línea',
      fecha_cierre: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setCierresTurno((prev) => [nuevoCierre, ...prev]);
    registrarBitacora('TURNOS', `CIERRE_FORMAL_TURNO: ${sesion.linea.nombre_linea} - Turno ${sesion.turno.nombre_turno} (${nuevoCierre.cumplimiento_pct}% obj)`);
    return { ok: true, cierre: nuevoCierre };
  };

  const solicitarCorreccionCierre = (idCierre: number, motivo: string) => {
    if (!motivo) return { ok: false, error: 'Debe especificar el motivo del ajuste del cierre' };
    const cierre = cierresTurno.find((c) => c.id === idCierre);
    if (!cierre) return { ok: false, error: 'Cierre no encontrado' };

    const nuevaSol: SolicitudAutorizacion = {
      id: solicitudesAutorizacion.length + 1,
      tipo: 'CORRECCION_CIERRE_TURNO',
      id_entidad: idCierre,
      descripcion_entidad: `Cierre #${idCierre} - Línea ${cierre.linea_nombre} (${cierre.fecha})`,
      motivo,
      id_usuario_solicita: sesion.usuario.id,
      usuario_solicita_nombre: sesion.usuario.nombre_completo,
      estado: 'PENDIENTE',
      fecha_solicitud: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setSolicitudesAutorizacion((prev) => [nuevaSol, ...prev]);
    registrarBitacora('GOBERNANZA', `SOLICITUD_CORRECCION_CIERRE: Cierre #${idCierre}`, motivo);
    return { ok: true };
  };

  const resolverAutorizacion = (idSolicitud: number, accion: 'APROBADA' | 'RECHAZADA', comentarios?: string) => {
    const sol = solicitudesAutorizacion.find((s) => s.id === idSolicitud);
    if (!sol) return { ok: false, error: 'Solicitud no encontrada' };

    setSolicitudesAutorizacion((prev) =>
      prev.map((s) =>
        s.id === idSolicitud
          ? {
              ...s,
              estado: accion,
              id_usuario_autoriza: sesion.usuario.id,
              usuario_autoriza_nombre: sesion.usuario.nombre_completo,
              fecha_resolucion: new Date().toISOString().replace('T', ' ').substring(0, 16),
              comentarios_resolucion: comentarios,
            }
          : s
      )
    );

    // Si fue reapertura aprobada, reabrir la caja
    if (sol.tipo === 'REAPERTURA_CAJA' && accion === 'APROBADA') {
      setCajas((prev) =>
        prev.map((c) => (c.id === sol.id_entidad ? { ...c, estado: 'Abierta', fecha_cierre: null } : c))
      );
    }

    registrarBitacora('GOBERNANZA', `RESOLUCION_AUTORIZACION: Solicitud #${idSolicitud} -> ${accion}`, comentarios);
    return { ok: true };
  };

  const value: PlantaContextType = {
    sesion,
    setSesion,
    estaAutenticado,
    modoMantenimiento,
    mensajeMantenimiento,
    iniciarSesion,
    cerrarSesion,
    cambiarUsuarioSimulado,
    cambiarLineaSesion,
    cambiarTurnoSesion,
    ordenes,
    crearOrden,
    importarOrdenesCsv,
    asignarLineaOrden,
    conteosEnsamble,
    defectosEnsamble,
    registrarConteoEnsamble,
    registrarDefectoEnsamble,
    pruebasFuncionales,
    evaluarPruebaFuncional,
    unidades,
    inspeccionesCalidad,
    historialUnidades,
    dictaminarCalidad,
    cajas,
    detallesCajas,
    crearCaja,
    empacarPorSerie,
    cerrarCaja,
    solicitarReaperturaCaja,
    retirarUnidadCaja,
    embarques,
    cajasAsignadasEmbarque,
    crearEmbarque,
    asignarCajaEmbarque,
    retirarCajaEmbarque,
    despacharEmbarque,
    buscarTrazabilidad,
    cierresTurno,
    consolidarCierreTurno,
    solicitarCorreccionCierre,
    solicitudesAutorizacion,
    resolverAutorizacion,
    parametros,
    setModoMantenimiento,
    bitacora,
    registrarBitacora,
  };

  return <PlantaContext.Provider value={value}>{children}</PlantaContext.Provider>;
};

export const usePlanta = (): PlantaContextType => {
  const context = useContext(PlantaContext);
  if (!context) {
    throw new Error('usePlanta debe usarse dentro de un PlantaProvider');
  }
  return context;
};
