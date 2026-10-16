// Modelos de datos basados en Tablas.sql

export const RolesEnum = {
  OPERADOR: 1,
  INSPECTOR_CALIDAD: 2,
  SUPERVISOR: 3,
  GERENTE: 4,
  ADMINISTRADOR: 5,
} as const;

export const EstadosCalidadEnum = {
  APROBADA: 1,
  EN_RETRABAJO: 2,
  EN_RETENCION: 3,
  SCRAP: 4,
} as const;

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
}

export interface Color {
  id: number;
  nombre_color: string;
}

export interface Unidad {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  numero_serie: string;
  id_estado_calidad: number | null;
  id_caja: number | null;
  fecha_ensamble?: string;
}

export interface DictamenCalidadPayload {
  numero_serie: string;
  id_estado_calidad: number;
  id_usuario: number;
  pruebas: {
    valida_encendido: boolean;
    valida_audio: boolean;
    valida_carga: boolean;
    valida_bluetooth: boolean;
  };
  motivo: string;
}

export interface Caja {
  id: number;
  fecha_creacion: string;
  fecha_cierre: string | null;
  estado: string;
  id_cat_caja: number;
  id_usuario_creador: number;
}
