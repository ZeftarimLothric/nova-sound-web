// ==============================================================================
// TIPOS Y MODELOS BASADOS EN Tablas.sql (NOVA SOUND)
// ==============================================================================

// 1. GLOBALES Y CATÁLOGOS BASE
export interface Rol {
  id: number;
  nombre_rol: string;
}

export const RolesEnum = {
  OPERADOR: 1,
  INSPECTOR_CALIDAD: 2,
  SUPERVISOR: 3,
  GERENTE: 4,
  ADMINISTRADOR: 5,
} as const;
export type RolesEnum = (typeof RolesEnum)[keyof typeof RolesEnum];

export interface Modelo {
  id: number;
  nombre_modelo: string;
  capacidad_caja: number;
}

export interface Color {
  id: number;
  nombre_color: string;
}

export interface Cliente {
  id: number;
  nombre_cliente: string;
  tipo_cliente: string;
  permite_mezcla_colores: boolean;
  activo: boolean;
}

export interface Linea {
  id: number;
  nombre_linea: string; // 'L1', 'L2', 'L3'
  activa: boolean;
}

export interface Turno {
  id: number;
  nombre_turno: string; // 'Mañana', 'Tarde'
  hora_inicio: string;
  hora_fin: string;
}

export interface CatCaja {
  id: number;
  tipo_caja: string; // 'Estándar MINI', 'Estándar SPORT', etc.
  capacidad_maxima: number;
}

export interface CatalogoDefecto {
  id: number;
  categoria: string; // 'Apariencia', 'Ensamble', 'Funcional', 'Empaque'
  descripcion: string;
}

export interface CatalogoEstadoCalidad {
  id: number;
  nombre_estado: string; // 1: 'Aprobada', 2: 'En retrabajo', 3: 'En retención', 4: 'Scrap'
  permite_empaque: boolean;
}

export const EstadosCalidadEnum = {
  APROBADA: 1,
  EN_RETRABAJO: 2,
  EN_RETENCION: 3,
  SCRAP: 4,
} as const;
export type EstadosCalidadEnum = (typeof EstadosCalidadEnum)[keyof typeof EstadosCalidadEnum];

export interface ParametroSistema {
  id: number;
  clave: string;
  valor: number | null;
  descripcion: string | null;
}

export interface Transportista {
  id: number;
  nombre: string;
  rfc: string;
  telefono: string | null;
  activo: boolean;
}

// 2. USUARIOS Y AUDITORÍA
export interface Usuario {
  id: number;
  nomina: string;
  nombre_completo: string;
  usuario_login: string;
  id_rol: number;
  activo: boolean;
}

export interface Bitacora {
  id: number;
  fecha: string;
  id_usuario: number;
  modulo: string;
  accion: string;
}

// 3. EMPAQUE
export interface Caja {
  id: number;
  fecha_creacion: string;
  fecha_cierre: string | null;
  estado: string; // 'Abierta', 'Cerrada', etc.
  id_cat_caja: number;
  id_usuario_creador: number;
}

// 4. PRODUCCIÓN Y ÓRDENES
export interface Orden {
  id: number;
  folio: string;
  id_cliente: number;
  id_modelo: number;
  id_color: number;
  cantidad: number;
  fecha_compromiso: string;
  fecha_recepcion: string;
  id_usuario_registro: number;
  estado: string;
  id_linea_asignada: number | null;
  id_usuario_asigno: number | null;
  fecha_asignacion: string | null;
}

// 5. ENSAMBLE
export interface Ensamble {
  id: number;
  id_orden: number;
  id_modelo: number;
  id_turno: number;
  id_operador: number;
  cantidad: number;
  fecha_hora: string;
  id_usuario_registro: number;
}

export interface Objetivo {
  id: number;
  id_modelo: number;
  id_turno: number;
  cantidad_objetivo: number;
}

// 6. CALIDAD Y TRAZABILIDAD (SSOT CENTRAL)
export interface Unidad {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  numero_serie: string;
  id_estado_calidad: number;
  id_caja: number | null; // NULL significa suelta en planta
  fecha_ensamble: string;
}

export interface HistorialUnidad {
  id: number;
  id_unidad: number;
  id_usuario: number;
  estado_anterior: string;
  estado_nuevo: string;
  motivo: string;
  fecha_hora: string;
}

export interface PruebaFuncional {
  id: number;
  id_orden: number;
  id_linea: number;
  id_usuario: number;
  id_turno: number;
  numero_serie: string;
  valida_encendido: boolean;
  valida_audio: boolean;
  valida_carga: boolean;
  valida_bluetooth: boolean;
  estado_prueba: string;
  fecha_hora: string;
}

export interface InspeccionCalidad {
  id: number;
  id_unidad: number;
  id_inspector: number;
  fecha_inspeccion: string;
  comentarios: string | null;
}

// 7. EMBARQUE
export interface Embarque {
  id: number;
  referencia_embarque: string;
  id_pedido: number;
  id_cliente: number;
  id_transportista: number;
  fecha_programada: string;
  fecha_salida: string | null;
  estado: string;
  observaciones: string | null;
  id_usuario_creo: number;
  id_usuario_confirmo: number | null;
  fecha_creacion: string;
}

// 8. CONTEXTO DE TERMINAL / SESIÓN OPERATIVA EN PLANTA
export interface SesionOperativa {
  usuario: Usuario;
  linea: Linea;
  turno: Turno;
}
