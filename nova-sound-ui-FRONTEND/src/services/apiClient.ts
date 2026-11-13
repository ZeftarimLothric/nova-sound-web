// ==============================================================================
// NOVA SOUND - CLIENTE HTTP CENTRALIZADO (SSOT API)
// Inyecta automáticamente x-user-id y x-rol-id para auth.middleware.ts (RBAC)
// ==============================================================================

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

let currentAuthHeaders: Record<string, string> = {};

export function setApiAuthHeaders(userId?: number | null, rolId?: number | null) {
  const headers: Record<string, string> = {};
  if (userId && userId > 0) headers['x-user-id'] = String(userId);
  if (rolId && rolId > 0) headers['x-rol-id'] = String(rolId);
  currentAuthHeaders = headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${normalizedPath}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...currentAuthHeaders,
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg =
        (typeof payload === 'object' && payload !== null && (payload.error || payload.message)) ||
        (typeof payload === 'string' && payload) ||
        `Error HTTP ${response.status}`;
      return { ok: false, status: response.status, error: String(errorMsg) };
    }

    return { ok: true, data: payload as T };
  } catch {
    return {
      ok: false,
      status: 0,
      error: `No se pudo conectar con el servidor API (${API_URL}). Verifica que el backend esté encendido.`,
    };
  }
}

// ==============================================================================
// ENDPOINTS DE FASE 1: AUTH, HEALTH Y CATÁLOGOS
// ==============================================================================

export interface LoginResponse {
  ok: boolean;
  usuario: {
    id: number;
    nomina: string;
    nombre_completo: string;
    usuario_login: string;
    id_rol: number;
    nombre_rol?: string;
    activo: boolean;
    permisos: string[];
  };
}

export interface HealthResponse {
  status: 'ONLINE' | 'MANTENIMIENTO';
  modo_mantenimiento: boolean;
  mensaje_mantenimiento: string;
  sistema: string;
  timestamp: string;
}

export const authApi = {
  login: (login: string, contrasena: string) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, contrasena }),
    }),
};

export const healthApi = {
  getStatus: () => apiRequest<HealthResponse>('/health'),
};

export const catalogosApi = {
  getLineas: () => apiRequest<any[]>('/catalogos/lineas'),
  getTurnos: () => apiRequest<any[]>('/catalogos/turnos'),
  getModelos: () => apiRequest<any[]>('/catalogos/modelos'),
  getColores: () => apiRequest<any[]>('/catalogos/colores'),
  getDefectos: () => apiRequest<any[]>('/catalogos/defectos'),
  getEstadosCalidad: () => apiRequest<any[]>('/catalogos/estados-calidad'),
  getClientes: () => apiRequest<any[]>('/catalogos/clientes'),
  getTransportistas: () => apiRequest<any[]>('/catalogos/transportistas'),
};

// ==============================================================================
// ENDPOINTS DE FASE 2: ÓRDENES, ENSAMBLE, PRUEBAS Y CALIDAD
// ==============================================================================

export const ordenesApi = {
  getAll: (idLinea?: number) =>
    apiRequest<any[]>(idLinea ? `/ordenes?id_linea=${idLinea}` : '/ordenes'),
  create: (payload: {
    folio: string;
    id_cliente: number;
    id_modelo: number;
    id_color: number;
    cantidad: number;
    fecha_compromiso: string;
    id_usuario_registro?: number;
  }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>('/ordenes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  importar: (payload: { csv?: string; ordenes?: any[]; id_usuario?: number }) =>
    apiRequest<{ ok: boolean; mensaje?: string; total_importadas: number; data: any[] }>('/ordenes/importar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  asignarLinea: (idOrden: number, idLinea: number, idUsuario?: number) =>
    apiRequest<{ ok: boolean; data: any }>(`/ordenes/${idOrden}/asignar-linea`, {
      method: 'PATCH',
      body: JSON.stringify({ id_linea: idLinea, id_usuario: idUsuario }),
    }),
};

export const ensambleApi = {
  getRecientes: (idLinea?: number) =>
    apiRequest<any[]>(idLinea ? `/ensamble/recientes?id_linea=${idLinea}` : '/ensamble/recientes'),
  registrarConteo: (payload: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    id_operador: number;
    cantidad: number;
  }) =>
    apiRequest<any>('/ensamble/conteo', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  registrarDefecto: (payload: {
    id_ensamble: number;
    id_defecto: number;
    cantidad?: number;
    motivo: string;
    id_usuario?: number;
  }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>('/ensamble/defecto', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const pruebasApi = {
  getRecientes: (limit = 50) => apiRequest<any[]>(`/pruebas/recientes?limit=${limit}`),
  evaluar: (payload: {
    id_orden: number;
    id_linea: number;
    id_turno: number;
    id_operador: number;
    valida_encendido: boolean;
    valida_audio: boolean;
    valida_carga: boolean;
    valida_bluetooth: boolean;
    id_defecto?: number;
    descripcion_defecto?: string;
  }) =>
    apiRequest<{ aprobado: boolean; numero_serie?: string | null; data?: any; unidad?: any; mensaje?: string }>(
      '/pruebas/evaluar',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
};

export const unidadesApi = {
  getRecientes: (limit = 100) => apiRequest<any[]>(`/unidades/recientes?limit=${limit}`),
  getHistorial: (limit = 100) => apiRequest<any[]>(`/unidades/historial?limit=${limit}`),
  getTrazabilidad: (numeroSerie: string) =>
    apiRequest<any>(`/unidades/trazabilidad/${encodeURIComponent(numeroSerie)}`),
  dictaminar: (payload: {
    numero_serie: string;
    id_estado_calidad: number;
    id_usuario?: number;
    id_defectos?: number[];
    comentarios?: string;
    motivo?: string;
  }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>('/unidades/calidad/dictamen', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ==============================================================================
// ENDPOINTS DE FASE 3: EMPAQUE, EMBARQUES, CIERRES, AUTORIZACIONES Y ADMIN
// ==============================================================================

export const cajasApi = {
  getAll: () => apiRequest<any[]>('/cajas'),
  getById: (id: number) => apiRequest<any>(`/cajas/${id}`),
  create: (payload: {
    id_cliente: number;
    id_modelo: number;
    id_color?: number | null;
    codigo_caja?: string;
    id_usuario_creador?: number;
  }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>('/cajas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  empacarPorSerie: (payload: { id_caja: number; numero_serie: string; id_usuario?: number }) =>
    apiRequest<any>('/cajas/empacar-serie', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cerrar: (idCaja: number, idUsuario?: number) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>(`/cajas/${idCaja}/cerrar`, {
      method: 'PATCH',
      body: JSON.stringify({ id_usuario: idUsuario }),
    }),
  retirarUnidad: (idCaja: number, payload: { id_unidad: number; id_usuario?: number; motivo: string }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>(`/cajas/${idCaja}/retirar-unidad`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const embarquesApi = {
  getAll: () => apiRequest<any[]>('/embarques'),
  create: (payload: {
    id_pedido: string;
    id_cliente: number;
    id_transportista: number;
    nombre_chofer: string;
    placas_unidad: string;
    fecha_programada: string;
    observaciones?: string;
    id_usuario_creo?: number;
  }) =>
    apiRequest<any>('/embarques', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  asignarCaja: (payload: { id_embarque: number; id_caja: number; id_usuario?: number }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>('/embarques/asignar-caja', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  retirarCaja: (payload: { id_embarque: number; id_caja: number; id_usuario?: number; motivo?: string }) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>('/embarques/retirar-caja', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  despachar: (idEmbarque: number, idUsuario?: number) =>
    apiRequest<{ ok: boolean; mensaje?: string; data: any }>(`/embarques/${idEmbarque}/despachar`, {
      method: 'PATCH',
      body: JSON.stringify({ id_usuario: idUsuario }),
    }),
};

export const turnosApi = {
  getCierres: (limit = 20) => apiRequest<any[]>(`/turnos/cierres?limit=${limit}`),
  consolidarCierre: (payload: {
    fecha?: string;
    id_turno: number;
    id_linea: number;
    id_lider?: number;
    observaciones?: string;
  }) =>
    apiRequest<any>('/turnos/cierre', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const autorizacionesApi = {
  getAll: (estado?: string) =>
    apiRequest<any[]>(estado ? `/autorizaciones?estado=${encodeURIComponent(estado)}` : '/autorizaciones'),
  solicitar: (payload: {
    tipo: 'REAPERTURA_CAJA' | 'AJUSTE_CIERRE';
    id_referencia: number;
    id_usuario_solicita?: number;
    motivo: string;
  }) =>
    apiRequest<any>('/autorizaciones/solicitar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resolver: (
    idSolicitud: number,
    payload: { estado: 'APROBADA' | 'RECHAZADA'; id_usuario_autoriza?: number; comentario_resolucion?: string }
  ) =>
    apiRequest<any>(`/autorizaciones/${idSolicitud}/resolver`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const adminApi = {
  getParametros: () => apiRequest<any[]>('/parametros'),
  updateParametro: (id: number, valor: string | number | boolean) =>
    apiRequest<any>(`/parametros/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ valor }),
    }),
  getBitacora: () => apiRequest<any[]>('/bitacora'),
  createBitacora: (payload: { id_usuario: number; modulo: string; accion: string; motivo?: string }) =>
    apiRequest<any>('/bitacora', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

