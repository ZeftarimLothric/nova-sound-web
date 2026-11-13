import React, { useState } from 'react';
import {
  usePlanta,
  USUARIOS_OFICIALES,
  NOMBRES_ROLES,
  CATALOGO_LINEAS,
  CATALOGO_TURNOS,
} from '../context/PlantaContext';
import Icon from '../components/common/Icon';
import LogoBocina from '../components/common/LogoBocina';

const PAL = {
  accent: '#fffa00',
  carbon: '#191919',
  cardBg: '#fafafa',
  inputBg: '#ffffff',
  border: '#d9d9d9',
  borderSoft: '#e5e5e5',
  textStrong: '#191919',
  textMuted: '#666666',
  textDim: '#888888',
  success: '#059669',
};

export default function Login() {
  const { iniciarSesion, backendOnline, modoMantenimiento } = usePlanta();

  const [loginInput, setLoginInput] = useState('admin_ns');
  const [contrasenaInput, setContrasenaInput] = useState('123456');
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

  const aplicarAccesoRapido = (login: string) => {
    setLoginInput(login);
    setContrasenaInput('123456');
    setErrorMensaje(null);
  };

  return (
    <div
      className="tex-grid"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
      }}
    >
      <div className="login-shell">
        {/* ===== Lado izquierdo: identidad de marca / línea de producción ===== */}
        <aside className="login-hero tex-carbon-subtle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoBocina size={40} />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: '#ffffff',
                }}
              >
                NOVA SOUND
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '2px',
                }}
              >
                MANUFACTURA DE BOCINAS BLUETOOTH
              </div>
            </div>
          </div>

          {/* Anillos de cono de bocina (Industrial Telemetry SVG) */}
          <div className="login-hero-art" style={{ display: 'flex', justifyContent: 'center' }} aria-hidden="true">
            <svg width="170" height="170" viewBox="0 0 230 230">
              <circle cx="115" cy="115" r="108" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
              <circle className="ef-spin-slow" cx="115" cy="115" r="108" fill="none" stroke="#fffa00" strokeWidth="3" strokeDasharray="120 560" strokeLinecap="butt" />
              <circle cx="115" cy="115" r="82" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="1.5" />
              <circle className="ef-spin-reverse" cx="115" cy="115" r="58" fill="none" stroke="rgba(255,250,0,0.45)" strokeWidth="1.5" strokeDasharray="45 180" />
              <circle cx="115" cy="115" r="36" fill="rgba(255,250,0,0.06)" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
              <circle className="ef-flash" cx="115" cy="115" r="12" fill="#fffa00" />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontSize: '10.5px',
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                fontFamily: 'var(--font-mono)',
                marginBottom: '8px',
              }}
            >
              Familias en producción
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Mini', 'Pro', 'Sport', 'Max'].map((m) => (
                <span
                  key={m}
                  className="chamfer-sm"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#191919',
                    backgroundColor: '#fffa00',
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
          <div
            style={{
              padding: '14px 24px 12px',
              borderBottom: `1px solid ${PAL.borderSoft}`,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: PAL.textStrong,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textTransform: 'uppercase',
                }}
              >
                Iniciar Sesión
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: '#191919',
                    backgroundColor: PAL.accent,
                    padding: '2px 7px',
                    fontWeight: 800,
                  }}
                >
                  HMI / MES
                </span>
              </h1>
              <div style={{ fontSize: '11.5px', color: PAL.textDim, marginTop: '2px' }}>
                Ingresa con tu usuario o nómina para abrir turno operativo
              </div>
            </div>

            <div
              style={{
                color: !backendOnline ? '#dc2626' : modoMantenimiento ? '#d97706' : PAL.success,
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title={
                !backendOnline
                  ? 'Backend API no detectado en localhost:4000'
                  : modoMantenimiento
                  ? 'Sistema en modo mantenimiento'
                  : 'Conectado a Backend API'
              }
            >
              <span
                className={backendOnline ? 'ef-flash' : undefined}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: !backendOnline ? '#ef4444' : modoMantenimiento ? '#f59e0b' : '#00ffa2',
                  border: `1px solid ${!backendOnline ? '#b91c1c' : modoMantenimiento ? '#b45309' : '#059669'}`,
                }}
              />
              {!backendOnline ? 'API OFFLINE' : modoMantenimiento ? 'MANTENIMIENTO' : 'ONLINE'}
            </div>
          </div>

          <div style={{ padding: '16px 24px', flex: 1 }}>
            {errorMensaje && (
              <div className="alert-banner alert-banner-error" style={{ marginBottom: '12px' }}>
                <Icon name="error" size={18} color="#dc2626" />
                <span style={{ flex: 1 }}>{errorMensaje}</span>
                <button
                  type="button"
                  onClick={() => setErrorMensaje(null)}
                  style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Usuario o Nómina</label>
                <input
                  type="text"
                  className="form-input"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Ej. admin_ns, op_ensamble..."
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    className="form-input"
                    value={contrasenaInput}
                    onChange={(e) => setContrasenaInput(e.target.value)}
                    placeholder="••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: '38px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: PAL.textMuted,
                      padding: '2px',
                    }}
                    title="Mostrar / ocultar contraseña"
                  >
                    <Icon name={mostrarPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              <div className="field-row">
                <div className="form-group">
                  <label className="form-label">Línea Operativa</label>
                  <select
                    className="form-select"
                    value={lineaId}
                    onChange={(e) => setLineaId(Number(e.target.value))}
                  >
                    {CATALOGO_LINEAS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre_linea}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Turno</label>
                  <select
                    className="form-select"
                    value={turnoId}
                    onChange={(e) => setTurnoId(Number(e.target.value))}
                  >
                    {CATALOGO_TURNOS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_turno} ({t.hora_inicio.slice(0, 5)}–{t.hora_fin.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="btn btn-carbon chamfer-btn"
                style={{ width: '100%', padding: '11px 16px', marginTop: '4px', fontSize: '12.5px' }}
              >
                <Icon name="login" size={17} color="#fffa00" />
                <span>{cargando ? 'VERIFICANDO...' : 'INGRESAR A ESTACIÓN'}</span>
              </button>
            </form>

            {/* Accesos rápidos de prueba (9 roles oficiales del backend auditado) */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${PAL.borderSoft}` }}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: PAL.textMuted,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Accesos Rápidos (Roles Oficiales — Pass: 123456)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {USUARIOS_OFICIALES.map((u) => {
                  const selected = loginInput === u.usuario_login;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => aplicarAccesoRapido(u.usuario_login)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: selected ? 800 : 600,
                        backgroundColor: selected ? PAL.accent : '#ffffff',
                        color: PAL.carbon,
                        border: `1px solid ${selected ? PAL.carbon : PAL.border}`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                      title={`${u.nombre_completo} (${u.nomina})`}
                    >
                      {NOMBRES_ROLES[u.id_rol]} · {u.usuario_login}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
