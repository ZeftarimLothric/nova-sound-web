import { usePlanta } from '../../context/PlantaContext';

export default function Inicio() {
  const {
    sesion,
    ordenes,
    unidades,
    cierresTurno,
    cajas,
    modoMantenimiento,
  } = usePlanta();

  const totalUnidades = unidades.length;
  const aprobadas = unidades.filter((u) => u.id_estado_calidad === 1).length;
  const enRetencion = unidades.filter((u) => u.id_estado_calidad === 3).length;
  const cajasCerradas = cajas.filter((c) => c.estado === 'Cerrada').length;

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">00</div>
          <div className="station-title-box">
            <span className="station-badge-code">Resumen General de Planta</span>
            <h1 className="station-title">Centro de Telemetría y Operaciones</h1>
            <span className="station-subtitle">
              Estado de piso de manufactura en tiempo real | Línea: {sesion.linea.nombre_linea} | Turno: {sesion.turno.nombre_turno}
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--carbon-900)', textTransform: 'uppercase' }}>
              ESTADO DEL SISTEMA:
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: modoMantenimiento ? 'var(--danger)' : 'var(--ok)' }}>
              {modoMantenimiento ? 'En mantenimiento' : 'En operación'}
            </div>
          </div>
        </div>
      </div>

      <div className="station-body">
        {/* FILA DE INDICADORES PRINCIPALES */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">TOTAL UNIDADES TRAZABLES</span>
            <span className="kpi-value">{totalUnidades}</span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Con número de serie]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">UNIDADES LIBERADAS CALIDAD</span>
            <span className="kpi-value" style={{ color: 'var(--ok)' }}>
              {aprobadas}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [{Math.round((aprobadas / (totalUnidades || 1)) * 100)}% de rendimiento]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">EN RETENCIÓN TÉCNICA</span>
            <span className="kpi-value" style={{ color: 'var(--danger)' }}>
              {enRetencion}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--danger)' }}>
              [Bloqueo activo]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">CAJAS LISTAS PARA EMBARQUE</span>
            <span className="kpi-value">{cajasCerradas}</span>
            <span className="kpi-delta" style={{ color: 'var(--carbon-900)' }}>
              [Selladas y verificadas]
            </span>
          </div>
        </div>

        {/* ESTADO DE LÍNEAS L1, L2, L3 */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">ESTADO TÁCTICO DE LÍNEAS DE PRODUCCIÓN</span>
            <span className="badge badge-accent">MONITOR_PISO</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {[1, 2, 3].map((num) => {
                const ordAsignada = ordenes.find((o) => o.id_linea_asignada === num);
                const esActiva = sesion.linea.id === num;
                return (
                  <div
                    key={num}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: `1px solid ${esActiva ? 'var(--accent)' : 'var(--border-default)'}`,
                      borderLeft: `5px solid ${esActiva ? 'var(--accent)' : 'var(--text-muted)'}`,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                        LÍNEA 0{num}
                      </span>
                      <span className={`badge ${esActiva ? 'badge-accent' : 'badge-dark'}`}>
                        {esActiva ? 'SELECCIONADA' : 'DISPONIBLE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      <div>
                        Orden activa:{' '}
                        <strong style={{ color: 'var(--carbon-900)' }}>
                          {ordAsignada ? ordAsignada.folio : 'Sin orden asignada'}
                        </strong>
                      </div>
                      <div>
                        Modelo: <strong>{ordAsignada?.modelo_nombre || '--'}</strong> ({ordAsignada?.color_nombre || '--'})
                      </div>
                      <div>
                        Cliente: <strong>{ordAsignada?.cliente_nombre || '--'}</strong>
                      </div>
                      <div>
                        Progreso:{' '}
                        <strong>
                          {ordAsignada ? `${ordAsignada.piezas_ensambladas || 0} / ${ordAsignada.cantidad} pzas` : '--'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RESUMEN DE FLUJO Y CADENA DE CUSTODIA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* ÓRDENES EN CURSO */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">ÓRDENES EN PROCESO DE MANUFACTURA</span>
              <span className="badge badge-accent">ACTIVE_ORDERS</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>FOLIO</th>
                      <th>CLIENTE</th>
                      <th>MODELO // COLOR</th>
                      <th>CANTIDAD</th>
                      <th>LÍNEA</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--carbon-900)' }}>
                          {ord.folio}
                        </td>
                        <td>{ord.cliente_nombre}</td>
                        <td>
                          {ord.modelo_nombre} ({ord.color_nombre})
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ord.cantidad}</td>
                        <td>{ord.id_linea_asignada ? `L${ord.id_linea_asignada}` : '--'}</td>
                        <td>
                          <span
                            className={`badge ${
                              ord.estado === 'En Producción'
                                ? 'badge-accent'
                                : ord.estado === 'Asignada'
                                ? 'badge-info'
                                : 'badge-dark'
                            }`}
                          >
                            {ord.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ÚLTIMOS CIERRES DE TURNO */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">ÚLTIMOS CIERRES DE TURNO</span>
              <span className="badge badge-accent">GOVERNANCE</span>
            </div>
            <div className="panel-body">
              {cierresTurno.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
                  [SIN CIERRES CONSOLIDADOS PREVIOS]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cierresTurno.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        borderLeft: '4px solid var(--ok)',
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ color: 'var(--text-main)' }}>
                          Línea {c.linea_nombre} - Turno {c.turno_nombre}
                        </strong>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--carbon-900)', fontWeight: 800 }}>
                          {c.cumplimiento_pct}%
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Líder: {c.lider_nombre} | Ensambladas: {c.piezas_ensambladas} | Liberadas: {c.piezas_aprobadas_calidad}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
