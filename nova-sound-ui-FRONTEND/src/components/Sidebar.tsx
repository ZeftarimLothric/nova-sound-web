import { useState } from 'react';
import Icon from './common/Icon';
import type { MenuItem } from './Topbar';

interface SidebarProps {
  items: MenuItem[];
  vistaActual: string;
  openTabIds: string[];
  onSelectModule: (id: string) => void;
}

export default function Sidebar({ items, vistaActual, openTabIds, onSelectModule }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);

  const expanded = hovered || pinned;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: expanded ? '224px' : '52px',
        minWidth: expanded ? '224px' : '52px',
        backgroundColor: '#191919',
        borderRight: '2px solid #2b2b2b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.16s ease, min-width 0.16s ease',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 20,
      }}
      aria-label="Módulos de planta"
    >
      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '6px' }}>
        {/* Cabecera del Explorer */}
        <div
          style={{
            height: '30px',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'space-between' : 'center',
            color: 'rgba(250,250,250,0.55)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.8px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '4px',
          }}
        >
          {expanded ? (
            <>
              <span>MÓDULOS</span>
              <button
                type="button"
                onClick={() => setPinned((p) => !p)}
                title={pinned ? 'Desfijar barra lateral' : 'Fijar barra lateral'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: pinned ? '#fffa00' : 'rgba(250,250,250,0.5)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="push_pin" size={14} color={pinned ? '#fffa00' : 'rgba(250,250,250,0.5)'} />
              </button>
            </>
          ) : (
            <Icon name="apps" size={16} color="rgba(250,250,250,0.55)" />
          )}
        </div>

        {/* Lista de módulos */}
        {items.map((item) => {
          const activo = vistaActual === item.id;
          const abierto = openTabIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              title={!expanded ? `${item.code} · ${item.label}` : undefined}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                height: '38px',
                padding: expanded ? '0 12px 0 14px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                backgroundColor: activo ? 'rgba(255, 250, 0, 0.12)' : 'transparent',
                color: activo ? '#fffa00' : abierto ? '#fafafa' : 'rgba(250, 250, 250, 0.65)',
                border: 'none',
                borderLeft: activo ? '3px solid #fffa00' : '3px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '12.5px',
                fontWeight: activo ? 700 : 500,
                whiteSpace: 'nowrap',
                transition: 'background-color 0.12s ease, color 0.12s ease',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', flexShrink: 0 }}>
                {item.iconName && (
                  <Icon
                    name={item.iconName}
                    size={18}
                    color={activo ? '#fffa00' : abierto ? '#fafafa' : 'rgba(250, 250, 250, 0.65)'}
                  />
                )}
                {!expanded && typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-4px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: item.badgeAlert ? '#ef4444' : '#fffa00',
                    }}
                  />
                )}
              </div>

              {expanded && (
                <>
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        backgroundColor: item.badgeAlert ? '#ef4444' : '#fffa00',
                        color: item.badgeAlert ? '#ffffff' : '#191919',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Pie discreto del sidebar */}
      <div
        style={{
          padding: '8px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '9.5px',
          color: 'rgba(250,250,250,0.4)',
        }}
      >
        {expanded ? `${openTabIds.length} PESTAÑAS ABIERTAS` : `${openTabIds.length}`}
      </div>
    </aside>
  );
}

