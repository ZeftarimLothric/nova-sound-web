import type { JSX } from 'react/jsx-runtime';
import type { SesionOperativa } from '../types/database';
import { RolesEnum } from '../types/database';
import Icon from './common/Icon';

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

export default function Topbar({
  sesion,
  items,
  vistaActual,
  setVistaActual,
  onCambiarRol,
  onCerrarSesion,
}: TopbarProps) {
  return (
    <header
      style={{
        backgroundColor: '#0e1520',
        borderBottom: '1px solid #1f2c3f',
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
          padding: '8px 16px',
          borderBottom: '1px solid #16202e',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Identidad de Marca y Sistema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              borderRadius: '1px',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: '#f8fafc',
              }}
            >
              NOVA SOUND
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                padding: '1px 6px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '2px',
                fontWeight: 600,
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
              backgroundColor: '#070a10',
              border: '1px solid #1a2536',
              padding: '4px 10px',
              borderRadius: '2px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="badge" size={15} color="#38bdf8" />
              <span style={{ color: '#64748b', fontSize: '11px' }}>OPERADOR:</span>{' '}
              <strong style={{ color: '#f1f5f9' }}>{sesion.usuario.nombre_completo}</strong>{' '}
              <span style={{ color: '#38bdf8', fontSize: '11px' }}>({sesion.usuario.nomina})</span>
            </div>
            <span style={{ color: '#263449' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="precision_manufacturing" size={15} color="#10b981" />
              <span style={{ color: '#64748b', fontSize: '11px' }}>LÍNEA:</span>{' '}
              <span className="badge badge-ok" style={{ padding: '1px 5px', fontSize: '10px' }}>
                {sesion.linea.nombre_linea}
              </span>
            </div>
            <span style={{ color: '#263449' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="schedule" size={15} color="#f59e0b" />
              <span style={{ color: '#64748b', fontSize: '11px' }}>TURNO:</span>{' '}
              <strong style={{ color: '#f59e0b', fontSize: '11px' }}>
                {sesion.turno.nombre_turno.toUpperCase()}
              </strong>
            </div>
          </div>

          {/* Selector de Rol para Pruebas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Icon name="swap_horiz" size={15} color="#64748b" />
            <span style={{ color: '#64748b', textTransform: 'uppercase' }}>Rol:</span>
            <select
              value={sesion.usuario.id_rol}
              onChange={(e) => onCambiarRol(Number(e.target.value))}
              style={{
                backgroundColor: '#121a26',
                color: '#38bdf8',
                border: '1px solid #233145',
                borderRadius: '2px',
                padding: '3px 24px 3px 6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value={RolesEnum.OPERADOR}>Operador</option>
              <option value={RolesEnum.INSPECTOR_CALIDAD}>Inspector Calidad</option>
              <option value={RolesEnum.SUPERVISOR}>Supervisor</option>
              <option value={RolesEnum.GERENTE}>Gerente</option>
              <option value={RolesEnum.ADMINISTRADOR}>Administrador</option>
            </select>
          </div>

          {/* Botón Cerrar Sesión */}
          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="btn btn-secondary"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
              }}
              title="Cerrar turno y salir al login"
            >
              <Icon name="logout" size={15} color="#ef4444" />
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
          backgroundColor: '#080c13',
          overflowX: 'auto',
          borderBottom: '1px solid #16202e',
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
                backgroundColor: activo ? '#121824' : 'transparent',
                color: activo ? '#f8fafc' : '#7d8da1',
                border: 'none',
                borderTop: activo ? '2px solid #0284c7' : '2px solid transparent',
                borderRight: '1px solid #141c28',
                borderLeft: '1px solid #141c28',
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
                  color={activo ? '#38bdf8' : '#64748b'}
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
