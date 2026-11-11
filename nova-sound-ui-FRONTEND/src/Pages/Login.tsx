import React, { useState } from 'react';
import { usePlanta } from '../context/PlantaContext';
import Icon from '../components/common/Icon';
import LogoBocina from '../components/common/LogoBocina';

interface CredencialPrueba {
  rol: string;
  login: string;
  pass: string;
  nombre: string;
  nomina: string;
  badgeClass: string;
}

const ACCESOS_RAPIDOS: CredencialPrueba[] = [
  { rol: 'Administrador', login: 'admin1', pass: 'hash680', nombre: 'Marcela Juárez', nomina: 'EMP-005', badgeClass: 'badge-neutral' },
  { rol: 'Inspector Calidad', login: 'inspector1', pass: 'hash123', nombre: 'Juan Pérez', nomina: 'EMP-001', badgeClass: 'badge-neutral' },
  { rol: 'Operador Línea', login: 'operador1', pass: 'hash456', nombre: 'Carlos Hernández', nomina: 'EMP-002', badgeClass: 'badge-neutral' },
  { rol: 'Supervisor', login: 'supervisor1', pass: 'hash789', nombre: 'Fernanda Gómez', nomina: 'EMP-003', badgeClass: 'badge-neutral' },
  { rol: 'Gerente Planta', login: 'gerente1', pass: 'hash024', nombre: 'Eduardo Díaz', nomina: 'EMP-004', badgeClass: 'badge-neutral' },
];

// Opción 2: gris claro + azul acero. Diseño plano, sin brillos.
const PAL = {
  accent: '#2b6cb0',
  accentSoftBg: 'rgba(43, 108, 176, 0.10)',
  cardBg: '#ffffff',
  cardBgElevated: '#f5f7f9',
  inputBg: '#ffffff',
  border: '#cfd6dd',
  borderSoft: '#dde3e8',
  textStrong: '#1f2933',
  textMuted: '#667085',
  textDim: '#8a94a3',
  success: '#2f9e44',
};

const getIniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export const Login: React.FC = () => {
  const { iniciarSesion } = usePlanta();

  const [loginInput, setLoginInput] = useState('');
  const [contrasenaInput, setContrasenaInput] = useState('');
  const [lineaId, setLineaId] = useState<number>(1);
  const [turnoId, setTurnoId] = useState<number>(1);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !contrasenaInput.trim()) {
      setErrorMensaje('Ingrese su nómina o nombre de usuario y contraseña.');
      return;
    }

    setCargando(true);
    setErrorMensaje(null);

    const res = await iniciarSesion(loginInput.trim(), contrasenaInput.trim(), lineaId, turnoId);
    setCargando(false);

    if (!res.ok) {
      setErrorMensaje(res.error || 'Credenciales no válidas.');
    }
  };

  const aplicarAccesoRapido = (item: CredencialPrueba) => {
    setLoginInput(item.login);
    setContrasenaInput(item.pass);
    setErrorMensaje(null);
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    backgroundColor: PAL.inputBg,
    border: `1px solid ${PAL.border}`,
    borderRadius: '4px',
    color: PAL.textStrong,
    transition: 'border-color 0.15s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: PAL.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '4px',
    fontFamily: 'var(--font-sans)',
  };

  const focusAccent = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = PAL.accent;
  };
  const blurAccent = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = PAL.border;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        position: 'relative',
      }}
    >
      <div className="login-shell" style={{ position: 'relative', zIndex: 1 }}>
        {/* ===== Lado izquierdo: identidad de marca / línea de producción ===== */}
        <aside className="login-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoBocina size={40} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px', color: '#ffffff' }}>
                NOVA SOUND
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.68)', fontFamily: 'var(--font-sans)', marginTop: '2px' }}>
                Manufactura de bocinas Bluetooth
              </div>
            </div>
          </div>

          {/* Anillos de cono de bocina (decorativo) */}
          <div className="login-hero-art" style={{ display: 'flex', justifyContent: 'center' }} aria-hidden="true">
            <svg width="170" height="170" viewBox="0 0 230 230">
              <circle cx="115" cy="115" r="108" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
              <circle cx="115" cy="115" r="108" fill="none" stroke="#7fb2ea" strokeWidth="3" strokeDasharray="120 560" strokeLinecap="round" />
              <circle cx="115" cy="115" r="82" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
              <circle cx="115" cy="115" r="58" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <circle cx="115" cy="115" r="36" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <circle cx="115" cy="115" r="12" fill="#7fb2ea" />
            </svg>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.68)', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>
              Familias en producción
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Mini', 'Pro', 'Sport', 'Max'].map((m) => (
                <span
                  key={m}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: '3px',
                    padding: '3px 10px',
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* ===== Lado derecho: formulario de acceso ===== */}
        <div className="login-form-side">
          {/* Cabecera del formulario */}
          <div
            style={{
              padding: '12px 24px 10px',
              borderBottom: `1px solid ${PAL.borderSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: PAL.textStrong,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Iniciar Sesión
                <span
                  style={{
                    fontSize: '10px',
                    color: '#ffffff',
                    backgroundColor: PAL.accent,
                    padding: '1px 7px',
                    borderRadius: '3px',
                    fontWeight: 700,
                  }}
                >
                  HMI / MES
                </span>
              </h1>
              <div style={{ fontSize: '11.5px', color: PAL.textDim, fontFamily: 'var(--font-sans)', marginTop: '2px' }}>
                Ingresa con tu nómina para abrir turno
              </div>
            </div>

            <div style={{ color: PAL.success, fontSize: '11px', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PAL.success,  }} />
              ONLINE
            </div>
          </div>

          <div style={{ padding: '14px 24px', flex: 1 }}>
            {errorMensaje && (
              <div className="alert-banner alert-banner-error" style={{ marginBottom: '10px', borderRadius: '4px' }}>
                <Icon name="error" size={18} color="#ef4444" />
                <span style={{ flex: 1 }}>{errorMensaje}</span>
                <button
                  type="button"
                  onClick={() => setErrorMensaje(null)}
                  style={{ background: 'transparent', border: 'none', color: '#d64545', cursor: 'pointer', padding: 0 }}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Campo: Nómina / Usuario */}
              <div>
                <label htmlFor="login-input" style={labelStyle}>
                  Nómina o Usuario de Acceso:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-input"
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    onFocus={focusAccent}
                    onBlur={blurAccent}
                    placeholder="Ej. EMP-005 o admin1"
                    autoComplete="username"
                    autoFocus
                    style={{ ...inputBaseStyle, paddingLeft: '34px', padding: '7px 12px 7px 34px' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: PAL.textDim,
                      display: 'flex',
                      pointerEvents: 'none',
                    }}
                  >
                    <Icon name="account_circle" size={18} />
                  </span>
                </div>
              </div>

              {/* Campo: Contraseña / PIN */}
              <div>
                <label htmlFor="pass-input" style={labelStyle}>
                  Contraseña o Hash de Operador:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="pass-input"
                    type={mostrarPassword ? 'text' : 'password'}
                    value={contrasenaInput}
                    onChange={(e) => setContrasenaInput(e.target.value)}
                    onFocus={focusAccent}
                    onBlur={blurAccent}
                    placeholder="Ingrese su clave (ej. hash680 o admin1)"
                    autoComplete="current-password"
                    style={{ ...inputBaseStyle, padding: '7px 38px 7px 34px' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: PAL.textDim,
                      display: 'flex',
                      pointerEvents: 'none',
                    }}
                  >
                    <Icon name="lock" size={18} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: PAL.textMuted,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                    }}
                    title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    <Icon name={mostrarPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              {/* Selección de Línea y Turno de Piso */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="linea-select" style={labelStyle}>
                    Línea Asignada:
                  </label>
                  <select
                    id="linea-select"
                    value={lineaId}
                    onChange={(e) => setLineaId(Number(e.target.value))}
                    onFocus={focusAccent}
                    onBlur={blurAccent}
                    style={{ ...inputBaseStyle, padding: '7px 12px' }}
                  >
                    <option value={1}>L1 (Mini / Pro)</option>
                    <option value={2}>L2 (Sport / Mini)</option>
                    <option value={3}>L3 (Pro / Max)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="turno-select" style={labelStyle}>
                    Turno Activo:
                  </label>
                  <select
                    id="turno-select"
                    value={turnoId}
                    onChange={(e) => setTurnoId(Number(e.target.value))}
                    onFocus={focusAccent}
                    onBlur={blurAccent}
                    style={{ ...inputBaseStyle, padding: '7px 12px' }}
                  >
                    <option value={1}>Mañana (06:00 - 14:00)</option>
                    <option value={2}>Tarde (14:00 - 22:00)</option>
                  </select>
                </div>
              </div>

              {/* Botón de Submit */}
              <button
                type="submit"
                disabled={cargando}
                style={{
                  width: '100%',
                  padding: '9px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '2px',
                  backgroundColor: PAL.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  
                  cursor: cargando ? 'default' : 'pointer',
                  opacity: cargando ? 0.7 : 1,
                }}
              >
                <Icon name={cargando ? 'sync' : 'login'} size={18} className={cargando ? 'spin' : ''} />
                {cargando ? 'Autenticando credenciales...' : 'Iniciar sesión y entrar a piso'}
              </button>
            </form>

            {/* Accesos Rápidos para Pruebas / Calificación Escolar */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${PAL.borderSoft}` }}>
              <div
                style={{
                  fontSize: '11px',
                  color: PAL.textDim,
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="touch_app" size={14} color={PAL.accent} />
                Acceso Rápido para Pruebas y Demostración
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {ACCESOS_RAPIDOS.map((acc) => (
                  <button
                    key={acc.login}
                    type="button"
                    title={`Usuario: ${acc.login}`}
                    onClick={() => aplicarAccesoRapido(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      backgroundColor: '#ffffff',
                      border: `1px solid ${PAL.borderSoft}`,
                      padding: '5px 8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      borderRadius: '4px',
                      minWidth: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = PAL.accent;
                      e.currentTarget.style.backgroundColor = '#f5f7f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = PAL.borderSoft;
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: PAL.accentSoftBg,
                        color: PAL.accent,
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-sans)',
                        flexShrink: 0,
                      }}
                    >
                      {getIniciales(acc.nombre)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: PAL.textStrong, fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.nombre}
                      </div>
                      <div style={{ color: PAL.textDim, fontSize: '10px', fontFamily: 'var(--font-sans)' }}>{acc.rol}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pie de terminal */}
          <div
            style={{
              padding: '7px 24px',
              backgroundColor: PAL.cardBgElevated,
              borderTop: `1px solid ${PAL.borderSoft}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              fontFamily: 'var(--font-sans)',
              color: PAL.textDim,
            }}
          >
            <span>Sistema MES / SCADA v2.4</span>
            <span>PostgreSQL (Neon.tech)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
