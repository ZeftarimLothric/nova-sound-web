import React, { useState } from 'react';
import { usePlanta, CATALOGO_ESTADOS_CALIDAD, CATALOGO_DEFECTOS_OFICIALES } from '../context/PlantaContext';
import { EstadosCalidadEnum } from '../types/database';

export default function CalidadStation() {
  const { unidades, inspeccionesCalidad, dictaminarCalidad, sesion, abrirTrazabilidad } = usePlanta();

  const [numeroSerie, setNumeroSerie] = useState<string>(unidades[0]?.numero_serie || '');
  const [estadoResultadoId, setEstadoResultadoId] = useState<number>(EstadosCalidadEnum.APROBADA);
  const [defectoId, setDefectoId] = useState<number>(1);
  const [comentarios, setComentarios] = useState<string>('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Filtrado de unidad seleccionada
  const unidadActual = unidades.find((u) => u.numero_serie.toUpperCase() === numeroSerie.trim().toUpperCase());

  const handleDictaminar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroSerie.trim()) {
      setMensaje({ tipo: 'err', texto: 'Ingrese un número de serie válido' });
      return;
    }
    const res = await dictaminarCalidad(
      numeroSerie.trim(),
      estadoResultadoId,
      estadoResultadoId === EstadosCalidadEnum.APROBADA ? undefined : defectoId,
      comentarios
    );

    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Dictamen registrado para unidad ${numeroSerie.trim()}` });
      setComentarios('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al procesar dictamen' });
    }
  };

  const aprobadas = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.APROBADA).length;
  const retrabajo = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.EN_RETRABAJO).length;
  const retencion = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.EN_RETENCION).length;
  const scrap = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.SCRAP).length;

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">04</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 04 · Control de Calidad</span>
            <h1 className="station-title">Inspección Visual y Disposición Técnica</h1>
            <span className="station-subtitle">
              Dictamen formal en 4 estados con severidad de defectos y trazabilidad 360°
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--carbon-900)', textTransform: 'uppercase' }}>
              INSPECTOR EN TURNO:
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {sesion.usuario.nombre_completo}
            </div>
          </div>
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

        {/* INDICADORES CLAVE */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">UNIDADES APROBADAS</span>
            <span className="kpi-value" style={{ color: 'var(--ok)' }}>
              {aprobadas}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Listas para empaque]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">EN RETRABAJO</span>
            <span className="kpi-value" style={{ color: 'var(--warn)' }}>
              {retrabajo}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--warn)' }}>
              [Reingresan a inspección]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">EN RETENCIÓN</span>
            <span className="kpi-value" style={{ color: 'var(--danger)' }}>
              {retencion}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--danger)' }}>
              [Bloquean empaque y embarque]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">SCRAP / RECHAZO</span>
            <span className="kpi-value" style={{ color: 'var(--text-muted)' }}>
              {scrap}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--text-muted)' }}>
              [Destrucción formal]
            </span>
          </div>
        </div>

        {/* WORK AREA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* FORMULARIO DE DICTAMEN */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">TERMINAL DE DICTAMEN DE INSPECCIÓN (P-16, F-05, F-06)</span>
              <span className="badge badge-accent">INSPECTOR_STATION</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleDictaminar} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">ESCANEAR / INGRESAR NÚMERO DE SERIE</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      required
                      placeholder="Ej. NS-2026-0001"
                      className="form-input"
                      style={{ flex: 1, fontSize: '1rem', fontWeight: 700 }}
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value.toUpperCase())}
                    />
                    <select
                      className="form-select"
                      style={{ width: '160px' }}
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value)}
                    >
                      <option value="">-- Rápidas --</option>
                      {unidades.map((u) => (
                        <option key={u.id} value={u.numero_serie}>
                          {u.numero_serie} ({u.estado_calidad_nombre})
                        </option>
                      ))}
                    </select>
                    {numeroSerie.trim() && (
                      <button
                        type="button"
                        onClick={() => abrirTrazabilidad(numeroSerie.trim())}
                        className="btn btn-outline"
                        style={{ padding: '0 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        title="Abrir ficha en Trazabilidad 360°"
                      >
                        360°
                      </button>
                    )}
                  </div>
                </div>

                {/* TARJETA DE UNIDAD SELECCIONADA */}
                {unidadActual && (
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.8rem 1rem', border: '1px solid var(--border-default)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--carbon-900)' }}>
                        {unidadActual.modelo} // {unidadActual.color}
                      </span>
                      <span
                        className={`badge ${
                          unidadActual.id_estado_calidad === 1
                            ? 'badge-ok'
                            : unidadActual.id_estado_calidad === 2
                            ? 'badge-warn'
                            : 'badge-danger'
                        }`}
                      >
                        {unidadActual.estado_calidad_nombre}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      Orden: #{unidadActual.id_orden} | Cliente: {unidadActual.cliente} | Línea: L{unidadActual.id_linea} | Turno: T{unidadActual.id_turno}
                    </div>
                  </div>
                )}

                {/* SELECTOR DE ESTADOS OFICIALES */}
                <div className="form-group">
                  <label className="form-label">DISPOSICIÓN TÉCNICA (LOS 4 ESTADOS DEL CASO)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {CATALOGO_ESTADOS_CALIDAD.map((est) => (
                      <button
                        key={est.id}
                        type="button"
                        onClick={() => setEstadoResultadoId(est.id)}
                        className="btn"
                        style={{
                          height: '2.5rem',
                          fontSize: '0.75rem',
                          background:
                            estadoResultadoId === est.id
                              ? est.id === 1
                                ? 'var(--ok)'
                                : est.id === 2
                                ? 'var(--warn)'
                                : 'var(--danger)'
                              : 'var(--bg-surface-elevated)',
                          color: estadoResultadoId === est.id ? '#0a0b0d' : 'var(--text-main)',
                          borderColor: estadoResultadoId === est.id ? 'transparent' : 'var(--border-default)',
                        }}
                      >
                        {est.nombre_estado}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DEFECTO SI NO ES APROBADA */}
                {estadoResultadoId !== EstadosCalidadEnum.APROBADA && (
                  <div className="form-group" style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '0.8rem', border: '1px solid var(--border-default)' }}>
                    <label className="form-label">DEFECTO DETECTADO (CATÁLOGO OFICIAL CON SEVERIDAD)</label>
                    <select
                      className="form-select"
                      value={defectoId}
                      onChange={(e) => setDefectoId(Number(e.target.value))}
                    >
                      {CATALOGO_DEFECTOS_OFICIALES.map((d) => (
                        <option key={d.id} value={d.id}>
                          [{d.categoria.toUpperCase()}] {d.descripcion} ({d.severidad})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">OBSERVACIONES TÉCNICAS / HALLAZGOS</label>
                  <textarea
                    rows={3}
                    placeholder="Detalles de la inspección o motivo de retención/retrabajo"
                    className="form-textarea"
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-yellow" style={{ height: '3.2rem', fontSize: '0.9rem' }}>
                  REGISTRAR DICTAMEN DE CALIDAD
                </button>
              </form>
            </div>
          </div>

          {/* HISTORIAL DE LA UNIDAD SELECCIONADA */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">TRAZABILIDAD DE DICTÁMENES ({numeroSerie || 'SELECCIONAR'})</span>
              <span className="badge badge-accent">HISTORIAL_AUDIT</span>
            </div>
            <div className="panel-body">
              {inspeccionesCalidad.filter((i) => i.numero_serie === numeroSerie).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
                  [SIN INSPECCIONES PREVIAS PARA ESTA SERIE]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {inspeccionesCalidad
                    .filter((i) => i.numero_serie === numeroSerie)
                    .map((insp) => (
                      <div
                        key={insp.id}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          borderLeft: `4px solid ${
                            insp.id_estado_resultado === 1
                              ? 'var(--ok)'
                              : insp.id_estado_resultado === 2
                              ? 'var(--warn)'
                              : 'var(--danger)'
                          }`,
                          padding: '0.75rem 1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {insp.estado_resultado_nombre}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {insp.fecha_inspeccion}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
                          Inspector: {insp.inspector_nombre}
                        </div>
                        {insp.defecto_descripcion && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.2rem' }}>
                            Falla: {insp.defecto_descripcion}
                          </div>
                        )}
                        {insp.comentarios && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                            "{insp.comentarios}"
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE TODAS LAS INSPECCIONES RECIENTES */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">REGISTRO GENERAL DE INSPECCIONES EN PLANTA</span>
            <span className="badge badge-accent">SSOT_CALIDAD</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>HORA</th>
                    <th>NÚMERO DE SERIE</th>
                    <th>INSPECTOR</th>
                    <th>DICTAMEN RESULTADO</th>
                    <th>DEFECTO</th>
                    <th>COMENTARIOS</th>
                  </tr>
                </thead>
                <tbody>
                  {inspeccionesCalidad.map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{i.fecha_inspeccion}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--carbon-900)' }}>
                        {i.numero_serie}
                      </td>
                      <td>{i.inspector_nombre}</td>
                      <td>
                        <span
                          className={`badge ${
                            i.id_estado_resultado === 1
                              ? 'badge-ok'
                              : i.id_estado_resultado === 2
                              ? 'badge-warn'
                              : 'badge-danger'
                          }`}
                        >
                          {i.estado_resultado_nombre}
                        </span>
                      </td>
                      <td>{i.defecto_descripcion || '--'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{i.comentarios || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
