import React, { useState } from 'react';
import { usePlanta } from '../context/PlantaContext';
import Icon from './common/Icon';

export const EnsambleStation: React.FC = () => {
  const { unidades, registrarUnidadEnsamble, sesion } = usePlanta();
  const [inputSerial, setInputSerial] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const metaTurno = 100;
  const progresoPct = Math.min(100, Math.round((unidades.length / metaTurno) * 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSerial.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese o escanee el número de serie de la unidad.' });
      return;
    }

    const res = registrarUnidadEnsamble(inputSerial, 'NS-PRO', 'Negro');
    if (!res.ok) {
      setMensaje({ tipo: 'error', texto: res.error || 'Error al registrar unidad.' });
    } else {
      setMensaje({
        tipo: 'ok',
        texto: `Unidad ${inputSerial.toUpperCase().trim()} registrada exitosamente. Transferida a inspección de calidad.`,
      });
      setInputSerial('');
    }
  };

  const ultimasUnidades = unidades.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. CABECERA Y METAS DE TURNO */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="precision_manufacturing" size={18} color="#38bdf8" />
            Estación de Ensamble · Línea {sesion.linea.nombre_linea}
          </h2>
          <span className="badge badge-info">
            MODELO ACTIVO: NS-PRO (6 PZAS/CAJA)
          </span>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: '#161f2c',
              border: '1px solid #233145',
              padding: '14px 18px',
              borderRadius: '2px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#8493a8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Objetivo del Turno ({sesion.turno.nombre_turno})
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: '#f1f5f9' }}>
                {unidades.length} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {metaTurno} PZAS</span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#8493a8' }}>EFICIENCIA DE LÍNEA</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{progresoPct}%</span>
              </div>
              <div className="progress-track" style={{ height: '10px' }}>
                <div className="progress-fill" style={{ width: `${progresoPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAPTURA Y ESCANEO DE SERIE */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="qr_code_scanner" size={18} color="#38bdf8" />
            Registro de Unidad (Lectura de Código de Barras / QR)
          </h2>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8493a8' }}>
            Operador: {sesion.usuario.nombre_completo}
          </span>
        </div>
        <div className="panel-body">
          {mensaje && (
            <div className={`alert-banner ${mensaje.tipo === 'ok' ? 'alert-banner-ok' : 'alert-banner-error'}`}>
              <Icon name={mensaje.tipo === 'ok' ? 'check_circle' : 'error'} size={18} color={mensaje.tipo === 'ok' ? '#10b981' : '#ef4444'} />
              <span style={{ flex: 1 }}>{mensaje.texto}</span>
              <button
                type="button"
                onClick={() => setMensaje(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: '2px 6px', fontSize: '14px', cursor: 'pointer', display: 'flex' }}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
              <label htmlFor="serial-input" style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Número de Serie de Bocina:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="serial-input"
                  type="text"
                  autoFocus
                  value={inputSerial}
                  onChange={(e) => setInputSerial(e.target.value)}
                  placeholder="Escanee o teclee (ej. UN0052)"
                  className="scanner-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="add_circle" size={16} />
                  Registrar Pieza [↵]
                </button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                Presione ENTER o dispare con la pistola lectora láser. Se asignará automáticamente a la Línea {sesion.linea.nombre_linea}.
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* 3. HISTORIAL DE ENSAMBLE EN TIEMPO REAL */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="history" size={18} color="#38bdf8" />
            Últimas Unidades Ensambladas en Turno Actual
          </h2>
          <span className="badge badge-neutral">{unidades.length} Registradas</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° de Serie</th>
                  <th>Modelo</th>
                  <th>Color</th>
                  <th>Hora de Ensamble</th>
                  <th>Estado en Calidad</th>
                  <th>Destino de Empaque</th>
                </tr>
              </thead>
              <tbody>
                {ultimasUnidades.map((u) => {
                  let badgeClass = 'badge-info';
                  let estadoTxt = 'Pendiente Inspección';

                  if (u.id_estado_calidad === 1) {
                    badgeClass = 'badge-ok';
                    estadoTxt = 'Aprobada';
                  } else if (u.id_estado_calidad === 2) {
                    badgeClass = 'badge-warn';
                    estadoTxt = 'En Retrabajo';
                  } else if (u.id_estado_calidad === 3) {
                    badgeClass = 'badge-warn';
                    estadoTxt = 'En Retención';
                  } else if (u.id_estado_calidad === 4) {
                    badgeClass = 'badge-danger';
                    estadoTxt = 'Scrap (Desecho)';
                  }

                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                        {u.numero_serie}
                      </td>
                      <td>{u.modelo}</td>
                      <td>{u.color}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>{u.fecha_ensamble}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{estadoTxt}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {u.id_caja ? (
                          <span style={{ color: '#10b981' }}>Caja #{u.id_caja}</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Suelta en piso</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnsambleStation;
