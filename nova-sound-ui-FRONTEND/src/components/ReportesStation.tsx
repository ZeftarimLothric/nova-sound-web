import { useState } from 'react';
import { usePlanta, CATALOGO_DEFECTOS_OFICIALES } from '../context/PlantaContext';

export default function ReportesStation() {
  const { unidades, ordenes, inspeccionesCalidad, cierresTurno, embarques } = usePlanta();

  const [filtroPeriodo, setFiltroPeriodo] = useState('HOY');

  // Cálculos estadísticos
  const totalUnidades = unidades.length || 1;
  const aprobadas = unidades.filter((u) => u.id_estado_calidad === 1).length;
  const retrabajo = unidades.filter((u) => u.id_estado_calidad === 2).length;
  const retencion = unidades.filter((u) => u.id_estado_calidad === 3).length;
  const scrap = unidades.filter((u) => u.id_estado_calidad === 4).length;

  const pctAprobadas = Math.round((aprobadas / totalUnidades) * 100);
  const pctRetrabajo = Math.round((retrabajo / totalUnidades) * 100);
  const pctRetencion = Math.round((retencion / totalUnidades) * 100);
  const pctScrap = Math.round((scrap / totalUnidades) * 100);

  // Pareto por categoría oficial
  const conteoCategorias: Record<string, number> = {
    Apariencia: 0,
    Funcional: 0,
    Identificación: 0,
    Empaque: 0,
  };

  inspeccionesCalidad.forEach((i) => {
    if (i.id_defecto) {
      const def = CATALOGO_DEFECTOS_OFICIALES.find((d) => d.id === i.id_defecto);
      if (def && conteoCategorias[def.categoria] !== undefined) {
        conteoCategorias[def.categoria]++;
      }
    }
  });

  const exportarReporteCsv = () => {
    const headers = 'serie,modelo,color,cliente,estado_calidad,linea,turno,fecha\n';
    const rows = unidades
      .map(
        (u) =>
          `${u.numero_serie},${u.modelo},${u.color},${u.cliente},${u.estado_calidad_nombre},L${u.id_linea},T${u.id_turno},${u.fecha_ensamble}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Calidad_Nova_Sound_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">08</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 08 · Analítica y Rendimiento</span>
            <h1 className="station-title">Reportes, Pareto y Métricas Ejecutivas</h1>
            <span className="station-subtitle">
              Distribución de calidad segregada y análisis pareto de defectos oficiales
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['HOY', 'SEMANA', 'MES'].map((p) => (
              <button
                key={p}
                onClick={() => setFiltroPeriodo(p)}
                className={`btn ${filtroPeriodo === p ? 'btn-yellow' : 'btn-dark'}`}
                style={{ height: '2.2rem', padding: '0 0.8rem', fontSize: '0.7rem' }}
              >
                {p}
              </button>
            ))}
            <button onClick={exportarReporteCsv} className="btn btn-carbon" style={{ height: '2.2rem' }}>
              EXPORTAR CSV
            </button>
          </div>
        </div>
      </div>

      <div className="station-body">
        {/* KPIS EJECUTIVOS */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">FIRST PASS YIELD (FPY)</span>
            <span className="kpi-value" style={{ color: 'var(--ok)' }}>
              {pctAprobadas}%
            </span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Calidad directa a empaque]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">TOTAL UNIDADES TRAZABLES</span>
            <span className="kpi-value">{unidades.length}</span>
            <span className="kpi-delta" style={{ color: 'var(--info)' }}>
              [En base de datos SSOT]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">CIERRES FORMALES</span>
            <span className="kpi-value">{cierresTurno.length}</span>
            <span className="kpi-delta" style={{ color: 'var(--carbon-900)' }}>
              [Turnos consolidados]
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">EMBARQUES DESPACHADOS</span>
            <span className="kpi-value">
              {embarques.filter((e) => e.estado === 'Despachado').length}
            </span>
            <span className="kpi-delta" style={{ color: 'var(--ok)' }}>
              [Entregas validadas]
            </span>
          </div>
        </div>

        {/* DISTRIBUCIÓN DE CALIDAD Y PARETO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* DISTRIBUCIÓN DE CALIDAD SEPARADA (P-31) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">DISTRIBUCIÓN DE CALIDAD SEPARADA (P-31)</span>
              <span className="badge badge-accent">DISPOSITION_BREAKDOWN</span>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. APROBADA */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--ok)' }}>1. APROBADA (LIBERADA)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {aprobadas} pzas ({pctAprobadas}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <div style={{ height: '100%', width: `${pctAprobadas}%`, background: 'var(--ok)' }} />
                  </div>
                </div>

                {/* 2. RETRABAJO (SEPARADO) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--warn)' }}>2. EN RETRABAJO (CORRECCIÓN)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {retrabajo} pzas ({pctRetrabajo}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <div style={{ height: '100%', width: `${pctRetrabajo}%`, background: 'var(--warn)' }} />
                  </div>
                </div>

                {/* 3. RETENCIÓN (SEPARADO) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>3. EN RETENCIÓN (BLOQUEO CALIDAD)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {retencion} pzas ({pctRetencion}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <div style={{ height: '100%', width: `${pctRetencion}%`, background: 'var(--danger)' }} />
                  </div>
                </div>

                {/* 4. SCRAP */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>4. SCRAP (MERMA NO RECUPERABLE)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {scrap} pzas ({pctScrap}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <div style={{ height: '100%', width: `${pctScrap}%`, background: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PARETO POR CATEGORÍA OFICIAL (P-33) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">PARETO DE DEFECTOS OFICIAL (RF-14, P-33)</span>
              <span className="badge badge-accent">ROOT_CAUSE</span>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(conteoCategorias).map(([cat, cant]) => {
                  const totalDef = Object.values(conteoCategorias).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((cant / totalDef) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>[{cat.toUpperCase()}]</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {cant} incidencias ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE AVANCE DE ÓRDENES */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">BALANCE DE CUMPLIMIENTO POR ORDEN</span>
            <span className="badge badge-accent">PROGRESS_TRACK</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>FOLIO</th>
                    <th>CLIENTE</th>
                    <th>MODELO // COLOR</th>
                    <th>COMPROMISO</th>
                    <th>ENSAMBLADAS</th>
                    <th>APROBADAS</th>
                    <th>AVANCE</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((ord) => {
                    const avancePct = Math.min(100, Math.round(((ord.piezas_ensambladas || 0) / ord.cantidad) * 100));
                    return (
                      <tr key={ord.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--carbon-900)' }}>
                          {ord.folio}
                        </td>
                        <td>{ord.cliente_nombre}</td>
                        <td>
                          {ord.modelo_nombre} ({ord.color_nombre})
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ord.fecha_compromiso}</td>
                        <td>{ord.piezas_ensambladas || 0} pzas</td>
                        <td style={{ color: 'var(--ok)' }}>{ord.piezas_aprobadas || 0} pzas</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--bg-surface-elevated)' }}>
                              <div style={{ height: '100%', width: `${avancePct}%`, background: 'var(--accent)' }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{avancePct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-accent">{ord.estado}</span>
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
