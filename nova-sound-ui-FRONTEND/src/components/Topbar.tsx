import React from 'react';
import type { SesionOperativa } from '../types/database';
import { USUARIOS_OFICIALES, NOMBRES_ROLES, usePlanta } from '../context/PlantaContext';

export interface MenuItem {
  id: string;
  label: string;
  code: string; // Ej: '00', '01', '02', '03'
  iconName?: string;
  roles: number[];
  component: React.ReactNode;
}

interface TopbarProps {
  sesion: SesionOperativa;
  items: MenuItem[];
  vistaActual: string;
  setVistaActual: (id: string) => void;
  onCambiarRol: (idRol: number) => void;
  onCerrarSesion?: () => void;
}

export default function Topbar({
  sesion,
  items,
  vistaActual,
  setVistaActual,
  onCambiarRol,
  onCerrarSesion,
}: TopbarProps) {
  const { modoMantenimiento, mensajeMantenimiento, cambiarLineaSesion, cambiarTurnoSesion } = usePlanta();

  return (
    <header className="topbar-wrapper tex-ruler-top">
      {/* 0. BANNER DE MANTENIMIENTO TÁCTICO (P-39) */}
      {modoMantenimiento && (
        <div className="maintenance-banner tex-warn-stripes">
          <span style={{ background: '#0a0b0d', color: '#fffa00', padding: '0.1rem 0.5rem', fontWeight: 800 }}>
            [AVISO DE MANTENIMIENTO ACTIVO]
          </span>
          <span>{mensajeMantenimiento}</span>
          <span style={{ background: '#0a0b0d', color: '#fffa00', padding: '0.1rem 0.5rem', fontWeight: 800 }}>
            SCADA RESTRICTED MODE
          </span>
        </div>
      )}

      {/* 1. BARRA PRINCIPAL: BRANDING + ESTADO TÉCNICO + SELECTOR ROL */}
      <div className="topbar-main tex-carbon-subtle">
        {/* Identidad Arknights Endfield Style */}
        <div className="topbar-brand">
          <div className="topbar-brand-mark">NS</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="topbar-brand-title">NOVA SOUND</span>
            <span className="topbar-brand-sub">CONTROL MES // SCADA INDUSTRIAL</span>
          </div>
        </div>

        {/* Telemetría y Controles de Línea / Turno */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Selector de Línea Operativa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gray-300)', textTransform: 'uppercase' }}>
              LÍNEA:
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3].map((lId) => (
                <button
                  key={lId}
                  onClick={() => cambiarLineaSesion(lId)}
                  style={{
                    background: sesion.linea.id === lId ? 'var(--accent)' : 'var(--dark-700)',
                    color: sesion.linea.id === lId ? 'var(--dark-900)' : 'var(--gray-200)',
                    border: '1px solid var(--dark-500)',
                    padding: '0.2rem 0.55rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  L{lId}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Turno */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gray-300)', textTransform: 'uppercase' }}>
              TURNO:
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[
                { id: 1, label: 'T1-MAÑ' },
                { id: 2, label: 'T2-TAR' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => cambiarTurnoSesion(t.id)}
                  style={{
                    background: sesion.turno.id === t.id ? 'var(--accent)' : 'var(--dark-700)',
                    color: sesion.turno.id === t.id ? 'var(--dark-900)' : 'var(--gray-200)',
                    border: '1px solid var(--dark-500)',
                    padding: '0.2rem 0.55rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simulador de 9 Roles Oficiales (P-37, BD-14) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--dark-900)', padding: '0.25rem 0.6rem', border: '1px solid var(--dark-600)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>
              ROL:
            </span>
            <select
              value={sesion.usuario.id_rol}
              onChange={(e) => onCambiarRol(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--pure-white)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {USUARIOS_OFICIALES.map((u) => (
                <option key={u.id} value={u.id_rol} style={{ background: '#111317', color: '#fff' }}>
                  [{u.nomina}] {NOMBRES_ROLES[u.id_rol]} - {u.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Info Usuario Activo */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--pure-white)' }}>
              {sesion.usuario.nombre_completo}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gray-300)' }}>
              {sesion.usuario.nomina} // {NOMBRES_ROLES[sesion.usuario.id_rol]}
            </span>
          </div>

          {/* Botón Salir */}
          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className="btn btn-outline"
              style={{ height: '1.9rem', padding: '0 0.8rem', fontSize: '0.65rem' }}
              title="Cerrar Sesión Activa"
            >
              SALIR
            </button>
          )}
        </div>
      </div>

      {/* 2. BARRA DE ESTACIONES / WORKSTATIONS NAVIGATION */}
      <nav className="topbar-stations">
        {items.map((item) => {
          const isActive = vistaActual === item.id;
          return (
            <button
              key={item.id}
              className={`station-tab ${isActive ? 'active' : ''}`}
              onClick={() => setVistaActual(item.id)}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: isActive ? 'var(--dark-900)' : 'var(--accent)',
                  fontWeight: 800,
                }}
              >
                [{item.code}]
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
