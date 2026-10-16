import React, { useState } from 'react';
import { usePlanta } from '../context/PlantaContext';
import Icon from '../components/common/Icon';

interface CredencialPrueba {
  rol: string;
  login: string;
  pass: string;
  nombre: string;
  nomina: string;
  badgeClass: string;
}

const ACCESOS_RAPIDOS: CredencialPrueba[] = [
  { rol: 'Administrador', login: 'admin1', pass: 'hash680', nombre: 'Marcela Juárez', nomina: 'EMP-005', badgeClass: 'badge-ok' },
  { rol: 'Inspector Calidad', login: 'inspector1', pass: 'hash123', nombre: 'Juan Pérez', nomina: 'EMP-001', badgeClass: 'badge-info' },
  { rol: 'Operador Línea', login: 'operador1', pass: 'hash456', nombre: 'Carlos Hernández', nomina: 'EMP-002', badgeClass: 'badge-warn' },
  { rol: 'Supervisor', login: 'supervisor1', pass: 'hash789', nombre: 'Fernanda Gómez', nomina: 'EMP-003', badgeClass: 'badge-neutral' },
  { rol: 'Gerente Planta', login: 'gerente1', pass: 'hash024', nombre: 'Eduardo Díaz', nomina: 'EMP-004', badgeClass: 'badge-danger' },
];

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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      {/* Fondo técnico con patrón de rejilla industrial sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.04) 0%, transparent 60%), linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Panel del Login */}
        <div className="panel" style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)' }}>
          {/* Cabecera Técnica de Terminal */}
          <div
            className="panel-header"
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1f2c3f',
              backgroundColor: '#0e1520',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#10b981',
                  borderRadius: '1px',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                }}
              />
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#f8fafc',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  NOVA SOUND
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#38bdf8',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      padding: '1px 6px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '2px',
                      fontWeight: 600,
                    }}
                  >
                    HMI / MES
                  </span>
                </h1>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  TERMINAL DE ACCESO A PISO · AUTENTICACIÓN NEON
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <Icon name="cloud_done" size={16} />
              <span>ONLINE</span>
            </div>
          </div>

          <div className="panel-body" style={{ padding: '24px 20px' }}>
            {errorMensaje && (
              <div className="alert-banner alert-banner-error" style={{ marginBottom: '18px' }}>
                <Icon name="error" size={18} color="#ef4444" />
                <span style={{ flex: 1 }}>{errorMensaje}</span>
                <button
                  type="button"
                  onClick={() => setErrorMensaje(null)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Campo: Nómina / Usuario */}
              <div>
                <label
                  htmlFor="login-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <Icon name="badge" size={16} color="#38bdf8" />
                  Nómina o Usuario de Acceso:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-input"
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Ej. EMP-005 o admin1"
                    autoComplete="username"
                    autoFocus
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      paddingLeft: '34px',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#475569',
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
                <label
                  htmlFor="pass-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <Icon name="key" size={16} color="#38bdf8" />
                  Contraseña o Hash de Operador:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="pass-input"
                    type={mostrarPassword ? 'text' : 'password'}
                    value={contrasenaInput}
                    onChange={(e) => setContrasenaInput(e.target.value)}
                    placeholder="Ingrese su clave (ej. hash680 o admin1)"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      paddingLeft: '34px',
                      paddingRight: '38px',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#475569',
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
                      color: '#64748b',
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
                  <label
                    htmlFor="linea-select"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <Icon name="precision_manufacturing" size={15} color="#f59e0b" />
                    Línea Asignada:
                  </label>
                  <select
                    id="linea-select"
                    value={lineaId}
                    onChange={(e) => setLineaId(Number(e.target.value))}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  >
                    <option value={1}>L1 (Mini / Pro)</option>
                    <option value={2}>L2 (Sport / Mini)</option>
                    <option value={3}>L3 (Pro / Max)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="turno-select"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <Icon name="schedule" size={15} color="#38bdf8" />
                    Turno Activo:
                  </label>
                  <select
                    id="turno-select"
                    value={turnoId}
                    onChange={(e) => setTurnoId(Number(e.target.value))}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
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
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <Icon name={cargando ? 'sync' : 'login'} size={18} className={cargando ? 'spin' : ''} />
                {cargando ? 'AUTENTICANDO CREDENCIALES...' : 'INICIAR SESIÓN Y ENTRAR A PISO'}
              </button>
            </form>

            {/* Accesos Rápidos para Pruebas / Calificación Escolar */}
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #1a2535' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="touch_app" size={14} color="#38bdf8" />
                Acceso Rápido para Pruebas y Demostración:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ACCESOS_RAPIDOS.map((acc) => (
                  <button
                    key={acc.login}
                    type="button"
                    onClick={() => aplicarAccesoRapido(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#121a26',
                      border: '1px solid #1e2a3b',
                      padding: '7px 12px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.backgroundColor = '#172233';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1e2a3b';
                      e.currentTarget.style.backgroundColor = '#121a26';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${acc.badgeClass}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {acc.rol}
                      </span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{acc.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px' }}>
                      <code>{acc.login}</code>
                      <Icon name="arrow_forward" size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pie de terminal */}
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#0a0e15',
              borderTop: '1px solid #16202e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#475569',
            }}
          >
            <span>SISTEMA MES / SCADA V2.4</span>
            <span>POSTGRESQL (NEON.TECH)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
