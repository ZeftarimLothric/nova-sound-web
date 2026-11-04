import { usePlanta } from '../../context/PlantaContext';
import { EstadosCalidadEnum } from '../../types/database';
import Icon from '../../components/common/LogoBocina';

export default function Inicio() {
  const { unidades, cajas, embarques, bitacora, sesion } = usePlanta();

  const totalEnsamblado = unidades.length;
  const totalAprobadas = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.APROBADA).length;
  const totalScrap = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.SCRAP).length;
  const totalRetrabajo = unidades.filter((u) => u.id_estado_calidad === EstadosCalidadEnum.EN_RETRABAJO).length;
  const cajasSelladas = cajas.filter((c) => c.estado === 'Cerrada').length;
  const embarquesActivos = embarques.length;

  const tasaAprobacion = totalEnsamblado > 0 ? ((totalAprobadas / totalEnsamblado) * 100).toFixed(1) : '100.0';
  const ultimosEventos = bitacora.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. TELEMETRÍA Y KPIs EN VIVO */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="sensors" size={18} color="#2f9e44" />
            Telemetría y Rendimiento de Planta (SSOT)
          </h2>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#2b6cb0' }}>
            LÍNEA {sesion.linea.nombre_linea} · TURNO {sesion.turno.nombre_turno.toUpperCase()}
          </span>
        </div>
        <div className="panel-body">
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="precision_manufacturing" size={14} color="#2b6cb0" /> Total Ensamblado
              </span>
              <div className="kpi-value">{totalEnsamblado} <span style={{ fontSize: '13px', color: '#7b8794' }}>PZAS</span></div>
              <span className="kpi-subtext">Piezas serializadas en piso</span>
            </div>

            <div className="kpi-card" style={{ borderColor: 'rgba(47, 158, 68, 0.4)' }}>
              <span className="kpi-label" style={{ color: '#2f9e44', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="fact_check" size={14} color="#2f9e44" /> First-Pass Yield (Calidad)
              </span>
              <div className="kpi-value" style={{ color: '#2f9e44' }}>{tasaAprobacion}%</div>
              <span className="kpi-subtext">
                {totalAprobadas} aprobadas · {totalScrap} scrap · {totalRetrabajo} retrabajo
              </span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="inventory_2" size={14} color="#2b6cb0" /> Cajas Selladas
              </span>
              <div className="kpi-value" style={{ color: '#2b6cb0' }}>{cajasSelladas} <span style={{ fontSize: '13px', color: '#7b8794' }}>CAJAS</span></div>
              <span className="kpi-subtext">Listas para asignación de andén</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="local_shipping" size={14} color="#b7791f" /> Embarques en Curso
              </span>
              <div className="kpi-value" style={{ color: '#b7791f' }}>{embarquesActivos} <span style={{ fontSize: '13px', color: '#7b8794' }}>ÓRDENES</span></div>
              <span className="kpi-subtext">Control logístico y remisión</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ESTADO DE LÍNEAS Y PROTOCOLO INDUSTRIAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
        {/* Tabla de Líneas */}
        <div className="panel">
          <div className="panel-header">
            <h2>Líneas de Producción y Modelos</h2>
            <span className="badge badge-ok">Líneas en Servicio</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Línea</th>
                    <th>Modelo de Bocina</th>
                    <th>Capacidad Caja</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2b6cb0' }}>L1</td>
                    <td><strong>NS-PRO</strong> (Grafito Mate)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>6 pzas / caja</td>
                    <td><span className="badge badge-ok">Activa</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2b6cb0' }}>L2</td>
                    <td><strong>NS-MINI</strong> (Blanco Ártico)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>12 pzas / caja</td>
                    <td><span className="badge badge-ok">Activa</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2b6cb0' }}>L3</td>
                    <td><strong>NS-SPORT</strong> (Azul Cobalto)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>8 pzas / caja</td>
                    <td><span className="badge badge-ok">Activa</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Protocolo Operativo */}
        <div className="panel">
          <div className="panel-header">
            <h2>Flujo de Control en Planta</h2>
            <span className="badge badge-info">Norma ISO-9001</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="badge badge-info" style={{ minWidth: '60px', justifyContent: 'center' }}>PASO 1</span>
                <div>
                  <strong style={{ color: '#1f2933' }}>Ensamble & Serialización</strong>
                  <div style={{ fontSize: '12px', color: '#667085' }}>
                    Captura obligatoria de código de serie único por operador en estación.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="badge badge-warn" style={{ minWidth: '60px', justifyContent: 'center' }}>PASO 2</span>
                <div>
                  <strong style={{ color: '#1f2933' }}>Banco de Pruebas Acústicas</strong>
                  <div style={{ fontSize: '12px', color: '#667085' }}>
                    Inspección funcional: encendido, respuesta de frecuencia, carga y bluetooth.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="badge badge-ok" style={{ minWidth: '60px', justifyContent: 'center' }}>PASO 3</span>
                <div>
                  <strong style={{ color: '#1f2933' }}>Empaque en Cajas Maestras</strong>
                  <div style={{ fontSize: '12px', color: '#667085' }}>
                    Bloqueo de empaque si la pieza no cuenta con dictamen formal [Aprobada].
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="badge badge-neutral" style={{ minWidth: '60px', justifyContent: 'center' }}>PASO 4</span>
                <div>
                  <strong style={{ color: '#1f2933' }}>Embarque y Despacho</strong>
                  <div style={{ fontSize: '12px', color: '#667085' }}>
                    Asignación de cajas selladas a transportistas autorizados y salida de andén.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AUDITORÍA Y BITÁCORA RECIENTE */}
      <div className="panel">
        <div className="panel-header">
          <h2>Bitácora Reciente de Operaciones</h2>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#667085' }}>
            Auditoría de Planta en Tiempo Real
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Hora</th>
                  <th style={{ width: '130px' }}>Estación / Módulo</th>
                  <th>Operación Registrada</th>
                </tr>
              </thead>
              <tbody>
                {ultimosEventos.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#667085' }}>{ev.fecha}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        {ev.modulo}
                      </span>
                    </td>
                    <td>{ev.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}