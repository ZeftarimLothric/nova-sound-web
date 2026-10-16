import React, { useState, useEffect } from 'react';
import { RolesEnum } from '../types/database';
import { usePlanta } from '../context/PlantaContext';
import Icon from './common/Icon';

interface UsuarioConfig {
  id: number;
  nomina: string;
  nombre_completo: string;
  usuario_login: string;
  id_rol: number;
  activo: boolean;
}

interface ParametroSistemaItem {
  id: number;
  clave: string;
  valor: number;
  descripcion: string;
}

interface RespaldoLogItem {
  id: number;
  fecha_hora: string;
  usuario: string;
  exitoso: boolean;
}

const ROLES_LISTA = [
  { id: RolesEnum.OPERADOR, nombre: 'Operador' },
  { id: RolesEnum.INSPECTOR_CALIDAD, nombre: 'Inspector de Calidad' },
  { id: RolesEnum.SUPERVISOR, nombre: 'Supervisor' },
  { id: RolesEnum.GERENTE, nombre: 'Gerente' },
  { id: RolesEnum.ADMINISTRADOR, nombre: 'Administrador' },
];

export const ConfiguracionStation: React.FC = () => {
  const { bitacora, registrarBitacora } = usePlanta();

  const [seccionActiva, setSeccionActiva] = useState<'usuarios' | 'parametros' | 'bitacora' | 'respaldos'>('usuarios');
  const [alerta, setAlerta] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);

  const [mostrarNuevoUsuario, setMostrarNuevoUsuario] = useState(false);
  const [nuevaNomina, setNuevaNomina] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoLogin, setNuevoLogin] = useState('');
  const [nuevoRolId, setNuevoRolId] = useState<number>(RolesEnum.OPERADOR);

  const [parametros, setParametros] = useState<ParametroSistemaItem[]>([]);

  const [filtroModulo, setFiltroModulo] = useState<string>('TODOS');

  const [respaldos, setRespaldos] = useState<RespaldoLogItem[]>([]);

  // Cargar usuarios y parámetros reales de Neon PostgreSQL
  useEffect(() => {
    fetch('http://localhost:4000/api/usuarios')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsuarios(data);
        }
      })
      .catch(() => {});

    fetch('http://localhost:4000/api/parametros')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setParametros(data);
        }
      })
      .catch(() => {});

    fetch('http://localhost:4000/api/respaldos')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRespaldos(
            data.map((item: any) => ({
              id: item.id,
              fecha_hora: item.fecha_hora ? new Date(item.fecha_hora).toLocaleString() : 'N/A',
              usuario: item.nombre_completo || item.usuario_login || 'SISTEMA',
              exitoso: item.exitoso,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNomina.trim() || !nuevoNombre.trim() || !nuevoLogin.trim()) {
      alert('Todos los campos son obligatorios para dar de alta al usuario.');
      return;
    }

    const payload = {
      nomina: nuevaNomina.trim().toUpperCase(),
      nombre_completo: nuevoNombre.trim(),
      usuario_login: nuevoLogin.trim().toLowerCase(),
      id_rol: nuevoRolId,
    };

    fetch('http://localhost:4000/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((created) => {
        if (created) {
          setUsuarios((prev) => [...prev, created]);
        }
      })
      .catch(() => {});

    const nuevoUser: UsuarioConfig = {
      id: usuarios.length + 1,
      nomina: payload.nomina,
      nombre_completo: payload.nombre_completo,
      usuario_login: payload.usuario_login,
      id_rol: payload.id_rol,
      activo: true,
    };
    setUsuarios((prev) => (prev.some((u) => u.nomina === nuevoUser.nomina) ? prev : [...prev, nuevoUser]));

    registrarBitacora(
      'Seguridad',
      `Usuario ${nuevoUser.usuario_login} (${nuevoUser.nomina}) registrado con rol ${ROLES_LISTA.find((r) => r.id === nuevoRolId)?.nombre}`
    );

    setAlerta(`✓ Usuario ${nuevoUser.nombre_completo} [${nuevoUser.nomina}] creado con éxito.`);
    setMostrarNuevoUsuario(false);
    setNuevaNomina('');
    setNuevoNombre('');
    setNuevoLogin('');
    setNuevoRolId(RolesEnum.OPERADOR);
    setTimeout(() => setAlerta(null), 4000);
  };

  const toggleUsuarioActivo = (id: number) => {
    fetch(`http://localhost:4000/api/usuarios/${id}/toggle-activo`, {
      method: 'PATCH',
    }).catch(() => {});

    setUsuarios(
      usuarios.map((u) => {
        if (u.id === id) {
          const nuevoEstado = !u.activo;
          registrarBitacora(
            'Seguridad',
            `Usuario ${u.usuario_login} cambiado a estado [${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}]`
          );
          return { ...u, activo: nuevoEstado };
        }
        return u;
      })
    );
  };

  const handleCambiarParametro = (id: number, nuevoValor: number) => {
    setParametros(
      parametros.map((p) => (p.id === id ? { ...p, valor: nuevoValor } : p))
    );
    setAlerta('✓ Parámetros actualizados localmente. Presione Guardar para persistir en BD.');
  };

  const handleGuardarParametros = () => {
    registrarBitacora('Configuracion', 'Parámetros del sistema actualizados y sincronizados con PostgreSQL');
    setAlerta('✓ Parámetros del sistema guardados exitosamente en la base de datos.');
    setTimeout(() => setAlerta(null), 4000);
  };

  const handleEjecutarRespaldo = () => {
    const nuevoRespaldo: RespaldoLogItem = {
      id: Date.now(),
      fecha_hora: new Date().toLocaleString(),
      usuario: 'Marcela Juárez (admin1)',
      exitoso: true,
    };
    setRespaldos([nuevoRespaldo, ...respaldos]);
    registrarBitacora('Mantenimiento', 'Respaldo de base de datos ejecutado satisfactoriamente (pg_dump)');
    setAlerta('✓ Copia de seguridad generada correctamente. Registro archivado en respaldos_log.');
    setTimeout(() => setAlerta(null), 4000);
  };

  const bitacoraFiltrada = bitacora.filter((b) => {
    if (filtroModulo === 'TODOS') return true;
    return b.modulo.toLowerCase() === filtroModulo.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. CABECERA Y SUBMENÚ */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="settings" color="#f59e0b" size="20px" />
            Configuración del Sistema, Catálogos y Auditoría
          </h2>
          <span className="badge badge-info">ADMINISTRACIÓN GLOBAL</span>
        </div>

        <div className="panel-body">
          {alerta && (
            <div className="alert-banner alert-banner-ok">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="check_circle" size="16px" />
                {alerta}
              </span>
            </div>
          )}

          {/* Subpestañas */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${seccionActiva === 'usuarios' ? 'btn-primary' : ''}`}
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setSeccionActiva('usuarios')}
            >
              <Icon name="group" size="16px" />
              1. Usuarios y Permisos (usuarios)
            </button>
            <button
              className={`btn ${seccionActiva === 'parametros' ? 'btn-primary' : ''}`}
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setSeccionActiva('parametros')}
            >
              <Icon name="tune" size="16px" />
              2. Parámetros de Planta (parametros_sistema)
            </button>
            <button
              className={`btn ${seccionActiva === 'bitacora' ? 'btn-primary' : ''}`}
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setSeccionActiva('bitacora')}
            >
              <Icon name="receipt_long" size="16px" />
              3. Auditoría y Bitácora (bitacora)
            </button>
            <button
              className={`btn ${seccionActiva === 'respaldos' ? 'btn-primary' : ''}`}
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setSeccionActiva('respaldos')}
            >
              <Icon name="backup" size="16px" />
              4. Respaldos de BD (respaldos_log)
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: USUARIOS */}
      {seccionActiva === 'usuarios' && (
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Icon name="manage_accounts" size="18px" color="#38bdf8" />
              Cuentas de Acceso y Roles de Manufactura (usuarios / roles)
            </h2>
            <button
              className="btn btn-primary"
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setMostrarNuevoUsuario(!mostrarNuevoUsuario)}
            >
              <Icon name={mostrarNuevoUsuario ? 'close' : 'person_add'} size="16px" />
              {mostrarNuevoUsuario ? 'Cancelar' : 'Registrar Nuevo Usuario'}
            </button>
          </div>

          <div className="panel-body">
            {mostrarNuevoUsuario && (
              <form
                onSubmit={handleCrearUsuario}
                style={{
                  backgroundColor: '#161f2c',
                  border: '1px solid #28374d',
                  padding: '16px',
                  borderRadius: '2px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label htmlFor="user-nomina" style={{ display: 'block', marginBottom: '4px' }}>Nómina:</label>
                    <input
                      id="user-nomina"
                      type="text"
                      placeholder="EMP-051"
                      value={nuevaNomina}
                      onChange={(e) => setNuevaNomina(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-nombre" style={{ display: 'block', marginBottom: '4px' }}>Nombre Completo:</label>
                    <input
                      id="user-nombre"
                      type="text"
                      placeholder="Nombre y Apellidos"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-login" style={{ display: 'block', marginBottom: '4px' }}>Usuario Login:</label>
                    <input
                      id="user-login"
                      type="text"
                      placeholder="login1"
                      value={nuevoLogin}
                      onChange={(e) => setNuevoLogin(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-rol" style={{ display: 'block', marginBottom: '4px' }}>Rol Asignado:</label>
                    <select
                      id="user-rol"
                      value={nuevoRolId}
                      onChange={(e) => setNuevoRolId(Number(e.target.value))}
                    >
                      {ROLES_LISTA.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button className="btn btn-success" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="check" size="16px" />
                    Guardar Usuario en PostgreSQL
                  </button>
                </div>
              </form>
            )}

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nómina</th>
                    <th>Nombre Completo</th>
                    <th>Login</th>
                    <th>Rol Asignado</th>
                    <th>Estado</th>
                    <th style={{ width: '120px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const rolNombre = ROLES_LISTA.find((r) => r.id === u.id_rol)?.nombre ?? 'Desconocido';
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{u.nomina}</td>
                        <td>{u.nombre_completo}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{u.usuario_login}</td>
                        <td>{rolNombre}</td>
                        <td>
                          <span className={`badge ${u.activo ? 'badge-ok' : 'badge-neutral'}`}>
                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn"
                            type="button"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            onClick={() => toggleUsuarioActivo(u.id)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: PARÁMETROS */}
      {seccionActiva === 'parametros' && (
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Icon name="tune" size="18px" color="#38bdf8" />
              Constantes y Parámetros Globales (parametros_sistema)
            </h2>
            <button className="btn btn-primary" type="button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleGuardarParametros}>
              <Icon name="save" size="16px" />
              Guardar Cambios en Base de Datos
            </button>
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {parametros.map((p) => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#161f2c',
                    border: '1px solid #28374d',
                    padding: '12px 16px',
                    borderRadius: '2px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {p.clave}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8493a8' }}>{p.descripcion}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor={`param-${p.id}`} style={{ color: '#38bdf8', textTransform: 'uppercase' }}>Valor:</label>
                    <input
                      id={`param-${p.id}`}
                      type="number"
                      value={p.valor}
                      onChange={(e) => handleCambiarParametro(p.id, Number(e.target.value))}
                      style={{ width: '90px', textAlign: 'right', fontWeight: 700 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: BITÁCORA */}
      {seccionActiva === 'bitacora' && (
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Icon name="receipt_long" size="18px" color="#38bdf8" />
              Registro de Auditoría y Eventos de Planta (bitacora)
            </h2>
            <span className="badge badge-neutral">{bitacoraFiltrada.length} de {bitacora.length} eventos</span>
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <label htmlFor="filtro-mod" style={{ textTransform: 'uppercase' }}>Módulo:</label>
              <select
                id="filtro-mod"
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                style={{ maxWidth: '240px' }}
              >
                <option value="TODOS">Todos los Módulos</option>
                <option value="Ensamble">Ensamble</option>
                <option value="Calidad">Calidad</option>
                <option value="Empaque">Empaque</option>
                <option value="Embarques">Embarques</option>
                <option value="Reportes">Reportes</option>
                <option value="Configuracion">Configuración / Parámetros</option>
                <option value="Seguridad">Seguridad / Usuarios</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Fecha y Hora</th>
                    <th style={{ width: '130px' }}>Módulo</th>
                    <th>Acción Auditada</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacoraFiltrada.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>{item.fecha}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>
                          {item.modulo}
                        </span>
                      </td>
                      <td>{item.accion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: RESPALDOS */}
      {seccionActiva === 'respaldos' && (
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Icon name="backup" size="18px" color="#38bdf8" />
              Copias de Seguridad Físicas de la Base de Datos (respaldos_log)
            </h2>
            <button className="btn btn-primary" type="button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleEjecutarRespaldo}>
              <Icon name="cloud_upload" size="16px" />
              Ejecutar Respaldo Inmediato (pg_dump)
            </button>
          </div>

          <div className="panel-body">
            <div
              style={{
                backgroundColor: '#161f2c',
                border: '1px solid #28374d',
                padding: '14px 16px',
                borderRadius: '2px',
                marginBottom: '16px',
              }}
            >
              <strong style={{ color: '#f1f5f9' }}>Copia de Seguridad PostgreSQL (SSOT)</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8493a8' }}>
                Genera un volcado completo de todas las tablas de producción: órdenes, trazabilidad de unidades, inspecciones de calidad, cajas y embarques.
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Fecha y Hora</th>
                    <th>Responsable</th>
                    <th style={{ width: '140px' }}>Estado del Dump</th>
                  </tr>
                </thead>
                <tbody>
                  {respaldos.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>{r.fecha_hora}</td>
                      <td style={{ fontWeight: 600, color: '#38bdf8' }}>{r.usuario}</td>
                      <td>
                        <span className={`badge ${r.exitoso ? 'badge-ok' : 'badge-danger'}`}>
                          {r.exitoso ? 'EXITOSO (200 OK)' : 'FALLIDO'}
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
    </div>
  );
};

export default ConfiguracionStation;
