import type { JSX } from 'react/jsx-runtime';
import type { SesionOperativa } from '../types/database';
import { RolesEnum } from '../types/database';
import Icon from './common/LogoBocina';
import LogoBocina from './common/Icon';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  roles: number[];
  component: JSX.Element;
}

interface TopbarProps {
  sesion: SesionOperativa;
  items: MenuItem[];
  vistaActual: string;
  setVistaActual: (id: string) => void;
  onCambiarRol: (idRol: number) => void;
  onCerrarSesion?: () => void;
}

const NOMBRE_ROL: Record<number, string> = {
  [RolesEnum.OPERADOR]: 'Operador',
  [RolesEnum.INSPECTOR_CALIDAD]: 'Inspector Calidad',
  [RolesEnum.SUPERVISOR]: 'Supervisor',
  [RolesEnum.GERENTE]: 'Gerente',
  [RolesEnum.ADMINISTRADOR]: 'Administrador',
};

// Opción 2: gris claro + azul acero. Encabezado azul marino, cuerpo claro, diseño plano.
const PAL = {
  accent: '#2b6cb0',
  headerBg: '#243b53',
  onHeader: '#ffffff',
  onHeaderMuted: 'rgba(255, 255, 255, 0.68)',
  onHeaderLine: 'rgba(255, 255, 255, 0.22)',
  tabBg: '#f5f7f9',
  tabActiveBg: '#ffffff',
  border: '#cfd6dd',
  textStrong: '#1f2933',
  textMuted: '#667085',
  textDim: '#8a94a3',
};

export default function Topbar({
  sesion,
  items,
  vistaActual,
  setVistaActual,
  onCambiarRol: _onCambiarRol,
  onCerrarSesion,
}: TopbarProps) {
  return (
    <header
      style={{
        backgroundColor: PAL.headerBg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. BARRA PRINCIPAL: BRANDING + TELEMETRÍA DE PLANTA + SESIÓN */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '9px 16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Identidad de Marca y Sistema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoBocina size={30} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
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
                color: '#ffffff',
                backgroundColor: PAL.accent,
                padding: '1px 7px',
                borderRadius: '3px',
                fontWeight: 700,
              }}
            >
              MES / HMI
            </span>
          </div>
        </div>

        {/* Ficha Operativa en Vivo + Control de Sesión */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Indicadores de Estación y Operador */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              border: `1px solid ${PAL.onHeaderLine}`,
              padding: '5px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="badge" size={15} color="#9cc4ee" />
              <span style={{ color: PAL.onHeaderMuted, fontSize: '11px', textTransform: 'uppercase' }}>
                {NOMBRE_ROL[sesion.usuario.id_rol] ?? sesion.usuario.id_rol}:
              </span>{' '}
              <strong style={{ color: PAL.onHeader }}>{sesion.usuario.nombre_completo}</strong>{' '}
              <span style={{ color: '#9cc4ee', fontSize: '11px' }}>({sesion.usuario.nomina})</span>
            </div>
            <span style={{ color: PAL.onHeaderLine }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="precision_manufacturing" size={15} color="#8ee29f" />
              <span style={{ color: PAL.onHeaderMuted, fontSize: '11px' }}>LÍNEA:</span>{' '}
              <span className="badge" style={{ padding: '1px 6px', fontSize: '10px', color: '#8ee29f', backgroundColor: 'rgba(142, 226, 159, 0.14)', border: '1px solid rgba(142, 226, 159, 0.45)' }}>
                {sesion.linea.nombre_linea}
              </span>
            </div>
            <span style={{ color: PAL.onHeaderLine }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="schedule" size={15} color="#f2c14e" />
              <span style={{ color: PAL.onHeaderMuted, fontSize: '11px' }}>TURNO:</span>{' '}
              <strong style={{ color: '#f2c14e', fontSize: '11px' }}>
                {sesion.turno.nombre_turno.toUpperCase()}
              </strong>
            </div>
          </div>

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
                color: '#ffffff',
                border: `1px solid ${PAL.onHeaderMuted}`,
                backgroundColor: 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
              title="Cerrar turno y salir al login"
            >
              <Icon name="logout" size={15} color="#ffffff" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PESTAÑAS DE NAVEGACIÓN ENTRE ESTACIONES CON GOOGLE MATERIAL SYMBOLS */}
      <nav
        style={{
          display: 'flex',
          gap: '2px',
          padding: '0 12px',
          backgroundColor: PAL.tabBg,
          overflowX: 'auto',
          borderBottom: `1px solid ${PAL.border}`,
        }}
      >
        {items.map((item) => {
          const activo = vistaActual === item.id;
          return (
            <button
              key={item.id}
              type="button"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: activo ? 700 : 500,
                letterSpacing: '0.3px',
                padding: '9px 14px',
                backgroundColor: activo ? PAL.tabActiveBg : 'transparent',
                color: activo ? PAL.textStrong : PAL.textMuted,
                border: 'none',
                borderBottom: activo ? `3px solid ${PAL.accent}` : '3px solid transparent',
                borderRight: 'none',
                borderLeft: 'none',
                borderRadius: '0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setVistaActual(item.id)}
            >
              {item.icon && (
                <Icon
                  name={item.icon}
                  size={16}
                  color={activo ? PAL.accent : PAL.textDim}
                />
              )}
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}