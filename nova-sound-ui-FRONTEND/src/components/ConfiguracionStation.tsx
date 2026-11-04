import { useState } from 'react';
import {
  usePlanta,
  USUARIOS_OFICIALES,
  NOMBRES_ROLES,
  CATALOGO_MODELOS,
  CATALOGO_CLIENTES,
  CATALOGO_DEFECTOS_OFICIALES,
} from '../context/PlantaContext';

export default function ConfiguracionStation() {
  const {
    bitacora,
    modoMantenimiento,
    mensajeMantenimiento,
    setModoMantenimiento,
  } = usePlanta();

  const [pestaña, setPestaña] = useState<'usuarios' | 'parametros' | 'catalogos' | 'bitacora'>('usuarios');
  const [nuevoMensajeMantenimiento, setNuevoMensajeMantenimiento] = useState(mensajeMantenimiento);
  const [mensajeLocal, setMensajeLocal] = useState<string | null>(null);

  const handleGuardarParametros = (e: React.FormEvent) => {
    e.preventDefault();
    setModoMantenimiento(modoMantenimiento, nuevoMensajeMantenimiento);
    setMensajeLocal('Parámetros de planta actualizados con éxito.');
  };

  const toggleMantenimiento = () => {
    const nuevoEstado = !modoMantenimiento;
    setModoMantenimiento(nuevoEstado, nuevoMensajeMantenimiento);
    setMensajeLocal(
      nuevoEstado
        ? 'AVISO DE MANTENIMIENTO ACTIVADO EN TODAS LAS TERMINALES'
        : 'SISTEMA RESTAURADO A MODO PRODUCCIÓN'
    );
  };

  return (
    <div className="station-container">
      {/* HEADER ENDFIELD */}
      <div className="station-header tex-carbon">
        <div className="station-header-left">
          <div className="station-deco-sq">SYS</div>
          <div className="station-title-box">
            <span className="station-badge-code">[SISTEMAS_ADMIN // GOBERNANZA BASE DE DATOS]</span>
            <h1 className="station-title">Configuración, Catálogos y Parámetros</h1>
            <span className="station-subtitle">
              Administración de los 9 roles oficiales, aviso de mantenimiento y bitácora técnica
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <button
            onClick={toggleMantenimiento}
            className={`btn ${modoMantenimiento ? 'btn-danger' : 'btn-yellow'}`}
          >
            {modoMantenimiento ? 'DESACTIVAR MANTENIMIENTO' : 'ACTIVAR MODO MANTENIMIENTO'}
          </button>
        </div>
      </div>

      <div className="station-body">
        {mensajeLocal && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--ok-bg)',
              color: 'var(--ok)',
              border: '1px solid var(--ok-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            [SYSTEM_OK] {mensajeLocal}
          </div>
        )}

        {/* SUBNAVEGACIÓN DE PESTAÑAS */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--dark-600)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'usuarios', label: '1. Los 9 Roles y Usuarios (P-37)' },
            { id: 'parametros', label: '2. Parámetros y Mantenimiento (P-39)' },
            { id: 'catalogos', label: '3. Catálogos Oficiales (P-38)' },
            { id: 'bitacora', label: '4. Bitácora de Auditoría (RN-12)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPestaña(tab.id as any)}
              className={`btn ${pestaña === tab.id ? 'btn-yellow' : 'btn-dark'}`}
              style={{ height: '2.4rem', fontSize: '0.75rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO PESTAÑA 1: LOS 9 ROLES */}
        {pestaña === 'usuarios' && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">USUARIOS OFICIALES EN SISTEMA (LOS 9 ROLES SEGREGADOS - P-37)</span>
              <span className="badge badge-accent">SEGREGACIÓN_FUNCIONES</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>NÓMINA</th>
                      <th>NOMBRE COMPLETO</th>
                      <th>LOGIN USUARIO</th>
                      <th>ROL OFICIAL</th>
                      <th>ESTADO</th>
                      <th>ACCESO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USUARIOS_OFICIALES.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                          {u.nomina}
                        </td>
                        <td style={{ fontWeight: 700 }}>{u.nombre_completo}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{u.usuario_login}</td>
                        <td>
                          <span className="badge badge-accent">
                            [ROL {u.id_rol}] {NOMBRES_ROLES[u.id_rol]}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-ok">ACTIVO</span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gray-300)' }}>
                          {u.id_rol <= 3 ? 'Piso de Producción' : u.id_rol <= 5 ? 'Almacén y Envíos' : 'Gerencia y Sistemas'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: PARÁMETROS */}
        {pestaña === 'parametros' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">CONFIGURACIÓN DE MODO MANTENIMIENTO (RNF-07, P-39)</span>
                <span className={`badge ${modoMantenimiento ? 'badge-danger' : 'badge-ok'}`}>
                  {modoMantenimiento ? 'EN MANTENIMIENTO' : 'OPERATIVO'}
                </span>
              </div>
              <div className="panel-body">
                <form onSubmit={handleGuardarParametros} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: modoMantenimiento ? 'var(--danger-bg)' : 'var(--dark-700)', padding: '1rem', border: '1px solid var(--dark-500)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: modoMantenimiento ? 'var(--danger)' : '#fff' }}>
                      Estado Actual: {modoMantenimiento ? 'AVISO ACTIVO EN TODAS LAS PANTALLAS' : 'OPERACIÓN NORMAL'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-300)' }}>
                      Al activar el aviso, se despliega una franja de advertencia en el encabezado general notificando a operadores e inspectores.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">MENSAJE VISIBLE EN ENCABEZADO</label>
                    <input
                      type="text"
                      className="form-input"
                      value={nuevoMensajeMantenimiento}
                      onChange={(e) => setNuevoMensajeMantenimiento(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-yellow">
                    GUARDAR PARÁMETROS DEL SISTEMA
                  </button>
                </form>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">POLÍTICAS GENERALES DE CONSERVACIÓN (RNF-08)</span>
                <span className="badge badge-accent">RETENTION_RULES</span>
              </div>
              <div className="panel-body" style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--gray-200)' }}>
                <p>
                  <strong>Conservación de Trazabilidad:</strong> Mínimo <strong>2 años</strong> de histórico para
                  todas las unidades, pruebas funcionales y registros de inspección según RNF-08.
                </p>
                <p>
                  <strong>Tiempo Meta de Cierre de Turno:</strong> Menor o igual a <strong>15 minutos</strong> al
                  finalizar el turno operacional del Líder.
                </p>
                <p>
                  <strong>Auditoría Inmutable:</strong> La tabla de bitácora no admite sentencias UPDATE ni DELETE
                  para salvaguardar la evidencia en controversias de garantías con clientes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 3: CATÁLOGOS */}
        {pestaña === 'catalogos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* MODELOS Y CAPACIDADES */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">CATÁLOGO DE MODELOS Y CAPACIDAD DE CAJA</span>
                <span className="badge badge-accent">MODELOS_SSOT</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>MODELO</th>
                      <th>CAPACIDAD CAJA</th>
                      <th>DESCRIPCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGO_MODELOS.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{m.nombre_modelo}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{m.capacidad_caja} pzas / caja</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gray-300)' }}>{m.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLIENTES Y POLÍTICAS DE MEZCLA */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">CLIENTES Y REGLAS DE EMPAQUE (RN-06, BD-18)</span>
                <span className="badge badge-accent">CLIENTES_POLICIES</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>CLIENTE</th>
                      <th>MEZCLA DE COLORES</th>
                      <th>REQUISITO DE ETIQUETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGO_CLIENTES.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{c.nombre_cliente}</td>
                        <td>
                          {c.permite_mezcla_colores ? (
                            <span className="badge badge-ok">PERMITE MEZCLA</span>
                          ) : (
                            <span className="badge badge-danger">MONOCROMÁTICA</span>
                          )}
                        </td>
                        <td>
                          {c.requiere_etiqueta ? (
                            <span className="badge badge-warn">REQUIERE QR / ETIQUETA</span>
                          ) : (
                            <span className="badge badge-dark">ESTÁNDAR</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DEFECTOS OFICIALES */}
            <div className="panel" style={{ gridColumn: 'span 2' }}>
              <div className="panel-header">
                <span className="panel-title">CATÁLOGO OFICIAL DE DEFECTOS (RF-14, BD-05, BD-06)</span>
                <span className="badge badge-accent">4 CATEGORÍAS</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>CATEGORÍA</th>
                      <th>DESCRIPCIÓN DEL DEFECTO</th>
                      <th>SEVERIDAD TÉCNICA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATALOGO_DEFECTOS_OFICIALES.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{d.id}</td>
                        <td>
                          <span className="badge badge-info">{d.categoria}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{d.descripcion}</td>
                        <td>
                          <span
                            className={`badge ${
                              d.severidad === 'Crítico'
                                ? 'badge-danger'
                                : d.severidad === 'Mayor'
                                ? 'badge-warn'
                                : 'badge-dark'
                            }`}
                          >
                            {d.severidad}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 4: BITÁCORA */}
        {pestaña === 'bitacora' && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">REGISTRO DE AUDITORÍA INMUTABLE (RN-12, BD-15)</span>
              <span className="badge badge-accent">{bitacora.length} EVENTOS</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>FECHA Y HORA</th>
                      <th>MÓDULO</th>
                      <th>USUARIO</th>
                      <th>ACCIÓN REGISTRADA</th>
                      <th>MOTIVO / DETALLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bitacora.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{b.fecha}</td>
                        <td>
                          <span className="badge badge-dark">{b.modulo}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{b.usuario_nombre}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{b.accion}</td>
                        <td style={{ color: 'var(--gray-300)' }}>{b.motivo || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
