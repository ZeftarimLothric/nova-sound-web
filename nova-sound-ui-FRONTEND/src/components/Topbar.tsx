import React from 'react';
import type { SesionOperativa } from '../types/database';
import { NOMBRES_ROLES, usePlanta } from '../context/PlantaContext';
import Icon from './common/Icon';
import LogoBocina from './common/LogoBocina';

export interface MenuItem {
  id: string;
  label: string;
  code: string;
  iconName?: string;
  roles: number[];
  badge?: number;
  badgeAlert?: boolean;
  component: React.ReactNode;
}

interface TopbarProps {
  sesion: SesionOperativa;
  items: MenuItem[];
  openTabIds: string[];
  vistaActual: string;
  setVistaActual: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCambiarRol: (idRol: number) => void;
  onCerrarSesion?: () => void;
}

const PAL = {
  accent: '#fffa00',
  headerBg: '#191919',
  onHeader: '#fafafa',
  onHeaderMuted: 'rgba(250, 250, 250, 0.65)',
  onHeaderLine: 'rgba(255, 255, 255, 0.16)',
  tabBg: '#fafafa',
  tabActiveBg: '#ffffff',
  border: '#d9d9d9',
  textStrong: '#191919',
  textMuted: '#666666',
  textDim: '#888888',
};

export default function Topbar({
  sesion,
  items,
  openTabIds,
  vistaActual,
  setVistaActual,
  onCloseTab,
  onCerrarSesion,
}: TopbarProps) {
  const { modoMantenimiento, mensajeMantenimiento, cambiarLineaSesion, cambiarTurnoSesion, sincronizarAhora } = usePlanta();

  return (
    <header
      style={{
        backgroundColor: PAL.headerBg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 0. BANNER DE MANTENIMIENTO TÁCTICO (P-39) */}
      {modoMantenimiento && (
        <div className="maintenance-banner tex-warn-stripes">
          <span style={{ background: '#191919', color: '#fffa00', padding: '1px 8px', fontWeight: 800 }}>
            [AVISO DE MANTENIMIENTO]
          </span>
          <span style={{ background: '#191919', color: '#fafafa', padding: '1px 8px' }}>
            {mensajeMantenimiento}
          </span>
        </div>
      )}

      {/* 1. BARRA PRINCIPAL: BRANDING + TELEMETRÍA DE PLANTA + SESIÓN */}
      <div
        className="tex-carbon-subtle"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 18px',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '2px solid #fffa00',
        }}
      >
        <span className="ef-topbar-beam" aria-hidden="true" />
        {/* Identidad de Marca y Sistema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoBocina size={28} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: PAL.onHeader,
              }}
            >
              NOVA SOUND
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                color: 'rgba(250, 250, 250, 0.72)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 8px',
                borderRadius: '3px',
                fontWeight: 600,
                letterSpacing: '0.4px',
              }}
            >
              PLANTA MES
            </span>
          </div>
        </div>

        {/* Ficha Operativa en Vivo + Controles de Línea / Turno + Salir */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Selector rápido de Línea */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${PAL.onHeaderLine}`,
              padding: '3px 6px',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: PAL.onHeaderMuted, fontSize: '10px', fontFamily: 'var(--font-mono)', marginRight: '2px' }}>
              LÍNEA:
            </span>
            {[1, 2, 3].map((lId) => {
              const active = sesion.linea.id === lId;
              return (
                <button
                  key={lId}
                  type="button"
                  onClick={() => cambiarLineaSesion(lId)}
                  style={{
                    backgroundColor: active ? PAL.accent : 'transparent',
                    color: active ? '#191919' : PAL.onHeader,
                    border: active ? '1px solid #fffa00' : '1px solid rgba(255,255,255,0.18)',
                    padding: '2px 7px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  L{lId}
                </button>
              );
            })}
          </div>

          {/* Selector rápido de Turno */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${PAL.onHeaderLine}`,
              padding: '3px 6px',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: PAL.onHeaderMuted, fontSize: '10px', fontFamily: 'var(--font-mono)', marginRight: '2px' }}>
              TURNO:
            </span>
            {[1, 2, 3].map((tId) => {
              const active = sesion.turno.id === tId;
              return (
                <button
                  key={tId}
                  type="button"
                  onClick={() => cambiarTurnoSesion(tId)}
                  style={{
                    backgroundColor: active ? PAL.accent : 'transparent',
                    color: active ? '#191919' : PAL.onHeader,
                    border: active ? '1px solid #fffa00' : '1px solid rgba(255,255,255,0.18)',
                    padding: '2px 7px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  T{tId}
                </button>
              );
            })}
          </div>

          {/* Indicador de Operador y Estado */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${PAL.onHeaderLine}`,
              padding: '5px 11px',
              borderRadius: '3px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
              }}
              title="Sesión activa"
            />
            <span style={{ color: PAL.onHeaderMuted, fontSize: '11px' }}>
              {NOMBRES_ROLES[sesion.usuario.id_rol] ?? sesion.usuario.id_rol} ·
            </span>
            <strong style={{ color: PAL.onHeader, fontWeight: 600 }}>{sesion.usuario.nombre_completo}</strong>
          </div>

          {/* Botón Sincronizar con BD */}
          <button
            type="button"
            onClick={() => sincronizarAhora()}
            style={{
              padding: '5px 9px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#fafafa',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: `1px solid ${PAL.onHeaderLine}`,
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
            title="Sincronizar colas y registros con PostgreSQL"
          >
            <Icon name="sync" size={14} color="#fffa00" />
            <span>SYNC</span>
          </button>

          {/* Botón Cerrar Sesión */}
          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#191919',
                backgroundColor: PAL.accent,
                border: '1px solid #fffa00',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
              }}
              title="Cerrar turno y salir al login"
            >
              <Icon name="logout" size={15} color="#191919" />
              <span>SALIR</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PESTAÑAS ABIERTAS ESTILO VS CODE */}
      <nav
        style={{
          display: 'flex',
          gap: '2px',
          padding: '0 14px',
          backgroundColor: PAL.tabBg,
          overflowX: 'auto',
          borderBottom: `1px solid ${PAL.border}`,
        }}
      >
        {openTabIds
          .map((tabId) => items.find((i) => i.id === tabId))
          .filter((item): item is MenuItem => Boolean(item))
          .map((item) => {
            const activo = vistaActual === item.id;
            const puedeCerrar = openTabIds.length > 1;
            return (
              <div
                key={item.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: activo ? PAL.tabActiveBg : 'transparent',
                  borderBottom: activo ? '3px solid #191919' : '3px solid transparent',
                  boxShadow: activo ? 'inset 0 -3px 0 #fffa00' : 'none',
                  borderRight: `1px solid ${PAL.border}`,
                }}
              >
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: activo ? 700 : 500,
                    letterSpacing: '0.1px',
                    padding: '9px 10px 9px 13px',
                    backgroundColor: 'transparent',
                    color: activo ? PAL.textStrong : PAL.textMuted,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => setVistaActual(item.id)}
                >
                  {item.iconName && (
                    <Icon
                      name={item.iconName}
                      size={16}
                      color={activo ? '#191919' : PAL.textDim}
                    />
                  )}
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        backgroundColor: item.badgeAlert ? '#ef4444' : activo ? '#fffa00' : '#e5e5e5',
                        color: item.badgeAlert ? '#ffffff' : '#191919',
                        lineHeight: 1.2,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
                {puedeCerrar && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(item.id);
                    }}
                    title={`Cerrar pestaña ${item.label}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: PAL.textDim,
                      cursor: 'pointer',
                      padding: '4px 8px 4px 2px',
                      fontSize: '13px',
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
      </nav>
    </header>
  );
}
