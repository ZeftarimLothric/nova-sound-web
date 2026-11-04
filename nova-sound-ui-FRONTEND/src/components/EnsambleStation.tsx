import React, { useState } from 'react';
import { usePlanta, CATALOGO_DEFECTOS_OFICIALES } from '../context/PlantaContext';

export default function EnsambleStation() {
  const {
    sesion,
    ordenes,
    conteosEnsamble,
    defectosEnsamble,
    registrarConteoEnsamble,
    registrarDefectoEnsamble,
  } = usePlanta();

  // Filtrar órdenes asignadas a la línea activa de la sesión
  const ordenesLinea = ordenes.filter((o) => o.id_linea_asignada === sesion.linea.id);
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<number>(ordenesLinea[0]?.id || ordenes[0]?.id || 1);
  const [cantidadPiezas, setCantidadPiezas] = useState<number>(10);
  const [defectoId, setDefectoId] = useState<number>(1);
  const [cantidadDefectos, setCantidadDefectos] = useState<number>(1);
  const [obsDefecto, setObsDefecto] = useState<string>('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const ordenActiva = ordenes.find((o) => o.id === ordenSeleccionadaId);

  // Totales de la línea y turno actuales
  const totalPiezasTurno = conteosEnsamble
    .filter((c) => c.id_linea === sesion.linea.id && c.id_turno === sesion.turno.id)
    .reduce((sum, c) => sum + c.cantidad, 0);

  const totalDefectosTurno = defectosEnsamble
    .filter((d) => d.id_linea === sesion.linea.id && d.id_turno === sesion.turno.id)
    .reduce((sum, d) => sum + d.cantidad, 0);

  const handleRegistrarConteo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenActiva) {
      setMensaje({ tipo: 'err', texto: 'Seleccione una orden válida' });
      return;
    }
    const res = registrarConteoEnsamble(ordenActiva.id, cantidadPiezas);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Conteo registrado: +${cantidadPiezas} piezas en orden ${ordenActiva.folio}` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al registrar conteo' });
    }
  };

  const handleRegistrarDefecto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenActiva) return;
    const res = registrarDefectoEnsamble(ordenActiva.id, defectoId, cantidadDefectos, obsDefecto);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Defecto de ensamble registrado correctamente` });
      setObsDefecto('');
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al registrar defecto' });
    }
  };

  return (
    <div className="station-container">
      {/* HEADER ENDFIELD */}
      <div className="station-header tex-carbon">
        <div className="station-header-left">
          <div className="station-deco-sq">02</div>
          <div className="station-title-box">
            <span className="station-badge-code">[ESTACIÓN_01 // CONTEO DE LÍNEA]</span>
            <h1 className="station-title">Ensamble Mecánico y Estructural</h1>
            <span className="station-subtitle">
              Línea activa: {sesion.linea.nombre_linea} | Turno: {sesion.turno.nombre_turno} | Operador: {sesion.usuario.nombre_completo}
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase' }}>
              OBJETIVO DEL TURNO:
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
              {totalPiezasTurno} / 100 PZAS
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
            <span className="kpi-label">ENSAMBLADAS HOY</span>
            <span className="kpi-value">{totalPiezasTurno}</span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Línea {sesion.linea.nombre_linea}]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">DEFECTOS DE ENSAMBLE</span>
            <span className="kpi-value">{totalDefectosTurno}</span>
            <span className="kpi-delta" style={{ color: totalDefectosTurno > 0 ? 'var(--warn)' : 'var(--ok)' }}>
              [Fallas mecánicas]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">ORDEN EN TRABAJO</span>
            <span className="kpi-value" style={{ fontSize: '1.4rem' }}>
              {ordenActiva?.folio || 'N/A'}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--accent)' }}>
              {ordenActiva?.modelo_nombre} - {ordenActiva?.color_nombre}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">AVANCE DE ORDEN</span>
            <span className="kpi-value" style={{ fontSize: '1.4rem' }}>
              {ordenActiva ? `${ordenActiva.piezas_ensambladas || 0} / ${ordenActiva.cantidad}` : '0 / 0'}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--gray-300)' }}>
              Destino: {ordenActiva?.cliente_nombre || 'N/A'}
            </span>
          </div>
        </div>

        {/* WORK AREA: CONTEO & DEFECTOS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* REGISTRO DE CONTEO */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">REGISTRO DE PIEZAS ENSAMBLADAS (P-11, F-03)</span>
              <span className="badge badge-accent">BATCH_COUNT</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleRegistrarConteo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">SELECCIONAR ORDEN ACTIVA EN LÍNEA</label>
                  <select
                    className="form-select"
                    value={ordenSeleccionadaId}
                    onChange={(e) => setOrdenSeleccionadaId(Number(e.target.value))}
                  >
                    {ordenes.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.folio} - {ord.modelo_nombre} ({ord.color_nombre}) [{ord.cliente_nombre}] {ord.id_linea_asignada ? `(L${ord.id_linea_asignada})` : '(Sin línea)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CANTIDAD DE PIEZAS ENSAMBLADAS</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="form-input"
                    value={cantidadPiezas}
                    onChange={(e) => setCantidadPiezas(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-300)', marginTop: '0.2rem' }}>
                    * En ensamble se cuenta por lotes. El número de serie nace oficialmente al aprobar Prueba Funcional.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCantidadPiezas(num)}
                      className="btn btn-dark"
                      style={{ height: '2rem', flex: 1, fontSize: '0.7rem' }}
                    >
                      +{num}
                    </button>
                  ))}
                </div>

                <button type="submit" className="btn btn-yellow" style={{ height: '3rem', fontSize: '0.9rem' }}>
                  REGISTRAR CONTEO DE ENSAMBLE
                </button>
              </form>
            </div>
          </div>

          {/* REGISTRO DE DEFECTOS DE ENSAMBLE */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">REGISTRO DE INCIDENCIA / DEFECTO DE LÍNEA (P-14)</span>
              <span className="badge badge-warn">SCRAP_LOG</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleRegistrarDefecto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">CATÁLOGO DE DEFECTO OFICIAL</label>
                  <select
                    className="form-select"
                    value={defectoId}
                    onChange={(e) => setDefectoId(Number(e.target.value))}
                  >
                    {CATALOGO_DEFECTOS_OFICIALES.filter((d) => d.categoria === 'Apariencia' || d.categoria === 'Ensamble' || d.categoria === 'Funcional').map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.categoria.toUpperCase()}] {d.descripcion} ({d.severidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CANTIDAD AFECTADA</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="form-input"
                    value={cantidadDefectos}
                    onChange={(e) => setCantidadDefectos(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">OBSERVACIONES O CAUSA RAÍZ</label>
                  <input
                    type="text"
                    placeholder="Ej. Problema de torque en tornillo o rebaba en tapa"
                    className="form-input"
                    value={obsDefecto}
                    onChange={(e) => setObsDefecto(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-danger" style={{ marginTop: '0.5rem' }}>
                  REGISTRAR INCIDENCIA DE ENSAMBLE
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* TABLA DE ÚLTIMOS CONTEOS */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">BITÁCORA DE CONTEOS REGISTRADOS EN TURNO</span>
            <span className="badge badge-accent">REAL_TIME</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>HORA REGISTRO</th>
                    <th>ORDEN</th>
                    <th>LÍNEA // TURNO</th>
                    <th>OPERADOR</th>
                    <th>CANTIDAD</th>
                    <th>DESTINO SIGUIENTE</th>
                  </tr>
                </thead>
                <tbody>
                  {conteosEnsamble.map((c) => {
                    const ord = ordenes.find((o) => o.id === c.id_orden);
                    return (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{c.fecha_hora}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{ord?.folio}</td>
                        <td>
                          Línea {c.id_linea} / Turno {c.id_turno}
                        </td>
                        <td>{sesion.usuario.nombre_completo}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>+{c.cantidad} piezas</td>
                        <td>
                          <span className="badge badge-info">PASA A PRUEBA FUNCIONAL</span>
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
    </div>
  );
}
