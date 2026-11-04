import React, { useState } from 'react';
import { usePlanta } from '../context/PlantaContext';

export default function TrazabilidadStation() {
  const { buscarTrazabilidad, unidades } = usePlanta();

  const [query, setQuery] = useState<string>(unidades[0]?.numero_serie || 'NS-2026-0001');
  const [data, setData] = useState(() => buscarTrazabilidad(query));

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const res = buscarTrazabilidad(query.trim());
    setData(res);
  };

  return (
    <div className="station-container">
      {/* HEADER ENDFIELD */}
      <div className="station-header tex-carbon">
        <div className="station-header-left">
          <div className="station-deco-sq">360</div>
          <div className="station-title-box">
            <span className="station-badge-code">[TRAZABILIDAD // HISTORIAL DE PIEZA]</span>
            <h1 className="station-title">Genealogía y Trazabilidad 360°</h1>
            <span className="station-subtitle">
              Auditoría unificada desde orden de ensamble hasta el manifiesto de embarque
            </span>
          </div>
        </div>
      </div>

      <div className="station-body">
        {/* BARRA DE BÚSQUEDA INDUSTRIAL */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">CONSULTA POR NÚMERO DE SERIE OFICIAL (P-42)</span>
            <span className="badge badge-accent">SERIAL_SEARCH</span>
          </div>
          <div className="panel-body">
            <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Ej. NS-2026-0001"
                className="form-input"
                style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
              />
              <button type="submit" className="btn btn-yellow" style={{ minWidth: '160px' }}>
                LOCALIZAR SERIE
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--gray-300)', fontFamily: 'var(--font-mono)' }}>
                SERIES DE PRUEBA RÁPIDA:
              </span>
              {unidades.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setQuery(u.numero_serie);
                    setData(buscarTrazabilidad(u.numero_serie));
                  }}
                  className="btn btn-outline"
                  style={{ height: '1.8rem', padding: '0 0.5rem', fontSize: '0.65rem' }}
                >
                  {u.numero_serie}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTADO DE TRAZABILIDAD */}
        {!data || !data.unidad ? (
          <div className="panel">
            <div className="panel-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              [LA SERIE CONSULTADA NO EXISTE O NO HA SIDO EMITIDA POR EL BANCO DE PRUEBAS FUNCIONALES]
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* TARJETA MAESTRA DE LA UNIDAD */}
            <div className="panel" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="panel-header">
                <span className="panel-title">FICHA TÉCNICA PRINCIPAL DE LA UNIDAD</span>
                <span className="badge badge-ok">{data.unidad.estado_calidad_nombre}</span>
              </div>
              <div className="panel-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                  <div>
                    <span className="kpi-label">NÚMERO DE SERIE</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {data.unidad.numero_serie}
                    </div>
                  </div>
                  <div>
                    <span className="kpi-label">MODELO // COLOR</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      {data.unidad.modelo} ({data.unidad.color})
                    </div>
                  </div>
                  <div>
                    <span className="kpi-label">CLIENTE ASIGNADO</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      {data.unidad.cliente}
                    </div>
                  </div>
                  <div>
                    <span className="kpi-label">ORDEN DE PRODUCCIÓN</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      {data.orden?.folio || `#${data.unidad.id_orden}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LAS 5 ETAPAS DEL CICLO DE VIDA (F-01 a F-11) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* ETAPA 1: ENSAMBLE */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">1. ENSAMBLE</span>
                  <span className="badge badge-ok">[OK]</span>
                </div>
                <div className="panel-body" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  <div>Línea: <strong>L{data.unidad.id_linea}</strong></div>
                  <div>Turno: <strong>T{data.unidad.id_turno}</strong></div>
                  <div>Fecha: <strong>{data.unidad.fecha_ensamble}</strong></div>
                  <div style={{ color: 'var(--gray-300)', marginTop: '0.4rem' }}>Pieza ensamblada en lote</div>
                </div>
              </div>

              {/* ETAPA 2: PRUEBA FUNCIONAL */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">2. PRUEBA FUNCIONAL</span>
                  <span className="badge badge-ok">[4/4 CHECKS]</span>
                </div>
                <div className="panel-body" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  <div>Encendido: <strong style={{ color: 'var(--ok)' }}>PASÓ</strong></div>
                  <div>Audio 20Hz-20kHz: <strong style={{ color: 'var(--ok)' }}>PASÓ</strong></div>
                  <div>Carga USB: <strong style={{ color: 'var(--ok)' }}>PASÓ</strong></div>
                  <div>Bluetooth 5.3: <strong style={{ color: 'var(--ok)' }}>PASÓ</strong></div>
                  <div style={{ color: 'var(--accent)', marginTop: '0.4rem', fontWeight: 700 }}>
                    Nacimiento de serie validado
                  </div>
                </div>
              </div>

              {/* ETAPA 3: CALIDAD */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">3. CALIDAD</span>
                  <span className={`badge ${data.unidad.id_estado_calidad === 1 ? 'badge-ok' : 'badge-danger'}`}>
                    {data.unidad.estado_calidad_nombre}
                  </span>
                </div>
                <div className="panel-body" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  <div>Inspecciones: <strong>{data.inspecciones.length}</strong></div>
                  <div>Último Dictamen: <strong>{data.unidad.estado_calidad_nombre}</strong></div>
                  <div style={{ color: 'var(--gray-300)', marginTop: '0.4rem' }}>
                    {data.inspecciones[0]?.comentarios || 'Inspección nominal conforme'}
                  </div>
                </div>
              </div>

              {/* ETAPA 4: EMPAQUE */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">4. EMPAQUE</span>
                  <span className={`badge ${data.caja ? 'badge-ok' : 'badge-warn'}`}>
                    {data.caja ? data.caja.estado.toUpperCase() : 'SUELTA'}
                  </span>
                </div>
                <div className="panel-body" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  {data.caja ? (
                    <>
                      <div>Caja: <strong>{data.caja.codigo_caja}</strong></div>
                      <div>Capacidad: <strong>{data.caja.capacidad} pzas</strong></div>
                      <div>Sellada: <strong>{data.caja.estado === 'Cerrada' ? 'SÍ' : 'NO'}</strong></div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--gray-400)' }}>Unidad aún no empacada en caja</div>
                  )}
                </div>
              </div>

              {/* ETAPA 5: EMBARQUE */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">5. EMBARQUES</span>
                  <span className={`badge ${data.embarque ? 'badge-info' : 'badge-dark'}`}>
                    {data.embarque ? data.embarque.estado.toUpperCase() : 'PENDIENTE'}
                  </span>
                </div>
                <div className="panel-body" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  {data.embarque ? (
                    <>
                      <div>Ref: <strong>{data.embarque.referencia_embarque}</strong></div>
                      <div>Pedido: <strong>{data.embarque.id_pedido}</strong></div>
                      <div>Transporte: <strong>{data.embarque.transportista_nombre}</strong></div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--gray-400)' }}>Sin asignar a manifiesto de salida</div>
                  )}
                </div>
              </div>
            </div>

            {/* HISTORIAL DETALLADO DE MOVIMIENTOS */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">HISTORIAL COMPLETO DE MODIFICACIONES Y MOVIMIENTOS</span>
                <span className="badge badge-accent">BITÁCORA_SERIE</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <div className="table-container">
                  <table className="tech-table">
                    <thead>
                      <tr>
                        <th>FECHA Y HORA</th>
                        <th>USUARIO AUDITOR</th>
                        <th>ESTADO ANTERIOR</th>
                        <th>ESTADO NUEVO</th>
                        <th>MOTIVO / COMENTARIO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.historial.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{h.fecha_hora}</td>
                          <td>{h.usuario_nombre}</td>
                          <td style={{ color: 'var(--gray-300)' }}>{h.estado_anterior}</td>
                          <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{h.estado_nuevo}</td>
                          <td>{h.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
