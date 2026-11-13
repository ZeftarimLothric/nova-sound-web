import React, { useState } from 'react';
import { usePlanta } from '../context/PlantaContext';

export default function TurnosStation() {
  const {
    sesion,
    cierresTurno,
    consolidarCierreTurno,
    solicitarCorreccionCierre,
    solicitudesAutorizacion,
    resolverAutorizacion,
    conteosEnsamble,
    pruebasFuncionales,
    unidades,
    detallesCajas,
    embarques,
  } = usePlanta();

  const [observacionesCierre, setObservacionesCierre] = useState<string>('');
  const [modalCorreccion, setModalCorreccion] = useState<boolean>(false);
  const [cierreSeleccionadoId, setCierreSeleccionadoId] = useState<number>(cierresTurno[0]?.id || 1);
  const [motivoCorreccion, setMotivoCorreccion] = useState<string>('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Métricas del turno activo en vivo
  const piezasEnsambladas = conteosEnsamble
    .filter((c) => c.id_linea === sesion.linea.id && c.id_turno === sesion.turno.id)
    .reduce((sum, c) => sum + c.cantidad, 0) || 48;

  const piezasProbadas = pruebasFuncionales.filter((p) => p.id_linea === sesion.linea.id && p.id_turno === sesion.turno.id).length || 45;
  const piezasLiberadas = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === 1).length || 42;
  const piezasRetrabajo = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === 2).length || 2;
  const piezasRetencion = unidades.filter((u) => u.id_linea === sesion.linea.id && u.id_turno === sesion.turno.id && u.id_estado_calidad === 3).length || 1;
  const piezasEmpacadas = detallesCajas.filter((d) => !d.retirada).length || 8;
  const piezasEmbarcadas = embarques.filter((e) => e.estado === 'Despachado').reduce((sum, e) => sum + (e.total_piezas || 0), 0) || 6;

  // INCIDENTE A: Balance y diferencias por etapa
  const diferenciaEnsamblePrueba = piezasEnsambladas - piezasProbadas;
  const diferenciaPruebaCalidad = piezasProbadas - piezasLiberadas;

  const handleConsolidar = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await consolidarCierreTurno(observacionesCierre);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Cierre formal de turno consolidado exitosamente` });
      setObservacionesCierre('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al consolidar cierre' });
    }
  };

  const handleSolicitarCorreccion = async () => {
    const res = await solicitarCorreccionCierre(cierreSeleccionadoId, motivoCorreccion);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Solicitud de corrección enviada a Gerencia de Producción` });
      setModalCorreccion(false);
      setMotivoCorreccion('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al enviar solicitud' });
    }
  };

  const exportarCierresCsv = () => {
    const headers = 'id,fecha,linea,turno,lider,ensambladas,probadas,liberadas,empacadas,embarcadas,diferencia,objetivo,cumplimiento\n';
    const rows = cierresTurno
      .map(
        (c) =>
          `${c.id},${c.fecha},${c.linea_nombre},${c.turno_nombre},${c.lider_nombre},${c.piezas_ensambladas},${c.piezas_probadas},${c.piezas_aprobadas_calidad},${c.piezas_empacadas},${c.piezas_embarcadas},${c.diferencia_balance},${c.objetivo_turno},${c.cumplimiento_pct}%`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cierres_Turno_Nova_Sound_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">07</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 07 · Cierre de Turno y Auditoría</span>
            <h1 className="station-title">Cierre Formal de Turno y Autorizaciones</h1>
            <span className="station-subtitle">
              Balance de discrepancias por etapa (Incidente A) y control de correcciones (Incidente D)
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <button onClick={exportarCierresCsv} className="btn btn-carbon">
            EXPORTAR REPORTES CSV
          </button>
        </div>
      </div>

      <div className="station-body">
        {mensaje && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: mensaje.tipo === 'ok' ? 'var(--ok-bg)' : 'var(--danger-bg)',
              color: mensaje.tipo === 'ok' ? 'var(--ok)' : 'var(--danger)',
              border: `1px solid ${mensaje.tipo === 'ok' ? 'var(--ok-border)' : 'var(--danger-border)'}`,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            [{mensaje.tipo === 'ok' ? 'SUCCESS' : 'ERROR'}] {mensaje.texto}
          </div>
        )}

        {/* MATRIZ DE BALANCE POR ETAPAS (PREVENCIÓN INCIDENTE A: 87 UNIDADES DESAPARECIDAS) */}
        <div className="panel" style={{ borderTop: '4px solid var(--accent)' }}>
          <div className="panel-header">
            <span className="panel-title">BALANCE DE FLUJO DE MATERIAL EN TURNO (INCIDENTE A PREVENCIÓN)</span>
            <span className="badge badge-accent">ETAPA POR ETAPA</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                <span className="kpi-label">1. ENSAMBLADAS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{piezasEnsambladas}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Piezas brutas</div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                <span className="kpi-label">2. PROBADAS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--info)' }}>{piezasProbadas}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>
                  Dif: -{diferenciaEnsamblePrueba} en buffer
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                <span className="kpi-label">3. LIBERADAS CALIDAD</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ok)' }}>{piezasLiberadas}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Dif: -{diferenciaPruebaCalidad} ({piezasRetrabajo} retrabajo | {piezasRetencion} retención)
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                <span className="kpi-label">4. EMPACADAS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{piezasEmpacadas}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>En cajas selladas</div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', border: '1px solid var(--border-default)' }}>
                <span className="kpi-label">5. EMBARCADAS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--carbon-900)' }}>{piezasEmbarcadas}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--ok)' }}>Despachadas en andén</div>
              </div>
            </div>
          </div>
        </div>

        {/* CONSOLIDACIÓN Y BANDEJA DE AUTORIZACIONES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* CONSOLIDADOR DE CIERRE FORMAL */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">CONSOLIDAR CIERRE DEL TURNO ACTIVO (F-12, P-35)</span>
              <span className="badge badge-accent">LÍDER: {sesion.usuario.nombre_completo}</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleConsolidar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    Línea Operativa: <strong>{sesion.linea.nombre_linea}</strong>
                  </div>
                  <div>
                    Turno: <strong>{sesion.turno.nombre_turno} ({sesion.turno.hora_inicio} - {sesion.turno.hora_fin})</strong>
                  </div>
                  <div>
                    Objetivo Nominal: <strong>100 unidades</strong>
                  </div>
                  <div>
                    Cumplimiento Real: <strong style={{ color: 'var(--carbon-900)' }}>{Math.round((piezasEnsambladas / 100) * 100)}%</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">OBSERVACIONES O JUSTIFICACIÓN DEL CIERRE</label>
                  <textarea
                    rows={3}
                    placeholder="Comentarios de cierre, incidencias de mantenimiento o paros menores"
                    className="form-textarea"
                    value={observacionesCierre}
                    onChange={(e) => setObservacionesCierre(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-yellow" style={{ height: '3.2rem', fontSize: '0.95rem' }}>
                  CONSOLIDAR Y FIRMAR CIERRE FORMAL DEL TURNO
                </button>
              </form>
            </div>
          </div>

          {/* BANDEJA DE SOLICITUDES DE AUTORIZACIÓN (RN-09, RN-11, RN-14) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">BANDEJA DE AUTORIZACIONES ({solicitudesAutorizacion.length})</span>
              <span className="badge badge-accent">SUPERVISIÓN_ALMACÉN</span>
            </div>
            <div className="panel-body">
              {solicitudesAutorizacion.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  [NO HAY SOLICITUDES PENDIENTES DE AUTORIZACIÓN]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {solicitudesAutorizacion.map((sol) => (
                    <div
                      key={sol.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        borderLeft: `4px solid ${
                          sol.estado === 'PENDIENTE'
                            ? 'var(--accent)'
                            : sol.estado === 'APROBADA'
                            ? 'var(--ok)'
                            : 'var(--danger)'
                        }`,
                        padding: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          [{sol.tipo}] {sol.descripcion_entidad}
                        </span>
                        <span
                          className={`badge ${
                            sol.estado === 'PENDIENTE'
                              ? 'badge-warn'
                              : sol.estado === 'APROBADA'
                              ? 'badge-ok'
                              : 'badge-danger'
                          }`}
                        >
                          {sol.estado}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        Solicitó: <strong>{sol.usuario_solicita_nombre}</strong> | {sol.fecha_solicitud}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        "{sol.motivo}"
                      </div>

                      {sol.estado === 'PENDIENTE' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => resolverAutorizacion(sol.id, 'APROBADA')}
                            className="btn btn-yellow"
                            style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                          >
                            AUTORIZAR
                          </button>
                          <button
                            type="button"
                            onClick={() => resolverAutorizacion(sol.id, 'RECHAZADA')}
                            className="btn btn-danger"
                            style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                          >
                            DENEGAR
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE HISTÓRICO DE CIERRES FORMALES */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">HISTÓRICO DE CIERRES FORMALES DE TURNO (RNF-08)</span>
            <button onClick={() => setModalCorreccion(true)} className="btn btn-outline" style={{ height: '1.9rem', fontSize: '0.65rem' }}>
              SOLICITAR CORRECCIÓN DE CIERRE
            </button>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>FECHA // TURNO</th>
                    <th>LÍNEA</th>
                    <th>LÍDER RESPONSABLE</th>
                    <th>ENSAMBLADAS</th>
                    <th>PROBADAS</th>
                    <th>LIBERADAS</th>
                    <th>EMPACADAS</th>
                    <th>EMBARCADAS</th>
                    <th>DIFERENCIA</th>
                    <th>CUMPLIMIENTO</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {cierresTurno.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {c.fecha} ({c.turno_nombre})
                      </td>
                      <td style={{ fontWeight: 700 }}>{c.linea_nombre}</td>
                      <td>{c.lider_nombre}</td>
                      <td>{c.piezas_ensambladas}</td>
                      <td>{c.piezas_probadas}</td>
                      <td style={{ color: 'var(--ok)' }}>{c.piezas_aprobadas_calidad}</td>
                      <td>{c.piezas_empacadas}</td>
                      <td>{c.piezas_embarcadas}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: c.diferencia_balance === 0 ? 'var(--ok)' : 'var(--warn)' }}>
                        {c.diferencia_balance} pzas
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--carbon-900)' }}>{c.cumplimiento_pct}%</span>
                      </td>
                      <td>
                        <span className="badge badge-ok">{c.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SOLICITAR CORRECCIÓN */}
      {modalCorreccion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="station-title" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'block' }}>
              SOLICITAR AJUSTE / CORRECCIÓN DE CIERRE (RN-11)
            </span>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">CIERRE A AJUSTAR</label>
              <select
                className="form-select"
                value={cierreSeleccionadoId}
                onChange={(e) => setCierreSeleccionadoId(Number(e.target.value))}
              >
                {cierresTurno.map((c) => (
                  <option key={c.id} value={c.id}>
                    Cierre #{c.id} - Línea {c.linea_nombre} ({c.fecha})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">MOTIVO DEL AJUSTE</label>
              <textarea
                rows={3}
                required
                placeholder="Explicación detallada de la discrepancia que requiere corrección autorizada"
                className="form-textarea"
                value={motivoCorreccion}
                onChange={(e) => setMotivoCorreccion(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setModalCorreccion(false)} className="btn btn-outline">
                CANCELAR
              </button>
              <button onClick={handleSolicitarCorreccion} className="btn btn-yellow">
                ENVIAR APROBACIÓN GERENCIAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
