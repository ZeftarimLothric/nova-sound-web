// ==============================================================================
// NOVA SOUND - MODELOS DE DATOS Y TIPOS TYPESCRIPT
// Alineados 100% con el Caso Nova Sound y el Registro de Observaciones de Revisión.
// ==============================================================================

// P-37 / BD-14 / RNF-01b: Los 9 roles exactos de Nova Sound
export const RolesEnum = {
  OPERADOR: 1,
  LIDER_LINEA: 2,
  INSPECTOR_CALIDAD: 3,
  ALMACEN_EMPAQUE: 4,
  SUPERVISOR_ALMACEN: 5,
  SUBGERENTE_PRODUCCION: 6,
  GERENTE_PRODUCCION: 7,
  GERENTE_PLANTA: 8,
  ADMINISTRADOR_SISTEMA: 9,
} as const;

export type RolId = typeof RolesEnum[keyof typeof RolesEnum];

// RN-01 / RN-02 / RN-13: Estados oficiales de Calidad
export const EstadosCalidadEnum = {
  APROBADA: 1,
  EN_RETRABAJO: 2,
  EN_RETENCION: 3,
  SCRAP: 4,
} as const;

export type EstadoCalidadId = typeof EstadosCalidadEnum[keyof typeof EstadosCalidadEnum];

export interface Linea {
  id: number;
  nombre_linea: string;
  activa: boolean;
}

export interface Turno {
  id: number;
  nombre_turno: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface Modelo {
  id: number;
  nombre_modelo: string;
  capacidad_caja: number;
  descripcion?: string;
}

export interface Color {
  id: number;
  nombre_color: string;
}

// BD-18 / RN-06 / RN-08: Clientes con requiere_etiqueta y requisitos_empaque
export interface Cliente {
  id: number;
  nombre_cliente: string;
  tipo_cliente?: string;
  permite_mezcla_colores: boolean;
  requiere_etiqueta: boolean;
  requisitos_empaque?: string;
  activo: boolean;
}

export interface CatalogoDefecto {
  id: number;
  categoria: 'Apariencia' | 'Funcional' | 'Identificación' | 'Empaque';
  descripcion: string;
  severidad: 'Crítico' | 'Mayor' | 'Menor';
  activo: boolean;
}

// F-01 / F-02 / RF-01..03: Órdenes de Producción
export interface Orden {
  id: number;
  folio: string;
  id_pedido?: number | null;
  id_cliente: number;
  id_modelo: number;
  id_color: number;
  cantidad: number;
  fecha_recepcion: string;
  fecha_compromiso: string;
  id_usuario_registro: number;
  estado: 'Programada' | 'En Proceso' | 'Pausada' | 'Completada' | 'Cancelada';
  id_linea_asignada: number | null;
  id_usuario_asigno: number | null;
  fecha_asignacion: string | null;
  nombre_cliente?: string;
  nombre_modelo?: string;
  nombre_color?: string;
  nombre_linea?: string;
  cantidad_ensamblada?: number;
  cantidad_aprobada?: number;
  cantidad_scrap?: number;
  cantidad_solicitada_pedido?: number;
  faltante_pedido?: number;
}

// BD-11 / RF-05: Objetivos por fecha, turno, línea y modelo
export interface Objetivo {
  id: number;
  fecha: string;
  id_turno: number;
  id_linea: number;
  id_modelo: number;
  cantidad_objetivo: number;
  nombre_turno?: string;
  nombre_linea?: string;
  nombre_modelo?: string;
}

// F-03 / BD-10: Conteo de ensamble por lote (con id_linea y fecha_produccion; sin id_modelo ni serie)
export interface EnsambleLote {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  id_operador: number;
  cantidad: number;
  fecha_produccion: string;
  fecha_hora?: string;
  id_usuario_registro: number;
}

// F-04 / BD-03 / BD-04 / RF-09 / RF-10: Evaluación de Prueba Funcional (sin serie en la tabla)
export interface PruebaFuncional {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  id_usuario: number;
  valida_encendido: boolean;
  valida_audio: boolean;
  valida_carga: boolean;
  valida_bluetooth: boolean;
  estado_prueba: 'Aprobada' | 'Reprobada';
  fecha_hora?: string;
  numero_serie?: string | null; // Obtenido por JOIN desde unidades cuando aprueba
}

// BD-08 / RN-01 / RN-03 / RN-04: Instancia física ligada a id_prueba UNIQUE
// id_estado_calidad inicia en null (Pendiente de inspección de Calidad) hasta dictamen en F-05.
export interface Unidad {
  id: number;
  id_prueba: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  numero_serie: string;
  id_estado_calidad: number | null;
  id_caja: number | null;
  fecha_creacion?: string;
  modelo?: string;
  color?: string;
  nombre_estado?: string;
  permite_empaque?: boolean;
}

// BD-01 / BD-02 / RN-05..09: Cajas de empaque (sin cat_cajas; capacidad desde modelos)
export interface Caja {
  id: number;
  codigo_caja: string;
  id_cliente: number;
  id_modelo: number;
  id_color: number | null;
  estado: 'Abierta' | 'Cerrada';
  id_usuario_creador: number;
  fecha_creacion: string;
  id_usuario_cierra: number | null;
  fecha_cierre: string | null;
  nombre_cliente?: string;
  permite_mezcla_colores?: boolean;
  requiere_etiqueta?: boolean;
  requisitos_empaque?: string;
  nombre_modelo?: string;
  nombre_color?: string;
  capacidad_maxima?: number;
  piezas_actuales?: number;
}

// BD-07: Histórico de unidades en caja
export interface DetalleCaja {
  id: number;
  id_caja: number;
  id_unidad: number;
  id_usuario_asigna: number;
  fecha_asignacion: string;
  id_usuario_retira: number | null;
  fecha_retiro: string | null;
  motivo_retiro: string | null;
  activo: boolean;
  numero_serie?: string;
}

// BD-12 / RN-11 / RF-07 / RF-33 / INC-A / INC-D: Cierres de turno con las 5 etapas
export interface CierreTurno {
  id: number;
  folio_cierre: string;
  fecha: string;
  id_turno: number;
  id_linea: number;
  id_lider: number;
  piezas_ensambladas: number;
  piezas_probadas: number;
  piezas_liberadas: number;
  piezas_empacadas: number;
  piezas_embarcadas: number;
  piezas_scrap: number;
  diferencia_balance: number;
  estado: 'Abierto' | 'Cerrado' | 'En Revisión' | 'Corregido';
  fecha_hora_cierre: string;
  observaciones?: string;
}

// BD-13 / RN-09 / RN-11: Solicitudes de Autorización
export interface SolicitudAutorizacion {
  id: number;
  folio_solicitud: string;
  tipo: 'REAPERTURA_CAJA' | 'CORRECCION_CIERRE_TURNO' | 'RETIRO_UNIDAD' | 'RETRABAJO_ESPECIAL';
  id_referencia: number;
  id_usuario_solicita: number;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  id_usuario_autoriza: number | null;
  comentario_resolucion: string | null;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
}
