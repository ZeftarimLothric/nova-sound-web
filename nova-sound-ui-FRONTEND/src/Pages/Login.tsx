import React, { useState } from 'react';
import { usePlanta, USUARIOS_OFICIALES, NOMBRES_ROLES, CATALOGO_LINEAS, CATALOGO_TURNOS } from '../context/PlantaContext';

export default function Login() {
  const { iniciarSesion } = usePlanta();

  const [usuarioLogin, setUsuarioLogin] = useState<string>('admin_ns');
  const [contrasena, setContrasena] = useState<string>('123456');
  const [lineaId, setLineaId] = useState<number>(1);
  const [turnoId, setTurnoId] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    const res = await iniciarSesion(usuarioLogin, contrasena, lineaId, turnoId);
    if (!res.ok) {
      setErrorMsg(res.error || 'Credenciales no válidas.');
    }
    setCargando(false);
  };

  const handleQuickLogin = (login: string) => {
    setUsuarioLogin(login);
    setContrasena('123456');
  };

  return (
    <div className="login-screen tex-grid">
      {/* FRANJA DE ADVERTENCIA LATERAL ENDFIELD */}
      <div className="login-deco-stripe-left tex-warn-stripes" />
      <div className="login-deco-accent-line" />

      {/* TARJETA DE ACCESO TÉCNICO */}
      <div className="login-card-container tex-carbon">
        {/* LOGO ENDFIELD BRAND */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'var(--accent)',
              color: 'var(--dark-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.4rem',
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
              borderLeft: '4px solid var(--dark-900)',
            }}
          >
            NS
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.6rem',
                letterSpacing: '-0.5px',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              NOVA SOUND
            </h1>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--accent)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              CONTROL MES // SCADA INDUSTRIAL
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            [AUTH_FAIL] {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">USUARIO / CLAVE OPERATIVA</label>
            <input
              type="text"
              required
              className="form-input"
              value={usuarioLogin}
              onChange={(e) => setUsuarioLogin(e.target.value)}
              placeholder="Ej. admin_ns, operador_ns"
            />
          </div>

          <div className="form-group">
            <label className="form-label">PIN / CONTRASEÑA</label>
            <input
              type="password"
              required
              className="form-input"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="123456"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">LÍNEA INICIAL</label>
              <select className="form-select" value={lineaId} onChange={(e) => setLineaId(Number(e.target.value))}>
                {CATALOGO_LINEAS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre_linea} (Activa)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">TURNO DE PLANTA</label>
              <select className="form-select" value={turnoId} onChange={(e) => setTurnoId(Number(e.target.value))}>
                {CATALOGO_TURNOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre_turno}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="btn btn-yellow"
            style={{ width: '100%', height: '3.2rem', marginTop: '0.5rem', fontSize: '0.9rem' }}
          >
            {cargando ? 'AUTENTICANDO TERMINAL...' : 'INGRESAR A TERMINAL SCADA'}
          </button>
        </form>

        {/* ACCESOS RÁPIDOS A LOS 9 ROLES OFICIALES PARA PRUEBAS (P-02 / P-37) */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--dark-600)', paddingTop: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gray-300)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            ACCESO RÁPIDO POR ROL (SIMULACIÓN DE PRUEBAS):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {USUARIOS_OFICIALES.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.usuario_login)}
                className="btn btn-dark"
                style={{
                  height: '2rem',
                  padding: '0 0.4rem',
                  fontSize: '0.65rem',
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderColor: usuarioLogin === u.usuario_login ? 'var(--accent)' : undefined,
                  color: usuarioLogin === u.usuario_login ? 'var(--accent)' : undefined,
                }}
                title={`${NOMBRES_ROLES[u.id_rol]} - ${u.nombre_completo}`}
              >
                R{u.id_rol}: {u.usuario_login}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', fontSize: '0.65rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          NOVA SOUND MES V2.4 // HMI SYSTEM ARCHITECTURE // ENDFIELD DESIGN
        </div>
      </div>
    </div>
  );
}
