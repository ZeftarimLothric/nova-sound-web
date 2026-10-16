import React, { useState, useEffect, useMemo } from 'react';
import { usePlanta } from '../context/PlantaContext';
import { EstadosCalidadEnum } from '../types/database';
import Icon from './common/Icon';

const API_URL = 'http://localhost:4000/api';

interface OrdenResumen {
  id: number;
  folio: string;
  cliente: string;
  modelo: string;
  color: string;
  cantidad_solicitada: number;
  cantidad_ensamblada: number;
  cantidad_aprobada: number;
  cantidad_scrap: number;
  estado: 'En Proceso' | 'Completada' | 'Pendiente';
  linea: string;
}

interface DefectoFrecuencia {
  id: number;
  categoria: string;
  descripcion: string;
  frecuencia: number;
  porcentaje: number;
}

export const ReportesStation: React.FC = () => {
  const { unidades, cajas, sesion, registrarBitacora, historialUnidades } = usePlanta();

  // Filtros operativos
  const [lineaFiltro, setLineaFiltro] = useState<string>('TODAS');
  const [turnoFiltro, setTurnoFiltro] = useState<string>(sesion.turno.nombre_turno);
  const [mensajeExportar, setMensajeExportar] = useState<string | null>(null);

  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/ordenes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOrdenes(
            data.map((o: any) => ({
              id: o.id,
              folio: o.folio || `ORD-${String(o.id).padStart(3, '0')}`,
              cliente: o.nombre_cliente || 'AudioMax',
              modelo: o.nombre_modelo || 'NS-PRO',
              color: o.nombre_color || 'Negro',
              cantidad_solicitada: Number(o.cantidad) || 0,
              cantidad_ensamblada: Number(o.cantidad_ensamblada) || 0,
              cantidad_aprobada: Number(o.cantidad_aprobada) || 0,
              cantidad_scrap: Number(o.cantidad_scrap) || 0,
              estado: (o.estado === 'Completada' ? 'Completada' : o.estado === 'Pendiente' ? 'Pendiente' : 'En Proceso') as any,
              linea: o.nombre_linea || 'L1',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Filtrado de órdenes
  const ordenesFiltradas = ordenes.filter((ord) => {
    if (lineaFiltro === 'TODAS') return true;
    return ord.linea === lineaFiltro;
  });

  // Métricas calculadas en tiempo real desde el SSOT de PlantaContext
  const totalEnsamblado = unidades.length;
  const totalAprobadas = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.APROBADA).length;
  const totalRetrabajo = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.EN_RETRABAJO).length;
  const totalRetencion = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.EN_RETENCION).length;
  const totalScrap = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.SCRAP).length;
  const cajasSelladas = cajas.filter((c) => c.estado === 'Cerrada').length;
  const piezasEmpacadas = unidades.filter((u) => u.id_caja !== null).length;

  const metaTurno = lineaFiltro === 'TODAS' ? 100 : 40;
  const porcentajeAvanceMeta = Math.min(100, Math.round((totalEnsamblado / metaTurno) * 100));
  const tasaAprobacion = totalEnsamblado > 0 ? ((totalAprobadas / totalEnsamblado) * 100).toFixed(1) : '0.0';
  const tasaScrap = totalEnsamblado > 0 ? ((totalScrap / totalEnsamblado) * 100).toFixed(1) : '0.0';

  // Pareto de fallas calculado dinámicamente desde el historial de calidad real
  const defectosFrecuencia: DefectoFrecuencia[] = useMemo(() => {
    const fallas = historialUnidades.filter(
      (h) => h.estado_nuevo === 'En retrabajo' || h.estado_nuevo === 'Scrap' || h.estado_nuevo === 'En retención'
    );
    if (fallas.length === 0) {
      return [
        { id: 1, categoria: 'Ensamble/Audio', descripcion: 'Falla acústica o ensamble', frecuencia: 0, porcentaje: 0 },
      ];
    }
    const countMap: Record<string, number> = {};
    fallas.forEach((f) => {
      const desc = f.motivo || 'Falla no especificada';
      countMap[desc] = (countMap[desc] || 0) + 1;
    });
    const total = fallas.length;
    return Object.entries(countMap)
      .map(([descripcion, frecuencia], idx) => ({
        id: idx + 1,
        categoria:
          descripcion.toLowerCase().includes('audio') ||
          descripcion.toLowerCase().includes('carga') ||
          descripcion.toLowerCase().includes('bluetooth')
            ? 'Funcional'
            : 'Ensamble/Apariencia',
        descripcion,
        frecuencia,
        porcentaje: Number(((frecuencia / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.frecuencia - a.frecuencia);
  }, [historialUnidades]);

  const handleExportar = () => {
    registrarBitacora('Reportes', `Corte de turno generado: ${totalEnsamblado} piezas, ${totalAprobadas} aprobadas, ${totalScrap} scrap`);
    setMensajeExportar(`✓ Reporte de Turno [${turnoFiltro} | Línea: ${lineaFiltro}] consolidado y registrado en bitácora.`);
    setTimeout(() => setMensajeExportar(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. CABECERA Y FILTROS */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="monitoring" color="#0ea5e9" size="20px" />
            Panel de Métricas, Rendimiento de Calidad y Reportes de Turno
          </h2>
          <span className="badge badge-info">KPIs TELEMETRÍA EN VIVO</span>
        </div>

        <div className="panel-body">
          {mensajeExportar && (
            <div className="alert-banner alert-banner-ok">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="check_circle" size="16px" />
                {mensajeExportar}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="filtro-linea" style={{ textTransform: 'uppercase' }}>Línea:</label>
                <select
                  id="filtro-linea"
                  value={lineaFiltro}
                  onChange={(e) => setLineaFiltro(e.target.value)}
                  style={{ minWidth: '180px' }}
                >
                  <option value="TODAS">Todas las Líneas (L1, L2, L3)</option>
                  <option value="L1">Línea L1 (NS-PRO / NS-MAX)</option>
                  <option value="L2">Línea L2 (NS-MINI)</option>
                  <option value="L3">Línea L3 (NS-SPORT)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="filtro-turno" style={{ textTransform: 'uppercase' }}>Turno:</label>
                <select
                  id="filtro-turno"
                  value={turnoFiltro}
                  onChange={(e) => setTurnoFiltro(e.target.value)}
                  style={{ minWidth: '180px' }}
                >
                  <option value="Mañana">Turno 1 - Mañana (06:00 - 14:00)</option>
                  <option value="Tarde">Turno 2 - Tarde (14:00 - 22:00)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => window.print()}>
                <Icon name="print" size="16px" />
                Imprimir Corte
              </button>
              <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportar}>
                <Icon name="bookmark" size="16px" />
                Consolidar Turno en Bitácora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPIs CONSOLIDADOS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Ensambladas Hoy</span>
          <div className="kpi-value">
            {totalEnsamblado} <span style={{ fontSize: '13px', color: '#64748b' }}>/ {metaTurno}</span>
          </div>
          <span className="kpi-subtext" style={{ color: '#38bdf8' }}>
            Meta: {porcentajeAvanceMeta}% alcanzado
          </span>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <span className="kpi-label" style={{ color: '#10b981' }}>Piezas Aprobadas (FPY)</span>
          <div className="kpi-value" style={{ color: '#10b981' }}>{totalAprobadas}</div>
          <span className="kpi-subtext" style={{ color: '#10b981' }}>
            {tasaAprobacion}% de aprobación en primera pasada
          </span>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <span className="kpi-label" style={{ color: '#ef4444' }}>Scrap Definitivo</span>
          <div className="kpi-value" style={{ color: '#ef4444' }}>{totalScrap}</div>
          <span className="kpi-subtext" style={{ color: '#ef4444' }}>
            Tasa de merma: {tasaScrap}%
          </span>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <span className="kpi-label" style={{ color: '#f59e0b' }}>En Retrabajo / Retención</span>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>{totalRetrabajo}</div>
          <span className="kpi-subtext" style={{ color: '#f59e0b' }}>
            {totalRetencion} pzas en retención preventiva
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Cajas Embaladas</span>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>{cajasSelladas}</div>
          <span className="kpi-subtext">{piezasEmpacadas} pzas terminadas</span>
        </div>
      </div>

      {/* 3. DISTRIBUCIÓN DE CALIDAD & ANÁLISIS DE FALLAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
        {/* Distribución */}
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Icon name="pie_chart" size="18px" color="#38bdf8" />
              Distribución de Calidad en Planta (SSOT)
            </h2>
            <span className="badge badge-neutral">{totalEnsamblado} Evaluadas</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Aprobadas ({totalAprobadas} pzas)</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{tasaAprobacion}%</span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div className="progress-fill success" style={{ width: `${tasaAprobacion}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '4px' }}>
                  <span>En Retrabajo ({totalRetrabajo} pzas)</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                    {totalEnsamblado > 0 ? ((totalRetrabajo / totalEnsamblado) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div
                    className="progress-fill warn"
                    style={{ width: `${totalEnsamblado > 0 ? (totalRetrabajo / totalEnsamblado) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Scrap ({totalScrap} pzas)</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{tasaScrap}%</span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${tasaScrap}%`,
                      backgroundColor: '#ef4444',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pareto de Fallas */}
        <div className="panel">
          <div className="panel-header">
            <h2>
              <Icon name="bar_chart" size="18px" color="#ef4444" />
              Pareto de Fallas Más Frecuentes (catalogo_defectos)
            </h2>
            <span className="badge badge-danger">Fallas Detectadas</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Categoría</th>
                    <th>Defecto</th>
                    <th>Incidencias</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {defectosFrecuencia.map((def, idx) => (
                    <tr key={def.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>#{idx + 1}</td>
                      <td>
                        <span className="badge badge-warn" style={{ fontSize: '10px' }}>
                          {def.categoria}
                        </span>
                      </td>
                      <td>{def.descripcion}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{def.frecuencia}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{def.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SEGUIMIENTO DE ÓRDENES */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="table_chart" size="18px" color="#38bdf8" />
            Seguimiento de Órdenes de Producción (Tabla ordenes)
          </h2>
          <span className="badge badge-neutral">{ordenesFiltradas.length} Órdenes</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Modelo / Color</th>
                  <th>Línea</th>
                  <th>Avance Físico</th>
                  <th>Aprobadas</th>
                  <th>Scrap</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((ord) => {
                  const pct = Math.round((ord.cantidad_ensamblada / ord.cantidad_solicitada) * 100);
                  let badge = 'badge-info';
                  if (ord.estado === 'Completada') badge = 'badge-ok';
                  else if (ord.estado === 'Pendiente') badge = 'badge-neutral';

                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                        {ord.folio}
                      </td>
                      <td>{ord.cliente}</td>
                      <td>{ord.modelo} ({ord.color})</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ord.linea}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {ord.cantidad_ensamblada} / {ord.cantidad_solicitada} ({pct}%)
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>
                        {ord.cantidad_aprobada}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#ef4444' }}>{ord.cantidad_scrap}</td>
                      <td>
                        <span className={`badge ${badge}`}>{ord.estado}</span>
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

export default ReportesStation;
