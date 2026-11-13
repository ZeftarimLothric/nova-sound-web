// ==============================================================================
// NOVA SOUND - TIPOS Y MODELOS SSOT INDUSTRIAL
// Basado en schema_completo_actualizado.sql y requerimientos del Caso Nova Sound
// ==============================================================================

// 1. LOS 9 ROLES OFICIALES (P-37, BD-14, RNF-01b)
export const RolesEnum = {
  OPERADOR: 1,
  LIDER_LINEA: 2,
  INSPECTOR_CALIDAD: 3,
  ALMACEN_EMPAQUE: 4,
  SUPERVISOR_ALMACEN: 5,
  SUBGERENTE_PRODUCCION: 6,
  GERENTE_PRODUCCION: 7,
  GERENTE_PLANTA: 8,
  ADMINISTRADOR: 9,
} as const;
export type RolesEnum = (typeof RolesEnum)[keyof typeof RolesEnum];

export interface Rol {
  id: number;
  nombre_rol: string;
  descripcion?: string;
}

// 2. CATÁLOGOS BASE
export interface Modelo {
  id: number;
  nombre_modelo: string; // 'NS-MINI', 'NS-SPORT', 'NS-PRO', 'NS-MAX'
  capacidad_caja: number; // 12, 8, 6, 4
  descripcion?: string;
}

export interface Color {
  id: number;
  nombre_color: string; // 'Negro', 'Blanco', 'Rojo', 'Azul', 'Verde'
}

export interface Cliente {
  id: number;
  nombre_cliente: string;
  tipo_cliente: string;
  permite_mezcla_colores: boolean;
  requiere_etiqueta?: boolean;
  requisitos_empaque?: string;
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

export interface Transportista {
  id: number;
  nombre: string;
  rfc: string;
  telefono: string | null;
  activo: boolean;
}

export const EstadosCalidadEnum = {
  APROBADA: 1,
  EN_RETRABAJO: 2,
  EN_RETENCION: 3,
  SCRAP: 4,
} as const;
export type EstadosCalidadEnum = (typeof EstadosCalidadEnum)[keyof typeof EstadosCalidadEnum];

export interface CatalogoEstadoCalidad {
  id: number;
  nombre_estado: string; // 'Aprobada', 'En retrabajo', 'En retención', 'Scrap'
  permite_empaque: boolean;
}

export interface CatalogoDefecto {
  id: number;
  categoria: 'Apariencia' | 'Funcional' | 'Identificación' | 'Empaque' | string;
  descripcion: string;
  severidad?: 'Menor' | 'Mayor' | 'Crítico';
}

export interface ParametroSistema {
  id: number;
  clave: string;
  valor: string | number | boolean | null;
  tipo_dato?: string;
  descripcion: string | null;
}

// 3. USUARIOS Y AUDITORÍA
export interface Usuario {
  id: number;
  nomina: string;
  nombre_completo: string;
  usuario_login: string;
  id_rol: number;
  nombre_rol?: string;
  permisos?: string[];
  activo: boolean;
}

export interface Bitacora {
  id: number;
  fecha: string;
  id_usuario: number;
  usuario_nombre?: string;
  modulo: string;
  accion: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  motivo?: string;
}

// 4. PRODUCCIÓN Y ÓRDENES (P-40, F-01, F-02)
export interface Orden {
  id: number;
  folio: string;
  id_cliente: number;
  cliente_nombre?: string;
  id_modelo: number;
  modelo_nombre?: string;
  id_color: number;
  color_nombre?: string;
  cantidad: number;
  fecha_compromiso: string;
  fecha_recepcion: string;
  id_usuario_registro: number;
  estado: 'Pendiente' | 'Asignada' | 'En Producción' | 'Terminada' | 'Cancelada' | string;
  id_linea_asignada: number | null;
  linea_nombre?: string | null;
  id_usuario_asigno: number | null;
  fecha_asignacion: string | null;
  piezas_ensambladas?: number;
  piezas_aprobadas?: number;
}

// 5. ENSAMBLE (F-03, P-11..P-14)
export interface ConteoEnsamble {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  id_operador: number;
  cantidad: number;
  fecha_hora: string;
}

export interface DefectoEnsamble {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  id_operador: number;
  id_defecto: number;
  defecto_descripcion?: string;
  cantidad: number;
  observaciones?: string;
  fecha_hora: string;
}

// 6. PRUEBA FUNCIONAL (F-04, P-41: Donde nace la serie oficial)
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
  aprobada: boolean;
  numero_serie: string | null; // Se genera sólo si valida_encendido && valida_audio && valida_carga && valida_bluetooth
  id_defecto_falla?: number | null;
  defecto_falla?: string | null;
  fecha_hora: string;
}

// 7. CALIDAD Y UNIDADES (F-05, F-06, P-16..P-20)
export interface Unidad {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  numero_serie: string;
  id_estado_calidad: number;
  estado_calidad_nombre?: string;
  id_caja: number | null;
  fecha_ensamble: string;
  modelo?: string;
  color?: string;
  cliente?: string;
  id_prueba_funcional?: number;
}

export interface InspeccionCalidad {
  id: number;
  id_unidad: number;
  numero_serie?: string;
  id_inspector: number;
  inspector_nombre?: string;
  id_estado_resultado: number;
  estado_resultado_nombre?: string;
  id_defecto?: number | null;
  defecto_descripcion?: string | null;
  comentarios: string | null;
  fecha_inspeccion: string;
}

export interface HistorialUnidad {
  id: number;
  id_unidad: number;
  numero_serie: string;
  id_usuario: number;
  usuario_nombre?: string;
  estado_anterior: string;
  estado_nuevo: string;
  motivo: string;
  fecha_hora: string;
}

// 8. EMPAQUE Y CAJAS (F-08, F-09, P-21..P-25)
export interface Caja {
  id: number;
  codigo_caja: string;
  id_cliente: number;
  cliente_nombre?: string;
  id_modelo: number;
  modelo_nombre?: string;
  id_color: number;
  color_nombre?: string;
  capacidad: number;
  piezas_actuales?: number;
  fecha_creacion: string;
  fecha_cierre: string | null;
  estado: 'Abierta' | 'Cerrada';
  id_usuario_creador: number;
  id_usuario_cerro?: number | null;
  id_embarque_asignado?: number | null;
}

export interface DetalleCaja {
  id: number;
  id_caja: number;
  id_unidad: number;
  numero_serie: string;
  slot: number;
  fecha_empaque: string;
  id_usuario_empaco: number;
  retirada: boolean;
  fecha_retiro?: string | null;
  motivo_retiro?: string | null;
  id_usuario_retiro?: number | null;
}

// 9. LOGÍSTICA Y EMBARQUES (F-10, F-11, P-26..P-29)
export interface Embarque {
  id: number;
  referencia_embarque: string;
  id_pedido: number | string;
  id_cliente: number;
  cliente_nombre?: string;
  id_transportista: number;
  transportista_nombre?: string;
  nombre_chofer?: string;
  placas_unidad?: string;
  fecha_programada: string;
  fecha_salida: string | null;
  estado: 'Programado' | 'Cargando' | 'Despachado' | 'En Tránsito' | 'Entregado' | string;
  observaciones: string | null;
  id_usuario_creo: number;
  id_usuario_confirmo: number | null;
  fecha_creacion: string;
  total_cajas?: number;
  total_piezas?: number;
}

// 10. CIERRES DE TURNO Y GOBERNANZA (F-12, P-35, P-43, INC-A, INC-D)
export interface CierreTurno {
  id: number;
  fecha: string;
  id_turno: number;
  turno_nombre?: string;
  id_linea: number;
  linea_nombre?: string;
  id_lider_linea: number;
  lider_nombre?: string;
  piezas_ensambladas: number;
  piezas_probadas: number;
  piezas_aprobadas_calidad: number;
  piezas_retrabajo: number;
  piezas_retencion: number;
  piezas_scrap: number;
  piezas_empacadas: number;
  piezas_embarcadas: number;
  diferencia_balance: number; // Incident A: piezas ensambladas - piezas embarcadas/empacadas
  objetivo_turno: number;
  cumplimiento_pct: number;
  estado: 'Cerrado' | 'En Corrección' | 'Auditado';
  observaciones?: string;
  fecha_cierre: string;
}

export interface SolicitudAutorizacion {
  id: number;
  tipo: 'REAPERTURA_CAJA' | 'RETIRO_UNIDAD' | 'CORRECCION_CIERRE_TURNO' | 'DESPACHO_EXCEPCION';
  id_entidad: number; // id de caja, cierre o embarque
  descripcion_entidad: string;
  motivo: string;
  id_usuario_solicita: number;
  usuario_solicita_nombre?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  id_usuario_autoriza?: number | null;
  usuario_autoriza_nombre?: string | null;
  fecha_solicitud: string;
  fecha_resolucion?: string | null;
  comentarios_resolucion?: string | null;
}

// 11. SESIÓN OPERATIVA
export interface SesionOperativa {
  usuario: Usuario;
  linea: Linea;
  turno: Turno;
}
