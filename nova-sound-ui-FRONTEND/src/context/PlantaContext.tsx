import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

const API_URL = 'http://localhost:4000/api';
import type {
  SesionOperativa,
  CatCaja,
  Bitacora,
} from '../types/database';
import { RolesEnum, EstadosCalidadEnum } from '../types/database';

// -----------------------------------------------------------------------------
// MODELOS CONCRETOS PARA EL ESTADO COMPARTIDO (Tablas.sql)
// -----------------------------------------------------------------------------

export interface UnidadItem {
  id: number;
  id_orden: number;
  id_linea: number;
  id_turno: number;
  numero_serie: string;
  id_estado_calidad: number; // 0: Ensamblada (Pendiente), 1: Aprobada, 2: Retrabajo, 3: Retención, 4: Scrap
  id_caja: number | null; // NULL = Suelta en planta
  fecha_ensamble: string;
  modelo: string;
  color: string;
}

export interface HistorialUnidadItem {
  id: number;
  id_unidad: number;
  numero_serie: string;
  id_usuario: number;
  usuario_nombre: string;
  estado_anterior: string;
  estado_nuevo: string;
  motivo: string;
  fecha_hora: string;
}

export interface CajaItem {
  id: number;
  codigo_caja: string;
  fecha_creacion: string;
  fecha_cierre: string | null;
  estado: 'Abierta' | 'Cerrada';
  id_cat_caja: number;
  id_usuario_creador: number;
  id_embarque_asignado: number | null;
}

export interface EmbarqueItemState {
  id: number;
  referencia_embarque: string;
  id_pedido: number;
  id_cliente: number;
  id_transportista: number;
  fecha_programada: string;
  fecha_salida: string | null;
  estado: 'Preparación' | 'Listo para Salida' | 'En Tránsito' | 'Entregado';
  observaciones: string;
  usuario_creo: string;
}

export interface MovimientoEmpaqueItem {
  id: number;
  id_caja: number;
  evento: string;
  fecha: string;
  usuario: string;
}

export interface HistorialEmbarqueItem {
  id: number;
  id_embarque: number;
  operacion: string;
  estado_anterior: string;
  estado_nuevo: string;
  fecha_hora: string;
  usuario: string;
  detalle: string;
}

// Catálogo de Cajas
export const CATALOGO_CAJAS: CatCaja[] = [
  { id: 1, tipo_caja: 'Estándar MINI', capacidad_maxima: 12 },
  { id: 2, tipo_caja: 'Estándar SPORT', capacidad_maxima: 8 },
  { id: 3, tipo_caja: 'Estándar PRO', capacidad_maxima: 6 },
  { id: 4, tipo_caja: 'Estándar MAX', capacidad_maxima: 4 },
];

const SESSION_STORAGE_KEY = 'nova_sound_session_v1';

const getInitialSession = (): { sesion: SesionOperativa; autenticado: boolean } => {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.usuario && parsed.linea && parsed.turno) {
        return { sesion: parsed, autenticado: true };
      }
    }
  } catch {}
  return {
    sesion: {
      usuario: {
        id: 5,
        nomina: 'EMP-005',
        nombre_completo: 'Marcela Juárez',
        usuario_login: 'admin1',
        id_rol: RolesEnum.ADMINISTRADOR,
        activo: true,
      },
      linea: { id: 1, nombre_linea: 'L1', activa: true },
      turno: { id: 1, nombre_turno: 'Mañana', hora_inicio: '06:00', hora_fin: '14:00' },
    },
    autenticado: false,
  };
};

// -----------------------------------------------------------------------------
// INTERFAZ DEL CONTEXTO DE PLANTA
// -----------------------------------------------------------------------------
interface PlantaContextType {
  // Sesión activa y autenticación
  sesion: SesionOperativa;
  setSesion: React.Dispatch<React.SetStateAction<SesionOperativa>>;
  estaAutenticado: boolean;
  iniciarSesion: (login: string, contrasena: string, idLinea?: number, idTurno?: number) => Promise<{ ok: boolean; error?: string }>;
  cerrarSesion: () => void;
  cambiarUsuarioSimulado: (idRol: number) => void;

  // Unidades
  unidades: UnidadItem[];
  historialUnidades: HistorialUnidadItem[];
  registrarUnidadEnsamble: (numeroSerie: string, modelo?: string, color?: string) => { ok: boolean; error?: string };
  dictaminarCalidad: (
    numeroSerie: string,
    idEstadoCalidad: number,
    pruebas: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    motivo: string
  ) => { ok: boolean; error?: string };

  // Cajas y Empaque
  cajas: CajaItem[];
  movimientosEmpaque: MovimientoEmpaqueItem[];
  crearCaja: (idCatCaja: number) => CajaItem;
  empacarUnidadEnCaja: (numeroSerie: string, cajaId: number) => { ok: boolean; error?: string };
  cerrarYSellarCaja: (cajaId: number) => { ok: boolean; error?: string };

  // Embarques
  embarques: EmbarqueItemState[];
  historialEmbarque: HistorialEmbarqueItem[];
  crearEmbarque: (idCliente: number, idTransportista: number, fechaProgramada: string, observaciones: string) => EmbarqueItemState;
  asignarCajaAEmbarque: (cajaId: number, embarqueId: number) => { ok: boolean; error?: string };
  retirarCajaDeEmbarque: (cajaId: number, embarqueId: number) => { ok: boolean; error?: string };
  despacharEmbarque: (embarqueId: number) => { ok: boolean; error?: string };

  // Bitácora general
  bitacora: Bitacora[];
  registrarBitacora: (modulo: string, accion: string) => void;
}

const PlantaContext = createContext<PlantaContextType | undefined>(undefined);

// -----------------------------------------------------------------------------
// PROVIDER GLOBAL DE PLANTA
// -----------------------------------------------------------------------------
export const PlantaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(() => getInitialSession(), []);
  const [sesion, setSesion] = useState<SesionOperativa>(initial.sesion);
  const [estaAutenticado, setEstaAutenticado] = useState<boolean>(initial.autenticado);

  const iniciarSesion = async (
    login: string,
    contrasena: string,
    idLinea = 1,
    idTurno = 1
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, contrasena }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || 'Credenciales no válidas.' };
      }

      const lineaMap: Record<number, string> = { 1: 'L1', 2: 'L2', 3: 'L3' };
      const turnoMap: Record<number, { nombre: string; inicio: string; fin: string }> = {
        1: { nombre: 'Mañana', inicio: '06:00', fin: '14:00' },
        2: { nombre: 'Tarde', inicio: '14:00', fin: '22:00' },
      };

      const nuevaSesion: SesionOperativa = {
        usuario: data.usuario,
        linea: { id: idLinea, nombre_linea: lineaMap[idLinea] || 'L1', activa: true },
        turno: {
          id: idTurno,
          nombre_turno: turnoMap[idTurno]?.nombre || 'Mañana',
          hora_inicio: turnoMap[idTurno]?.inicio || '06:00',
          hora_fin: turnoMap[idTurno]?.fin || '14:00',
        },
      };

      setSesion(nuevaSesion);
      setEstaAutenticado(true);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nuevaSesion));
      } catch {}

      return { ok: true };
    } catch {
      return { ok: false, error: 'Error al contactar al servidor de autenticación Nova Sound.' };
    }
  };

  const cerrarSesion = () => {
    setEstaAutenticado(false);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  };

  const cambiarUsuarioSimulado = (idRol: number) => {
    let nuevoUsuario = sesion.usuario;
    switch (idRol) {
      case RolesEnum.OPERADOR:
        nuevoUsuario = { id: 2, nomina: 'EMP-002', nombre_completo: 'Carlos Hernández', usuario_login: 'operador1', id_rol: RolesEnum.OPERADOR, activo: true };
        break;
      case RolesEnum.INSPECTOR_CALIDAD:
        nuevoUsuario = { id: 1, nomina: 'EMP-001', nombre_completo: 'Juan Pérez', usuario_login: 'inspector1', id_rol: RolesEnum.INSPECTOR_CALIDAD, activo: true };
        break;
      case RolesEnum.SUPERVISOR:
        nuevoUsuario = { id: 3, nomina: 'EMP-003', nombre_completo: 'Fernanda Gómez', usuario_login: 'supervisor1', id_rol: RolesEnum.SUPERVISOR, activo: true };
        break;
      case RolesEnum.GERENTE:
        nuevoUsuario = { id: 4, nomina: 'EMP-004', nombre_completo: 'Eduardo Díaz', usuario_login: 'gerente1', id_rol: RolesEnum.GERENTE, activo: true };
        break;
      default:
        nuevoUsuario = { id: 5, nomina: 'EMP-005', nombre_completo: 'Marcela Juárez', usuario_login: 'admin1', id_rol: RolesEnum.ADMINISTRADOR, activo: true };
        break;
    }
    const actualizada = { ...sesion, usuario: nuevoUsuario };
    setSesion(actualizada);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(actualizada));
    } catch {}
  };

  // 1. UNIDADES Y TRAZABILIDAD (SSOT)
  const [unidades, setUnidades] = useState<UnidadItem[]>([]);
  const [historialUnidades, setHistorialUnidades] = useState<HistorialUnidadItem[]>([]);

  // 2. CAJAS Y EMPAQUE
  const [cajas, setCajas] = useState<CajaItem[]>([]);
  const [movimientosEmpaque, setMovimientosEmpaque] = useState<MovimientoEmpaqueItem[]>([]);

  // 3. EMBARQUES
  const [embarques, setEmbarques] = useState<EmbarqueItemState[]>([]);
  const [historialEmbarque, setHistorialEmbarque] = useState<HistorialEmbarqueItem[]>([]);

  // 4. BITÁCORA GENERAL
  const [bitacora, setBitacora] = useState<Bitacora[]>([]);

  // SINCRONIZACIÓN AUTOMÁTICA CON POSTGRESQL (NEON) VÍA BACKEND API
  useEffect(() => {
    // 1. Cargar unidades recientes
    fetch(`${API_URL}/unidades/recientes?limit=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const apiItems: UnidadItem[] = data.map((u: any) => ({
            id: u.id,
            id_orden: u.id_orden || 1,
            id_linea: u.id_linea || 1,
            id_turno: u.id_turno || 1,
            numero_serie: u.numero_serie,
            id_estado_calidad: u.id_estado_calidad || 0,
            id_caja: u.id_caja || null,
            fecha_ensamble: u.fecha_ensamble ? new Date(u.fecha_ensamble).toLocaleTimeString() : '08:00:00',
            modelo: u.modelo || 'NS-PRO',
            color: u.color || 'Negro',
          }));
          setUnidades(apiItems);
        }
      })
      .catch(() => {
        console.log('Operando en modo local para unidades.');
      });

    // 2. Cargar historial de calidad
    fetch(`${API_URL}/unidades/historial?limit=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHistorialUnidades(
            data.map((h: any) => ({
              id: h.id,
              id_unidad: h.id_unidad,
              numero_serie: h.numero_serie,
              id_usuario: h.id_usuario,
              usuario_nombre: h.usuario_nombre || 'Inspector Planta',
              estado_anterior: h.estado_anterior,
              estado_nuevo: h.estado_nuevo,
              motivo: h.motivo,
              fecha_hora: h.fecha_hora ? new Date(h.fecha_hora).toLocaleTimeString() : '08:00:00',
            }))
          );
        }
      })
      .catch(() => {});

    // 3. Cargar cajas de empaque desde Neon DB
    fetch(`${API_URL}/cajas`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCajas(
            data.map((c: any) => ({
              id: c.id,
              codigo_caja: `BOX-${String(c.id).padStart(3, '0')}`,
              fecha_creacion: c.fecha_creacion ? new Date(c.fecha_creacion).toLocaleString() : 'N/A',
              fecha_cierre: c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString() : null,
              estado: (c.estado || 'Abierta') as 'Abierta' | 'Cerrada',
              id_cat_caja: c.id_cat_caja || 1,
              id_usuario_creador: c.id_usuario_creador || 1,
              id_embarque_asignado: c.id_embarque_asignado || null,
            }))
          );
        }
      })
      .catch(() => {});

    // 4. Cargar embarques desde Neon DB
    fetch(`${API_URL}/embarques`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEmbarques(
            data.map((e: any) => ({
              id: e.id,
              referencia_embarque: e.referencia_embarque || `EMB-${String(e.id).padStart(3, '0')}`,
              id_pedido: e.id_pedido || 1,
              id_cliente: e.id_cliente || 1,
              id_transportista: e.id_transportista || 1,
              fecha_programada: e.fecha_programada ? String(e.fecha_programada).split('T')[0] : '2026-10-16',
              fecha_salida: e.fecha_salida ? new Date(e.fecha_salida).toLocaleString() : null,
              estado: (e.estado === 'Programado' ? 'Preparación' : e.estado) as any,
              observaciones: e.observaciones || '',
              usuario_creo: e.usuario_creo_nombre || `Usuario #${e.id_usuario_creo}`,
            }))
          );
        }
      })
      .catch(() => {});

    // 5. Cargar bitácora desde Neon DB
    fetch(`${API_URL}/bitacora`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBitacora(
            data.map((b: any) => ({
              id: b.id,
              fecha: b.fecha ? new Date(b.fecha).toLocaleString() : new Date().toLocaleString(),
              id_usuario: b.id_usuario,
              modulo: b.modulo,
              accion: b.accion,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const registrarBitacora = (modulo: string, accion: string) => {
    const nuevoLog: Bitacora = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      id_usuario: sesion.usuario.id,
      modulo,
      accion: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina}): ${accion}`,
    };
    setBitacora((prev) => [nuevoLog, ...prev]);

    fetch(`${API_URL}/bitacora`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: sesion.usuario.id,
        modulo,
        accion: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina}): ${accion}`,
      }),
    }).catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // ACCIONES DEL FLUJO PRODUCTIVO COMPARTIDO
  // ---------------------------------------------------------------------------

  // PASO 1: Ensamble registra nueva pieza física
  const registrarUnidadEnsamble = (numeroSerie: string, modelo = 'NS-PRO', color = 'Negro') => {
    const serialUpper = numeroSerie.trim().toUpperCase();

    if (!serialUpper) {
      return { ok: false, error: 'Debe ingresar un número de serie.' };
    }

    if (unidades.some((u) => u.numero_serie === serialUpper)) {
      return { ok: false, error: `La unidad ${serialUpper} ya fue registrada previamente en la planta.` };
    }

    const nuevaUnidad: UnidadItem = {
      id: Date.now(),
      id_orden: 1,
      id_linea: sesion.linea.id,
      id_turno: sesion.turno.id,
      numero_serie: serialUpper,
      id_estado_calidad: 0, // Pendiente de inspección
      id_caja: null,
      fecha_ensamble: new Date().toLocaleTimeString(),
      modelo,
      color,
    };

    setUnidades((prev) => [nuevaUnidad, ...prev]);
    registrarBitacora('Ensamble', `Unidad ${serialUpper} ensamblada en línea ${sesion.linea.nombre_linea}`);

    // Persistir a Neon PostgreSQL a través de la API
    fetch(`${API_URL}/unidades/ensamble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_serie: serialUpper,
        id_linea: sesion.linea.id,
        id_turno: sesion.turno.id,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data?.id) {
          setUnidades((prev) =>
            prev.map((u) => (u.numero_serie === serialUpper ? { ...u, id: data.data.id } : u))
          );
        }
      })
      .catch((err) => console.warn('Error al persistir en backend:', err));

    return { ok: true };
  };

  // PASO 2: Calidad dictamina la pieza física
  const dictaminarCalidad = (
    numeroSerie: string,
    idEstadoCalidad: number,
    _pruebas: { encendido: boolean; audio: boolean; carga: boolean; bluetooth: boolean },
    motivo: string
  ) => {
    const serialUpper = numeroSerie.trim().toUpperCase();
    const unidad = unidades.find((u) => u.numero_serie === serialUpper);

    if (!unidad) {
      return { ok: false, error: `La unidad ${serialUpper} no existe en la base de datos de planta.` };
    }

    const estadoNombreMap: Record<number, string> = {
      [EstadosCalidadEnum.APROBADA]: 'Aprobada',
      [EstadosCalidadEnum.EN_RETRABAJO]: 'En retrabajo',
      [EstadosCalidadEnum.EN_RETENCION]: 'En retención',
      [EstadosCalidadEnum.SCRAP]: 'Scrap',
    };
    const nombreEstado = estadoNombreMap[idEstadoCalidad] ?? 'Desconocido';

    // Actualizar estado de calidad en unidades
    setUnidades((prev) =>
      prev.map((u) => (u.numero_serie === serialUpper ? { ...u, id_estado_calidad: idEstadoCalidad } : u))
    );

    // Registrar en historial_unidades
    const nuevoHistorial: HistorialUnidadItem = {
      id: Date.now(),
      id_unidad: unidad.id,
      numero_serie: serialUpper,
      id_usuario: sesion.usuario.id,
      usuario_nombre: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina})`,
      estado_anterior: unidad.id_estado_calidad === 0 ? 'En Ensamble' : (estadoNombreMap[unidad.id_estado_calidad] ?? 'Previo'),
      estado_nuevo: nombreEstado,
      motivo: motivo || 'Inspección estándar',
      fecha_hora: new Date().toLocaleTimeString(),
    };
    setHistorialUnidades((prev) => [nuevoHistorial, ...prev]);

    registrarBitacora('Calidad', `Unidad ${serialUpper} dictaminada como [${nombreEstado.toUpperCase()}]`);

    // Persistir a Neon PostgreSQL a través de la API
    fetch(`${API_URL}/unidades/calidad/dictamen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_serie: serialUpper,
        id_estado_calidad: idEstadoCalidad,
        id_usuario: sesion.usuario.id,
        pruebas: {
          valida_encendido: _pruebas.encendido,
          valida_audio: _pruebas.audio,
          valida_carga: _pruebas.carga,
          valida_bluetooth: _pruebas.bluetooth,
        },
        motivo,
      }),
    }).catch((err) => console.warn('Error al persistir dictamen en backend:', err));

    return { ok: true };
  };

  // PASO 3: Empaque asigna unidad aprobada a caja
  const empacarUnidadEnCaja = (numeroSerie: string, cajaId: number) => {
    const serialUpper = numeroSerie.trim().toUpperCase();
    const unidad = unidades.find((u) => u.numero_serie === serialUpper);
    const caja = cajas.find((c) => c.id === cajaId);

    if (!unidad) {
      return { ok: false, error: `La unidad ${serialUpper} no ha sido registrada en ensamble.` };
    }

    if (!caja) {
      return { ok: false, error: 'Caja no encontrada.' };
    }

    if (caja.estado === 'Cerrada') {
      return { ok: false, error: `La caja ${caja.codigo_caja} está CERRADA y sellada.` };
    }

    if (unidad.id_caja !== null) {
      return { ok: false, error: `La unidad ${serialUpper} ya está empacada en la caja #${unidad.id_caja}.` };
    }

    // Regla de Calidad: SOLO APROBADA
    if (unidad.id_estado_calidad !== EstadosCalidadEnum.APROBADA) {
      const estadoTxt = unidad.id_estado_calidad === 0 ? 'PENDIENTE DE INSPECCIÓN' : (unidad.id_estado_calidad === EstadosCalidadEnum.EN_RETRABAJO ? 'EN RETRABAJO' : 'SCRAP');
      return { ok: false, error: `RECHAZO DE CALIDAD: Unidad ${serialUpper} está en estado [${estadoTxt}]. Solo unidades Aprobadas pueden ser empacadas.` };
    }

    // Validar capacidad máxima de la caja
    const cat = CATALOGO_CAJAS.find((k) => k.id === caja.id_cat_caja);
    const conteoActual = unidades.filter((u) => u.id_caja === cajaId).length;
    if (cat && conteoActual >= cat.capacidad_maxima) {
      return { ok: false, error: `Capacidad máxima alcanzada (${cat.capacidad_maxima}/${cat.capacidad_maxima} pzs). Debe cerrar y sellar la caja.` };
    }

    // Actualizar unidad
    setUnidades((prev) =>
      prev.map((u) => (u.numero_serie === serialUpper ? { ...u, id_caja: cajaId } : u))
    );

    // Registrar movimiento
    const nuevoMov: MovimientoEmpaqueItem = {
      id: Date.now(),
      id_caja: cajaId,
      evento: `Unidad ${serialUpper} empacada en ${caja.codigo_caja} (${conteoActual + 1}/${cat?.capacidad_maxima ?? 0})`,
      fecha: new Date().toLocaleTimeString(),
      usuario: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina})`,
    };
    setMovimientosEmpaque((prev) => [nuevoMov, ...prev]);

    registrarBitacora('Empaque', `Unidad ${serialUpper} vinculada a caja ${caja.codigo_caja}`);

    // Persistir a backend Neon PostgreSQL
    fetch(`${API_URL}/cajas/empacar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_unidad: unidad.id,
        id_caja: cajaId,
      }),
    }).catch((err) => console.warn('Error al empacar unidad en backend:', err));

    return { ok: true };
  };

  const crearCaja = (idCatCaja: number): CajaItem => {
    const nuevoId = cajas.length + 1;
    const cat = CATALOGO_CAJAS.find((c) => c.id === idCatCaja);
    const nuevaCaja: CajaItem = {
      id: nuevoId,
      codigo_caja: `BOX-${String(nuevoId).padStart(3, '0')}`,
      fecha_creacion: new Date().toLocaleString(),
      fecha_cierre: null,
      estado: 'Abierta',
      id_cat_caja: idCatCaja,
      id_usuario_creador: sesion.usuario.id,
      id_embarque_asignado: null,
    };

    setCajas((prev) => [...prev, nuevaCaja]);

    const nuevoMov: MovimientoEmpaqueItem = {
      id: Date.now(),
      id_caja: nuevoId,
      evento: `Caja ${nuevaCaja.codigo_caja} aperturada (${cat?.tipo_caja}, capacidad: ${cat?.capacidad_maxima} pzs)`,
      fecha: new Date().toLocaleTimeString(),
      usuario: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina})`,
    };
    setMovimientosEmpaque((prev) => [nuevoMov, ...prev]);

    registrarBitacora('Empaque', `Apertura de caja ${nuevaCaja.codigo_caja}`);

    // Persistir creación de caja en backend Neon
    fetch(`${API_URL}/cajas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_cat_caja: idCatCaja,
        id_usuario_creador: sesion.usuario.id,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((created) => {
        if (created && created.id) {
          setCajas((prev) =>
            prev.map((c) =>
              c.id === nuevoId
                ? { ...c, id: created.id, codigo_caja: `BOX-${String(created.id).padStart(3, '0')}` }
                : c
            )
          );
        }
      })
      .catch((err) => console.warn('Error al crear caja en backend:', err));

    return nuevaCaja;
  };

  const cerrarYSellarCaja = (cajaId: number) => {
    const caja = cajas.find((c) => c.id === cajaId);
    if (!caja || caja.estado === 'Cerrada') {
      return { ok: false, error: 'Caja no encontrada o ya se encuentra cerrada.' };
    }

    const conteo = unidades.filter((u) => u.id_caja === cajaId).length;
    if (conteo === 0) {
      return { ok: false, error: 'No se puede sellar una caja vacía.' };
    }

    const fechaCierre = new Date().toLocaleString();
    setCajas((prev) =>
      prev.map((c) => (c.id === cajaId ? { ...c, estado: 'Cerrada', fecha_cierre: fechaCierre } : c))
    );

    const movCierre: MovimientoEmpaqueItem = {
      id: Date.now(),
      id_caja: cajaId,
      evento: `Caja ${caja.codigo_caja} CERRADA Y SELLADA con ${conteo} unidades`,
      fecha: new Date().toLocaleTimeString(),
      usuario: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina})`,
    };
    setMovimientosEmpaque((prev) => [movCierre, ...prev]);

    registrarBitacora('Empaque', `Caja ${caja.codigo_caja} sellada (${conteo} pzs). Lista para almacén/embarque.`);

    // Persistir cierre de caja en backend Neon
    fetch(`${API_URL}/cajas/${cajaId}/cerrar`, {
      method: 'PATCH',
    }).catch((err) => console.warn('Error al cerrar caja en backend:', err));

    return { ok: true };
  };

  // PASO 4: Embarques
  const crearEmbarque = (
    idCliente: number,
    idTransportista: number,
    fechaProgramada: string,
    observaciones: string
  ): EmbarqueItemState => {
    const nuevoId = embarques.length + 1;
    const ref = `EMB-2026-${String(nuevoId).padStart(3, '0')}`;
    const nuevoEmbarque: EmbarqueItemState = {
      id: nuevoId,
      referencia_embarque: ref,
      id_pedido: 100 + nuevoId,
      id_cliente: idCliente,
      id_transportista: idTransportista,
      fecha_programada: fechaProgramada,
      fecha_salida: null,
      estado: 'Preparación',
      observaciones: observaciones || 'Sin observaciones.',
      usuario_creo: `${sesion.usuario.nombre_completo} (${sesion.usuario.nomina})`,
    };

    setEmbarques((prev) => [...prev, nuevoEmbarque]);

    const hist: HistorialEmbarqueItem = {
      id: Date.now(),
      id_embarque: nuevoId,
      operacion: 'Creación de Embarque',
      estado_anterior: 'N/A',
      estado_nuevo: 'Preparación',
      fecha_hora: new Date().toLocaleTimeString(),
      usuario: sesion.usuario.nombre_completo,
      detalle: `Orden ${ref} programada.`,
    };
    setHistorialEmbarque((prev) => [hist, ...prev]);

    registrarBitacora('Embarques', `Orden de embarque ${ref} creada`);

    // Persistir embarque en backend Neon
    fetch(`${API_URL}/embarques`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referencia_embarque: ref,
        id_pedido: 100 + nuevoId,
        id_cliente: idCliente,
        id_transportista: idTransportista,
        fecha_programada: fechaProgramada,
        observaciones: observaciones || 'Sin observaciones.',
        id_usuario_creo: sesion.usuario.id,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((created) => {
        if (created && created.id) {
          setEmbarques((prev) =>
            prev.map((e) => (e.id === nuevoId ? { ...e, id: created.id } : e))
          );
        }
      })
      .catch((err) => console.warn('Error al crear embarque en backend:', err));

    return nuevoEmbarque;
  };

  const asignarCajaAEmbarque = (cajaId: number, embarqueId: number) => {
    const caja = cajas.find((c) => c.id === cajaId);
    const embarque = embarques.find((e) => e.id === embarqueId);

    if (!caja || !embarque) {
      return { ok: false, error: 'Caja o Embarque no encontrado.' };
    }

    if (embarque.estado === 'En Tránsito') {
      return { ok: false, error: 'El embarque ya fue despachado.' };
    }

    if (caja.estado !== 'Cerrada') {
      return { ok: false, error: `RECHAZO DE EMBARQUE: La caja ${caja.codigo_caja} está [ABIERTA]. Debe sellarse en Empaque antes de cargar.` };
    }

    setCajas((prev) =>
      prev.map((c) => (c.id === cajaId ? { ...c, id_embarque_asignado: embarqueId } : c))
    );

    const hist: HistorialEmbarqueItem = {
      id: Date.now(),
      id_embarque: embarqueId,
      operacion: 'Asignación de Caja',
      estado_anterior: embarque.estado,
      estado_nuevo: embarque.estado,
      fecha_hora: new Date().toLocaleTimeString(),
      usuario: sesion.usuario.nombre_completo,
      detalle: `Caja ${caja.codigo_caja} subida a la carga del embarque ${embarque.referencia_embarque}.`,
    };
    setHistorialEmbarque((prev) => [hist, ...prev]);

    registrarBitacora('Embarques', `Caja ${caja.codigo_caja} asignada a embarque ${embarque.referencia_embarque}`);

    // Persistir asignación en backend Neon
    fetch(`${API_URL}/embarques/asignar-caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_embarque: embarqueId,
        id_caja: cajaId,
        id_usuario: sesion.usuario.id,
      }),
    }).catch((err) => console.warn('Error al asignar caja en backend:', err));

    return { ok: true };
  };

  const retirarCajaDeEmbarque = (cajaId: number, embarqueId: number) => {
    const caja = cajas.find((c) => c.id === cajaId);
    const embarque = embarques.find((e) => e.id === embarqueId);

    if (!caja || !embarque) return { ok: false, error: 'No encontrado' };

    setCajas((prev) =>
      prev.map((c) => (c.id === cajaId ? { ...c, id_embarque_asignado: null } : c))
    );

    const hist: HistorialEmbarqueItem = {
      id: Date.now(),
      id_embarque: embarqueId,
      operacion: 'Retiro de Caja',
      estado_anterior: embarque.estado,
      estado_nuevo: embarque.estado,
      fecha_hora: new Date().toLocaleTimeString(),
      usuario: sesion.usuario.nombre_completo,
      detalle: `Caja ${caja.codigo_caja} retirada del embarque.`,
    };
    setHistorialEmbarque((prev) => [hist, ...prev]);

    registrarBitacora('Embarques', `Caja ${caja.codigo_caja} retirada de embarque ${embarque.referencia_embarque}`);

    // Persistir retiro en backend Neon
    fetch(`${API_URL}/embarques/retirar-caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_embarque: embarqueId,
        id_caja: cajaId,
        motivo: 'Retiro desde estación de embarques',
      }),
    }).catch((err) => console.warn('Error al retirar caja en backend:', err));

    return { ok: true };
  };

  const despacharEmbarque = (embarqueId: number) => {
    const embarque = embarques.find((e) => e.id === embarqueId);
    if (!embarque) return { ok: false, error: 'Embarque no encontrado' };

    const cajasCargadas = cajas.filter((c) => c.id_embarque_asignado === embarqueId);
    if (cajasCargadas.length === 0) {
      return { ok: false, error: 'No se puede despachar un embarque sin cajas cargadas.' };
    }

    const fechaSalida = new Date().toLocaleString();
    setEmbarques((prev) =>
      prev.map((e) => (e.id === embarqueId ? { ...e, estado: 'En Tránsito', fecha_salida: fechaSalida } : e))
    );

    const hist: HistorialEmbarqueItem = {
      id: Date.now(),
      id_embarque: embarqueId,
      operacion: 'Despacho de Salida',
      estado_anterior: embarque.estado,
      estado_nuevo: 'En Tránsito',
      fecha_hora: new Date().toLocaleTimeString(),
      usuario: sesion.usuario.nombre_completo,
      detalle: `Transporte liberado con ${cajasCargadas.length} cajas selladas. Salida: ${fechaSalida}`,
    };
    setHistorialEmbarque((prev) => [hist, ...prev]);

    registrarBitacora('Embarques', `Embarque ${embarque.referencia_embarque} liberado en tránsito.`);

    // Persistir despacho en backend Neon
    fetch(`${API_URL}/embarques/${embarqueId}/despachar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: sesion.usuario.id,
      }),
    }).catch((err) => console.warn('Error al despachar embarque en backend:', err));

    return { ok: true };
  };

  const value = useMemo(
    () => ({
      sesion,
      setSesion,
      estaAutenticado,
      iniciarSesion,
      cerrarSesion,
      cambiarUsuarioSimulado,
      unidades,
      historialUnidades,
      registrarUnidadEnsamble,
      dictaminarCalidad,
      cajas,
      movimientosEmpaque,
      crearCaja,
      empacarUnidadEnCaja,
      cerrarYSellarCaja,
      embarques,
      historialEmbarque,
      crearEmbarque,
      asignarCajaAEmbarque,
      retirarCajaDeEmbarque,
      despacharEmbarque,
      bitacora,
      registrarBitacora,
    }),
    [sesion, estaAutenticado, unidades, historialUnidades, cajas, movimientosEmpaque, embarques, historialEmbarque, bitacora]
  );

  return <PlantaContext.Provider value={value}>{children}</PlantaContext.Provider>;
};

// Hook personalizado para usar el contexto
export const usePlanta = (): PlantaContextType => {
  const context = useContext(PlantaContext);
  if (!context) {
    throw new Error('usePlanta debe usarse dentro de un PlantaProvider');
  }
  return context;
};
