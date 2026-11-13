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
import {
  authApi,
  healthApi,
  setApiAuthHeaders,
  ordenesApi,
  ensambleApi,
  pruebasApi,
  unidadesApi,
  cajasApi,
  embarquesApi,
  turnosApi,
  autorizacionesApi,
  adminApi,
} from '../services/apiClient';

const SESSION_STORAGE_KEY = 'nova_sound_session_v2';

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
  { id: 3, nombre_turno: 'Noche', hora_inicio: '22:00', hora_fin: '06:00' },
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
  backendOnline: boolean;
  modoMantenimiento: boolean;
  mensajeMantenimiento: string;
  vistaActual: string;
  setVistaActual: React.Dispatch<React.SetStateAction<string>>;
  serieTrazabilidad: string | null;
  abrirTrazabilidad: (numeroSerie: string) => void;
  sincronizarAhora: () => Promise<void>;
  consultarTrazabilidadRemota: (numeroSerie: string) => Promise<ReturnType<PlantaContextType['buscarTrazabilidad']>>;
  tienePermiso: (codigoPermiso: string) => boolean;
  iniciarSesion: (login: string, contrasena: string, idLinea?: number, idTurno?: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarSesion: () => void;
  cambiarUsuarioSimulado: (idRol: number) => void;
  cambiarLineaSesion: (idLinea: number) => void;
  cambiarTurnoSesion: (idTurno: number) => void;

  // Órdenes de Producción (P-40)
  ordenes: Orden[];
  crearOrden: (folio: string, idCliente: number, idModelo: number, idColor: number, cantidad: number, fechaCompromiso: string) => Promise<{ ok: boolean; error?: string }>;
  importarOrdenesCsv: (textoCsv: string) => Promise<{ ok: boolean; importadas: number; error?: string }>;
  asignarLineaOrden: (idOrden: number, idLinea: number) => Promise<{ ok: boolean; error?: string }>;

  // Ensamble (F-03, P-11..P-15)
  conteosEnsamble: ConteoEnsamble[];
  defectosEnsamble: DefectoEnsamble[];
  registrarConteoEnsamble: (idOrden: number, cantidad: number) => Promise<{ ok: boolean; error?: string }>;
  registrarDefectoEnsamble: (idOrden: number, idDefecto: number, cantidad: number, observaciones?: string) => Promise<{ ok: boolean; error?: string }>;

  // Pruebas Funcionales (F-04, P-41: Nacimiento oficial de la Serie)
  pruebasFuncionales: PruebaFuncional[];
  evaluarPruebaFuncional: (
    idOrden: number,
    checks: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    idDefectoFalla?: number
  ) => Promise<{ ok: boolean; serieGenerada?: string; error?: string }>;

  // Calidad (F-05, F-06, P-16..P-20)
  unidades: Unidad[];
  inspeccionesCalidad: InspeccionCalidad[];
  historialUnidades: HistorialUnidad[];
  dictaminarCalidad: (
    numeroSerie: string,
    idEstadoCalidad: number,
    idDefecto?: number,
    comentarios?: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Empaque y Cajas (F-08, F-09, P-21..P-25, Incidente B)
  cajas: Caja[];
  detallesCajas: DetalleCaja[];
  crearCaja: (idCliente: number, idModelo: number, idColor: number) => Promise<{ ok: boolean; caja?: Caja; error?: string }>;
  empacarPorSerie: (numeroSerie: string, idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarCaja: (idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  solicitarReaperturaCaja: (idCaja: number, motivo: string) => Promise<{ ok: boolean; error?: string }>;
  retirarUnidadCaja: (idCaja: number, numeroSerie: string, motivo: string) => Promise<{ ok: boolean; error?: string }>;

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
  ) => Promise<{ ok: boolean; embarque?: Embarque; error?: string }>;
  asignarCajaEmbarque: (idEmbarque: number, idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  retirarCajaEmbarque: (idEmbarque: number, idCaja: number) => Promise<{ ok: boolean; error?: string }>;
  despacharEmbarque: (idEmbarque: number) => Promise<{ ok: boolean; error?: string }>;

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
  consolidarCierreTurno: (observaciones?: string) => Promise<{ ok: boolean; cierre?: CierreTurno; error?: string }>;
  solicitarCorreccionCierre: (idCierre: number, motivo: string) => Promise<{ ok: boolean; error?: string }>;
  solicitudesAutorizacion: SolicitudAutorizacion[];
  resolverAutorizacion: (idSolicitud: number, accion: 'APROBADA' | 'RECHAZADA', comentarios?: string) => Promise<{ ok: boolean; error?: string }>;

  // Configuración & Sistemas (P-36..P-39)
  parametros: ParametroSistema[];
  setModoMantenimiento: (activo: boolean, mensaje?: string) => Promise<void>;
  bitacora: Bitacora[];
  registrarBitacora: (modulo: string, accion: string, motivo?: string) => void;
}

const PlantaContext = createContext<PlantaContextType | undefined>(undefined);

// ==============================================================================
// PROVIDER DE PLANTA
// ==============================================================================
export const PlantaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. SESIÓN OPERATIVA INICIAL (solo se restaura si existe en localStorage)
  const initialSessionState = (() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SesionOperativa;
        if (parsed?.usuario?.id && parsed?.usuario?.id_rol && parsed?.linea && parsed?.turno) {
          setApiAuthHeaders(parsed.usuario.id, parsed.usuario.id_rol);
          return { sesion: parsed, autenticado: true };
        }
      }
    } catch {}
    return {
      sesion: {
        usuario: USUARIOS_OFICIALES[8],
        linea: CATALOGO_LINEAS[0],
        turno: CATALOGO_TURNOS[0],
      },
      autenticado: false,
    };
  })();

  const [sesion, setSesion] = useState<SesionOperativa>(initialSessionState.sesion);
  const [estaAutenticado, setEstaAutenticado] = useState<boolean>(initialSessionState.autenticado);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [modoMantenimiento, setModoMantenimientoState] = useState<boolean>(false);
  const [mensajeMantenimiento, setMensajeMantenimiento] = useState<string>('Operación estándar de planta activa');
  const [vistaActual, setVistaActual] = useState<string>('inicio');
  const [serieTrazabilidad, setSerieTrazabilidad] = useState<string | null>(null);

  const abrirTrazabilidad = (numeroSerie: string) => {
    setSerieTrazabilidad(numeroSerie.trim().toUpperCase());
    setVistaActual('trazabilidad');
  };

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

  // Sincronizar sesión con LocalStorage y headers RBAC
  useEffect(() => {
    if (!estaAutenticado) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion));
      setApiAuthHeaders(sesion.usuario.id, sesion.usuario.id_rol);
    } catch {}
  }, [sesion, estaAutenticado]);

  // Consultar estado real del backend (/api/health) y modo mantenimiento
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      const res = await healthApi.getStatus();
      if (!mounted) return;
      if (res.ok) {
        setBackendOnline(true);
        setModoMantenimientoState(Boolean(res.data.modo_mantenimiento));
        if (res.data.mensaje_mantenimiento) {
          setMensajeMantenimiento(res.data.mensaje_mantenimiento);
        }
      } else {
        setBackendOnline(false);
      }
    };
    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  // Sincronización integral de módulos con PostgreSQL
  const cargarOperacionCore = async () => {
    const [ordRes, ensRes, pruRes, uniRes, histRes, cajRes, embRes, cieRes, autRes, parRes, bitRes] =
      await Promise.all([
        ordenesApi.getAll(),
        ensambleApi.getRecientes(),
        pruebasApi.getRecientes(50),
        unidadesApi.getRecientes(100),
        unidadesApi.getHistorial(100),
        cajasApi.getAll(),
        embarquesApi.getAll(),
        turnosApi.getCierres(20),
        autorizacionesApi.getAll(),
        adminApi.getParametros(),
        adminApi.getBitacora(),
      ]);

    if (ordRes.ok && Array.isArray(ordRes.data)) {
      setOrdenes(
        ordRes.data.map((o: any) => ({
          id: Number(o.id),
          folio: o.folio,
          id_cliente: Number(o.id_cliente),
          cliente_nombre:
            o.cliente_nombre ||
            o.nombre_cliente ||
            CATALOGO_CLIENTES.find((c) => c.id === Number(o.id_cliente))?.nombre_cliente ||
            'Cliente',
          id_modelo: Number(o.id_modelo),
          modelo_nombre:
            o.modelo_nombre ||
            o.nombre_modelo ||
            CATALOGO_MODELOS.find((m) => m.id === Number(o.id_modelo))?.nombre_modelo ||
            'Modelo',
          id_color: Number(o.id_color),
          color_nombre:
            o.color_nombre ||
            o.nombre_color ||
            CATALOGO_COLORES.find((c) => c.id === Number(o.id_color))?.nombre_color ||
            'Color',
          cantidad: Number(o.cantidad),
          fecha_compromiso: String(o.fecha_compromiso || '').substring(0, 10),
          fecha_recepcion: String(o.fecha_recepcion || '').substring(0, 10),
          id_usuario_registro: Number(o.id_usuario_registro || 1),
          estado: o.estado || 'Pendiente',
          id_linea_asignada: o.id_linea_asignada ? Number(o.id_linea_asignada) : null,
          linea_nombre:
            o.linea_nombre ||
            o.nombre_linea ||
            CATALOGO_LINEAS.find((l) => l.id === Number(o.id_linea_asignada))?.nombre_linea ||
            null,
          id_usuario_asigno: o.id_usuario_asigno ? Number(o.id_usuario_asigno) : null,
          fecha_asignacion: o.fecha_asignacion || null,
          piezas_ensambladas: Number(o.piezas_ensambladas ?? 0),
          piezas_aprobadas: Number(o.piezas_aprobadas ?? 0),
        }))
      );
    }

    if (ensRes.ok && Array.isArray(ensRes.data)) {
      setConteosEnsamble(
        ensRes.data.map((c: any) => ({
          id: Number(c.id),
          id_orden: Number(c.id_orden),
          id_linea: Number(c.id_linea),
          id_turno: Number(c.id_turno),
          id_operador: Number(c.id_operador),
          cantidad: Number(c.cantidad),
          fecha_hora: String(c.fecha_hora || c.fecha_registro || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (pruRes.ok && Array.isArray(pruRes.data)) {
      setPruebasFuncionales(
        pruRes.data.map((p: any) => ({
          id: Number(p.id),
          id_orden: Number(p.id_orden),
          id_linea: Number(p.id_linea),
          id_turno: Number(p.id_turno),
          id_usuario: Number(p.id_usuario || p.id_operador || 1),
          valida_encendido: Boolean(p.valida_encendido),
          valida_audio: Boolean(p.valida_audio),
          valida_carga: Boolean(p.valida_carga),
          valida_bluetooth: Boolean(p.valida_bluetooth),
          aprobada: Boolean(
            p.aprobada ?? (p.valida_encendido && p.valida_audio && p.valida_carga && p.valida_bluetooth)
          ),
          numero_serie: p.numero_serie || null,
          id_defecto_falla: p.id_defecto_falla ? Number(p.id_defecto_falla) : null,
          defecto_falla: p.defecto_falla || p.descripcion_defecto || null,
          fecha_hora: String(p.fecha_hora || p.fecha_prueba || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (uniRes.ok && Array.isArray(uniRes.data)) {
      setUnidades(
        uniRes.data.map((u: any) => ({
          id: Number(u.id),
          id_orden: Number(u.id_orden),
          id_linea: Number(u.id_linea),
          id_turno: Number(u.id_turno),
          numero_serie: u.numero_serie,
          id_estado_calidad: Number(u.id_estado_calidad),
          estado_calidad_nombre:
            u.estado_calidad_nombre ||
            u.nombre_estado ||
            CATALOGO_ESTADOS_CALIDAD.find((e) => e.id === Number(u.id_estado_calidad))?.nombre_estado ||
            'Aprobada',
          id_caja: u.id_caja ? Number(u.id_caja) : null,
          fecha_ensamble: String(u.fecha_ensamble || '').replace('T', ' ').substring(0, 16),
          modelo: u.modelo || u.nombre_modelo || 'NS-PRO',
          color: u.color || u.nombre_color || 'Negro',
          cliente: u.cliente || u.nombre_cliente,
          id_prueba_funcional: u.id_prueba_funcional ? Number(u.id_prueba_funcional) : undefined,
        }))
      );
    }

    if (histRes.ok && Array.isArray(histRes.data)) {
      setHistorialUnidades(
        histRes.data.map((h: any) => ({
          id: Number(h.id),
          id_unidad: Number(h.id_unidad),
          numero_serie: h.numero_serie || '',
          id_usuario: Number(h.id_usuario || 1),
          usuario_nombre: h.usuario_nombre || h.nombre_completo || 'Usuario',
          estado_anterior: h.estado_anterior || '-',
          estado_nuevo: h.estado_nuevo || '-',
          motivo: h.motivo || '',
          fecha_hora: String(h.fecha_hora || '').replace('T', ' ').substring(0, 16),
        }))
      );
    }

    if (cajRes.ok && Array.isArray(cajRes.data)) {
      const detallesAcumulados: DetalleCaja[] = [];
      setCajas(
        cajRes.data.map((c: any) => {
          if (Array.isArray(c.detalles)) {
            for (const d of c.detalles) {
              detallesAcumulados.push({
                id: Number(d.id),
                id_caja: Number(c.id),
                id_unidad: Number(d.id_unidad),
                numero_serie: d.numero_serie || '',
                slot: Number(d.slot || 1),
                fecha_empaque: String(d.fecha_empaque || '').replace('T', ' ').substring(0, 16),
                id_usuario_empaco: Number(d.id_usuario_empaco || 1),
                retirada: Boolean(d.retirada),
                fecha_retiro: d.fecha_retiro ? String(d.fecha_retiro).replace('T', ' ').substring(0, 16) : null,
                motivo_retiro: d.motivo_retiro || null,
                id_usuario_retiro: d.id_usuario_retiro ? Number(d.id_usuario_retiro) : null,
              });
            }
          }
          return {
            id: Number(c.id),
            codigo_caja: c.codigo_caja,
            id_cliente: Number(c.id_cliente),
            cliente_nombre:
              c.cliente_nombre ||
              c.nombre_cliente ||
              CATALOGO_CLIENTES.find((cl) => cl.id === Number(c.id_cliente))?.nombre_cliente ||
              'Cliente',
            id_modelo: Number(c.id_modelo),
            modelo_nombre:
              c.modelo_nombre ||
              c.nombre_modelo ||
              CATALOGO_MODELOS.find((m) => m.id === Number(c.id_modelo))?.nombre_modelo ||
              'Modelo',
            id_color: c.id_color ? Number(c.id_color) : 1,
            color_nombre:
              c.color_nombre ||
              c.nombre_color ||
              CATALOGO_COLORES.find((co) => co.id === Number(c.id_color))?.nombre_color ||
              'Negro',
            capacidad: Number(c.capacidad || 12),
            piezas_actuales: Number(c.piezas_actuales ?? c.total_unidades ?? 0),
            fecha_creacion: String(c.fecha_creacion || '').replace('T', ' ').substring(0, 19),
            fecha_cierre: c.fecha_cierre ? String(c.fecha_cierre).replace('T', ' ').substring(0, 19) : null,
            estado: c.estado || 'Abierta',
            id_usuario_creador: Number(c.id_usuario_creador || 1),
            id_usuario_cerro: c.id_usuario_cerro ? Number(c.id_usuario_cerro) : null,
            id_embarque_asignado: c.id_embarque_asignado ? Number(c.id_embarque_asignado) : null,
          };
        })
      );
      if (detallesAcumulados.length > 0) {
        setDetallesCajas(detallesAcumulados);
      }
    }

    if (embRes.ok && Array.isArray(embRes.data)) {
      const mapaCajas: Record<number, number[]> = {};
      setEmbarques(
        embRes.data.map((e: any) => {
          const embId = Number(e.id);
          if (Array.isArray(e.cajas)) {
            mapaCajas[embId] = e.cajas.map((c: any) => Number(typeof c === 'object' ? c.id : c));
          }
          return {
            id: embId,
            referencia_embarque: e.referencia_embarque,
            id_pedido: e.id_pedido || '',
            id_cliente: Number(e.id_cliente),
            cliente_nombre:
              e.cliente_nombre ||
              e.nombre_cliente ||
              CATALOGO_CLIENTES.find((cl) => cl.id === Number(e.id_cliente))?.nombre_cliente ||
              'Cliente',
            id_transportista: Number(e.id_transportista),
            transportista_nombre:
              e.transportista_nombre ||
              CATALOGO_TRANSPORTISTAS.find((t) => t.id === Number(e.id_transportista))?.nombre ||
              'Transportista',
            nombre_chofer: e.nombre_chofer || '',
            placas_unidad: e.placas_unidad || '',
            fecha_programada: String(e.fecha_programada || '').replace('T', ' ').substring(0, 16),
            fecha_salida: e.fecha_salida ? String(e.fecha_salida).replace('T', ' ').substring(0, 16) : null,
            estado: e.estado || 'Programado',
            observaciones: e.observaciones || null,
            id_usuario_creo: Number(e.id_usuario_creo || 1),
            id_usuario_confirmo: e.id_usuario_confirmo ? Number(e.id_usuario_confirmo) : null,
            fecha_creacion: String(e.fecha_creacion || '').replace('T', ' ').substring(0, 16),
            total_cajas: Number(e.total_cajas ?? (Array.isArray(e.cajas) ? e.cajas.length : 0)),
            total_piezas: Number(e.total_piezas ?? 0),
          };
        })
      );
      if (Object.keys(mapaCajas).length > 0) {
        setCajasAsignadasEmbarque((prev) => ({ ...prev, ...mapaCajas }));
      }
    }

    if (cieRes.ok && Array.isArray(cieRes.data)) {
      setCierresTurno(
        cieRes.data.map((c: any) => ({
          id: Number(c.id),
          fecha: String(c.fecha || '').substring(0, 10),
          id_turno: Number(c.id_turno),
          turno_nombre:
            c.turno_nombre ||
            CATALOGO_TURNOS.find((t) => t.id === Number(c.id_turno))?.nombre_turno ||
            'Mañana',
          id_linea: Number(c.id_linea),
          linea_nombre:
            c.linea_nombre ||
            CATALOGO_LINEAS.find((l) => l.id === Number(c.id_linea))?.nombre_linea ||
            'L1',
          id_lider_linea: Number(c.id_lider_linea || c.id_lider || 1),
          lider_nombre: c.lider_nombre || 'Líder de Línea',
          piezas_ensambladas: Number(c.piezas_ensambladas ?? 0),
          piezas_probadas: Number(c.piezas_probadas ?? 0),
          piezas_aprobadas_calidad: Number(c.piezas_aprobadas_calidad ?? 0),
          piezas_retrabajo: Number(c.piezas_retrabajo ?? 0),
          piezas_retencion: Number(c.piezas_retencion ?? 0),
          piezas_scrap: Number(c.piezas_scrap ?? 0),
          piezas_empacadas: Number(c.piezas_empacadas ?? 0),
          piezas_embarcadas: Number(c.piezas_embarcadas ?? 0),
          diferencia_balance: Number(c.diferencia_balance ?? 0),
          objetivo_turno: Number(c.objetivo_turno ?? 100),
          cumplimiento_pct: Number(c.cumplimiento_pct ?? 0),
          estado: c.estado || 'Cerrado',
          observaciones: c.observaciones || '',
          fecha_cierre: String(c.fecha_cierre || '').replace('T', ' ').substring(0, 19),
        }))
      );
    }

    if (autRes.ok && Array.isArray(autRes.data)) {
      setSolicitudesAutorizacion(
        autRes.data.map((s: any) => ({
          id: Number(s.id),
          tipo: s.tipo,
          id_entidad: Number(s.id_entidad ?? s.id_referencia ?? 0),
          descripcion_entidad: s.descripcion_entidad || `${s.tipo} #${s.id_referencia ?? s.id_entidad ?? ''}`,
          motivo: s.motivo || '',
          id_usuario_solicita: Number(s.id_usuario_solicita || 1),
          usuario_solicita_nombre: s.usuario_solicita_nombre || 'Usuario',
          estado: s.estado || 'PENDIENTE',
          fecha_solicitud: String(s.fecha_solicitud || '').replace('T', ' ').substring(0, 16),
          id_usuario_autoriza: s.id_usuario_autoriza ? Number(s.id_usuario_autoriza) : undefined,
          usuario_autoriza_nombre: s.usuario_autoriza_nombre || undefined,
          fecha_resolucion: s.fecha_resolucion ? String(s.fecha_resolucion).replace('T', ' ').substring(0, 16) : undefined,
          comentarios_resolucion: s.comentarios_resolucion || s.comentario_resolucion || undefined,
        }))
      );
    }

    if (parRes.ok && Array.isArray(parRes.data)) {
      setParametros(
        parRes.data.map((p: any) => ({
          id: Number(p.id),
          clave: p.clave,
          valor: p.valor,
          tipo_dato: p.tipo_dato,
          descripcion: p.descripcion,
        }))
      );
    }

    if (bitRes.ok && Array.isArray(bitRes.data)) {
      setBitacora(
        bitRes.data.map((b: any) => ({
          id: Number(b.id),
          fecha: String(b.fecha || b.fecha_hora || '').replace('T', ' ').substring(0, 19),
          id_usuario: Number(b.id_usuario || 1),
          usuario_nombre: b.usuario_nombre || b.nombre_completo || 'Usuario',
          modulo: b.modulo || 'SISTEMA',
          accion: b.accion || '',
          motivo: b.motivo || undefined,
        }))
      );
    }
  };

  useEffect(() => {
    if (estaAutenticado) {
      cargarOperacionCore();
    }
  }, [estaAutenticado]);

  const tienePermiso = (codigoPermiso: string): boolean => {
    const permisos = sesion.usuario.permisos;
    if (Array.isArray(permisos) && permisos.length > 0) {
      return permisos.includes(codigoPermiso);
    }
    return sesion.usuario.id_rol === RolesEnum.ADMINISTRADOR;
  };

  // MÉTODOS DE AUTENTICACIÓN Y SESIÓN (conectado a POST /api/auth/login)
  const iniciarSesion = async (login: string, contrasena: string, idLinea = 1, idTurno = 1) => {
    const res = await authApi.login(login, contrasena);
    if (!res.ok) {
      if (res.status === 0) setBackendOnline(false);
      return { ok: false, error: res.error };
    }

    setBackendOnline(true);
    const lineaObj = CATALOGO_LINEAS.find((l) => l.id === idLinea) || CATALOGO_LINEAS[0];
    const turnoObj = CATALOGO_TURNOS.find((t) => t.id === idTurno) || CATALOGO_TURNOS[0];

    const usuarioAutenticado: Usuario = {
      id: res.data.usuario.id,
      nomina: res.data.usuario.nomina,
      nombre_completo: res.data.usuario.nombre_completo,
      usuario_login: res.data.usuario.usuario_login,
      id_rol: res.data.usuario.id_rol,
      nombre_rol: res.data.usuario.nombre_rol,
      permisos: res.data.usuario.permisos || [],
      activo: res.data.usuario.activo,
    };

    const nuevaSesion: SesionOperativa = {
      usuario: usuarioAutenticado,
      linea: lineaObj,
      turno: turnoObj,
    };

    setApiAuthHeaders(usuarioAutenticado.id, usuarioAutenticado.id_rol);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nuevaSesion));
    } catch {}
    setSesion(nuevaSesion);
    setEstaAutenticado(true);
    registrarBitacora('AUTH', `LOGIN_EXITOSO: ${usuarioAutenticado.nombre_completo}`);
    return { ok: true };
  };

  const cerrarSesion = () => {
    setEstaAutenticado(false);
    setApiAuthHeaders(null, null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
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

  const setModoMantenimiento = async (activo: boolean, mensaje?: string) => {
    setModoMantenimientoState(activo);
    if (mensaje) setMensajeMantenimiento(mensaje);

    const paramMant = parametros.find((p) => p.clave === 'SISTEMA_MODO_MANTENIMIENTO');
    const paramMsg = parametros.find((p) => p.clave === 'MENSAJE_MANTENIMIENTO');

    if (paramMant) {
      await adminApi.updateParametro(paramMant.id, String(activo));
    }
    if (paramMsg && mensaje !== undefined) {
      await adminApi.updateParametro(paramMsg.id, mensaje);
    }

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
  const crearOrden = async (
    folio: string,
    idCliente: number,
    idModelo: number,
    idColor: number,
    cantidad: number,
    fechaCompromiso: string
  ) => {
    if (!folio || cantidad <= 0) return { ok: false, error: 'Folio y cantidad mayor a cero requeridos' };

    const res = await ordenesApi.create({
      folio,
      id_cliente: idCliente,
      id_modelo: idModelo,
      id_color: idColor,
      cantidad,
      fecha_compromiso: fechaCompromiso || '2026-11-20',
      id_usuario_registro: sesion.usuario.id,
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ORDENES', `CREAR_ORDEN: Folio ${folio} (${cantidad} pzas)`);
    return { ok: true };
  };

  const importarOrdenesCsv = async (textoCsv: string) => {
    try {
      const lineas = textoCsv.trim().split(/\r?\n/);
      const items: any[] = [];

      for (const line of lineas) {
        if (!line || line.toLowerCase().startsWith('folio')) continue;
        const [folio, modeloNombre, colorNombre, clienteNombre, cantStr, compromiso] = line.split(',').map((s) => s.trim());
        if (!folio || !cantStr) continue;

        const modelo =
          CATALOGO_MODELOS.find((m) => m.nombre_modelo.toLowerCase() === (modeloNombre || '').toLowerCase()) ||
          CATALOGO_MODELOS[0];
        const color =
          CATALOGO_COLORES.find((c) => c.nombre_color.toLowerCase() === (colorNombre || '').toLowerCase()) ||
          CATALOGO_COLORES[0];
        const cliente =
          CATALOGO_CLIENTES.find((c) => c.nombre_cliente.toLowerCase().includes((clienteNombre || '').toLowerCase())) ||
          CATALOGO_CLIENTES[0];

        items.push({
          folio,
          id_cliente: cliente.id,
          id_modelo: modelo.id,
          id_color: color.id,
          cantidad: parseInt(cantStr, 10) || 50,
          fecha_compromiso: compromiso || '2026-11-30',
        });
      }

      if (items.length === 0) {
        return { ok: false, importadas: 0, error: 'No se encontraron filas válidas en el CSV' };
      }

      const res = await ordenesApi.importar({ ordenes: items, id_usuario: sesion.usuario.id });
      if (!res.ok) return { ok: false, importadas: 0, error: res.error };

      await cargarOperacionCore();
      const total = res.data.total_importadas ?? items.length;
      registrarBitacora('ORDENES', `IMPORTAR_CSV: ${total} órdenes cargadas masivamente`);
      return { ok: true, importadas: total };
    } catch {
      return { ok: false, importadas: 0, error: 'Error al procesar el archivo CSV' };
    }
  };

  const asignarLineaOrden = async (idOrden: number, idLinea: number) => {
    const linea = CATALOGO_LINEAS.find((l) => l.id === idLinea);
    if (!linea) return { ok: false, error: 'Línea no válida' };

    const res = await ordenesApi.asignarLinea(idOrden, idLinea, sesion.usuario.id);
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ORDENES', `ASIGNAR_LINEA: Orden #${idOrden} -> Línea ${linea.nombre_linea}`);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 2: ENSAMBLE (F-03, P-11..P-14: Conteo sin serie)
  // ==============================================================================
  const registrarConteoEnsamble = async (idOrden: number, cantidad: number) => {
    if (cantidad <= 0) return { ok: false, error: 'Cantidad inválida para registro de ensamble' };
    const orden = ordenes.find((o) => o.id === idOrden);
    if (!orden) return { ok: false, error: 'Orden no encontrada' };

    const res = await ensambleApi.registrarConteo({
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_operador: sesion.usuario.id,
      cantidad,
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('ENSAMBLE', `CONTEO_REGISTRADO: +${cantidad} pzas en Orden ${orden.folio} (Línea ${sesion.linea.nombre_linea})`);
    return { ok: true };
  };

  const registrarDefectoEnsamble = async (idOrden: number, idDefecto: number, cantidad: number, observaciones?: string) => {
    const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefecto);
    const conteoRelacionado = conteosEnsamble.find((c) => c.id_orden === idOrden) || conteosEnsamble[0];
    if (!conteoRelacionado) {
      return { ok: false, error: 'Registra primero un conteo de ensamble para asociar el defecto (BD-06).' };
    }

    const res = await ensambleApi.registrarDefecto({
      id_ensamble: conteoRelacionado.id,
      id_defecto: idDefecto,
      cantidad,
      motivo: (observaciones && observaciones.trim().length >= 3) ? observaciones.trim() : (def?.descripcion || 'Defecto en ensamble'),
      id_usuario: sesion.usuario.id,
    });

    if (!res.ok) return { ok: false, error: res.error };

    const nuevoDefecto: DefectoEnsamble = {
      id: res.data?.data?.id || defectosEnsamble.length + 1,
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
  const evaluarPruebaFuncional = async (
    idOrden: number,
    checks: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    idDefectoFalla?: number
  ) => {
    const orden = ordenes.find((o) => o.id === idOrden);
    if (!orden) return { ok: false, error: 'Orden no seleccionada para prueba funcional' };

    const todasAprobadas = checks.encendido && checks.audio && checks.carga && checks.bluetooth;
    const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefectoFalla);

    const res = await pruebasApi.evaluar({
      id_orden: idOrden,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      id_operador: sesion.usuario.id,
      valida_encendido: checks.encendido,
      valida_audio: checks.audio,
      valida_carga: checks.carga,
      valida_bluetooth: checks.bluetooth,
      ...(!todasAprobadas && idDefectoFalla ? { id_defecto: idDefectoFalla, descripcion_defecto: def?.descripcion } : {}),
    });

    if (!res.ok) return { ok: false, error: res.error };

    const serieGenerada = res.data.numero_serie || res.data.unidad?.numero_serie || undefined;
    await cargarOperacionCore();

    registrarBitacora(
      'PRUEBAS_FUNCIONALES',
      todasAprobadas ? `APROBADA_SERIE_EMITIDA: ${serieGenerada}` : `RECHAZADA_SIN_SERIE: ${def?.descripcion || 'Falla checks'}`,
      `Orden ${orden.folio}`
    );

    return { ok: true, serieGenerada };
  };

  // ==============================================================================
  // MÓDULO 4: CALIDAD Y DISPOSICIÓN (F-05, F-06, P-16..P-20)
  // ==============================================================================
  const dictaminarCalidad = async (numeroSerie: string, idEstadoCalidad: number, idDefecto?: number, comentarios?: string) => {
    const estadoObj = CATALOGO_ESTADOS_CALIDAD.find((e) => e.id === idEstadoCalidad);
    const defectoObj = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === idDefecto);

    const res = await unidadesApi.dictaminar({
      numero_serie: numeroSerie,
      id_estado_calidad: idEstadoCalidad,
      id_usuario: sesion.usuario.id,
      id_defectos: idDefecto ? [idDefecto] : undefined,
      comentarios: comentarios || undefined,
      motivo: comentarios || defectoObj?.descripcion || 'Dictamen de calidad registrado',
    });

    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();

    const unidadRef = unidades.find((u) => u.numero_serie === numeroSerie);
    const nuevaInspeccion: InspeccionCalidad = {
      id: inspeccionesCalidad.length + 1,
      id_unidad: unidadRef?.id || 0,
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

    registrarBitacora('CALIDAD', `DICTAMEN: Serie ${numeroSerie} -> ${estadoObj?.nombre_estado}`, comentarios);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 5: EMPAQUE Y CAJAS (F-08, F-09, P-21..P-25, Incidente B)
  // ==============================================================================
  const crearCaja = async (idCliente: number, idModelo: number, idColor: number) => {
    const res = await cajasApi.create({
      id_cliente: idCliente,
      id_modelo: idModelo,
      id_color: idColor,
      id_usuario_creador: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    const cajaCreada = res.data.data;
    registrarBitacora('EMPAQUE', `APERTURA_CAJA: ${cajaCreada?.codigo_caja || 'Nueva caja'}`);
    return { ok: true, caja: cajaCreada };
  };

  const empacarPorSerie = async (numeroSerie: string, idCaja: number) => {
    const res = await cajasApi.empacarPorSerie({
      id_caja: idCaja,
      numero_serie: numeroSerie,
      id_usuario: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMPAQUE', `UNIDAD_EMPACADA: ${numeroSerie} -> Caja #${idCaja}`);
    return { ok: true };
  };

  const cerrarCaja = async (idCaja: number) => {
    const res = await cajasApi.cerrar(idCaja, sesion.usuario.id);
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMPAQUE', `CAJA_CERRADA_SELLADA: Caja #${idCaja}`);
    return { ok: true };
  };

  const solicitarReaperturaCaja = async (idCaja: number, motivo: string) => {
    if (!motivo) return { ok: false, error: 'Debe especificar el motivo para solicitar reapertura de caja' };

    const res = await autorizacionesApi.solicitar({
      tipo: 'REAPERTURA_CAJA',
      id_referencia: idCaja,
      id_usuario_solicita: sesion.usuario.id,
      motivo,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('GOBERNANZA', `SOLICITUD_REAPERTURA_CAJA: Caja #${idCaja}`, motivo);
    return { ok: true };
  };

  const retirarUnidadCaja = async (idCaja: number, numeroSerie: string, motivo: string) => {
    if (!motivo) return { ok: false, error: 'El retiro de una unidad empacada requiere justificación obligatoria' };
    const unidad = unidades.find((u) => u.numero_serie.toUpperCase() === numeroSerie.trim().toUpperCase());
    if (!unidad) return { ok: false, error: `Unidad ${numeroSerie} no encontrada` };

    const res = await cajasApi.retirarUnidad(idCaja, {
      id_unidad: unidad.id,
      id_usuario: sesion.usuario.id,
      motivo,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMPAQUE', `RETIRO_UNIDAD: Serie ${numeroSerie} retirada de Caja #${idCaja}`, motivo);
    return { ok: true };
  };

  // ==============================================================================
  // MÓDULO 6: EMBARQUES (F-10, F-11, P-26..P-29, Incidente C)
  // ==============================================================================
  const crearEmbarque = async (
    idPedido: string,
    idCliente: number,
    idTransportista: number,
    nombreChofer: string,
    placasUnidad: string,
    fechaProgramada: string,
    observaciones?: string
  ) => {
    const res = await embarquesApi.create({
      id_pedido: idPedido || `PED-${Date.now().toString().slice(-4)}`,
      id_cliente: idCliente,
      id_transportista: idTransportista,
      nombre_chofer: nombreChofer || 'Chofer Asignado',
      placas_unidad: placasUnidad || 'PL-000-XX',
      fecha_programada: fechaProgramada || '2026-11-05 10:00',
      observaciones: observaciones || undefined,
      id_usuario_creo: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMBARQUES', `PROGRAMAR_EMBARQUE: ${res.data?.referencia_embarque || idPedido}`);
    return { ok: true, embarque: res.data };
  };

  const asignarCajaEmbarque = async (idEmbarque: number, idCaja: number) => {
    const res = await embarquesApi.asignarCaja({
      id_embarque: idEmbarque,
      id_caja: idCaja,
      id_usuario: sesion.usuario.id,
    });
    if (!res.ok) return { ok: false, error: res.error };

    setCajasAsignadasEmbarque((prev) => {
      const actuales = prev[idEmbarque] || [];
      return actuales.includes(idCaja) ? prev : { ...prev, [idEmbarque]: [...actuales, idCaja] };
    });
    await cargarOperacionCore();
    registrarBitacora('EMBARQUES', `ASIGNAR_CAJA: Caja #${idCaja} -> Embarque #${idEmbarque}`);
    return { ok: true };
  };

  const retirarCajaEmbarque = async (idEmbarque: number, idCaja: number) => {
    const res = await embarquesApi.retirarCaja({
      id_embarque: idEmbarque,
      id_caja: idCaja,
      id_usuario: sesion.usuario.id,
      motivo: 'Retiro de andén desde estación de embarques',
    });
    if (!res.ok) return { ok: false, error: res.error };

    setCajasAsignadasEmbarque((prev) => ({
      ...prev,
      [idEmbarque]: (prev[idEmbarque] || []).filter((id) => id !== idCaja),
    }));
    await cargarOperacionCore();
    return { ok: true };
  };

  const despacharEmbarque = async (idEmbarque: number) => {
    const res = await embarquesApi.despachar(idEmbarque, sesion.usuario.id);
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('EMBARQUES', `EMBARQUE_DESPACHADO: Embarque #${idEmbarque}`);
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
  const consolidarCierreTurno = async (observaciones?: string) => {
    const res = await turnosApi.consolidarCierre({
      fecha: new Date().toISOString().substring(0, 10),
      id_turno: sesion.turno.id,
      id_linea: sesion.linea.id,
      id_lider: sesion.usuario.id,
      observaciones: observaciones || 'Cierre formal de turno consolidado por Líder de Línea',
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('TURNOS', `CIERRE_FORMAL_TURNO: ${sesion.linea.nombre_linea} - Turno ${sesion.turno.nombre_turno}`);
    return { ok: true, cierre: res.data?.data || res.data };
  };

  const solicitarCorreccionCierre = async (idCierre: number, motivo: string) => {
    if (!motivo) return { ok: false, error: 'Debe especificar el motivo del ajuste del cierre' };
    const res = await autorizacionesApi.solicitar({
      tipo: 'AJUSTE_CIERRE',
      id_referencia: idCierre,
      id_usuario_solicita: sesion.usuario.id,
      motivo,
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('GOBERNANZA', `SOLICITUD_CORRECCION_CIERRE: Cierre #${idCierre}`, motivo);
    return { ok: true };
  };

  const resolverAutorizacion = async (idSolicitud: number, accion: 'APROBADA' | 'RECHAZADA', comentarios?: string) => {
    const res = await autorizacionesApi.resolver(idSolicitud, {
      estado: accion,
      id_usuario_autoriza: sesion.usuario.id,
      comentario_resolucion: comentarios || 'Resolución desde estación de gobernanza',
    });
    if (!res.ok) return { ok: false, error: res.error };

    await cargarOperacionCore();
    registrarBitacora('GOBERNANZA', `RESOLUCION_AUTORIZACION: Solicitud #${idSolicitud} -> ${accion}`, comentarios);
    return { ok: true };
  };

  const consultarTrazabilidadRemota = async (numeroSerie: string) => {
    const local = buscarTrazabilidad(numeroSerie);
    if (local) return local;
    const res = await unidadesApi.getTrazabilidad(numeroSerie.trim().toUpperCase());
    if (!res.ok || !res.data?.unidad) return null;
    const d = res.data;
    return {
      unidad: d.unidad,
      orden: d.orden || undefined,
      prueba: d.prueba_funcional || undefined,
      inspecciones: Array.isArray(d.inspecciones) ? d.inspecciones : [],
      historial: Array.isArray(d.historial) ? d.historial : [],
      caja: d.caja || undefined,
      embarque: d.embarque || undefined,
    };
  };

  const value: PlantaContextType = {
    sesion,
    setSesion,
    estaAutenticado,
    backendOnline,
    modoMantenimiento,
    mensajeMantenimiento,
    vistaActual,
    setVistaActual,
    serieTrazabilidad,
    abrirTrazabilidad,
    sincronizarAhora: cargarOperacionCore,
    consultarTrazabilidadRemota,
    tienePermiso,
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
