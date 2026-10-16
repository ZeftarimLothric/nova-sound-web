import React, { useState } from 'react';
import { EstadosCalidadEnum } from '../types/database';
import { usePlanta } from '../context/PlantaContext';
import Icon from './common/Icon';

const DEFECTOS_CATALOGO = [
  { id: 1, categoria: 'Apariencia', descripcion: 'Rayón en carcasa' },
  { id: 2, categoria: 'Apariencia', descripcion: 'Color desigual' },
  { id: 3, categoria: 'Apariencia', descripcion: 'Logo mal impreso' },
  { id: 4, categoria: 'Funcional', descripcion: 'Audio distorsiona' },
  { id: 5, categoria: 'Funcional', descripcion: 'Batería no carga' },
  { id: 6, categoria: 'Funcional', descripcion: 'Bluetooth no conecta' },
  { id: 7, categoria: 'Funcional', descripcion: 'Puerto USB flojo' },
  { id: 8, categoria: 'Ensamble', descripcion: 'Botón flojo o atascado' },
  { id: 9, categoria: 'Ensamble', descripcion: 'Carcasa con rebaba o grieta' },
  { id: 10, categoria: 'Ensamble', descripcion: 'Rejilla abollada' },
];

export const CalidadStation: React.FC = () => {
  const { unidades, dictaminarCalidad, historialUnidades, sesion } = usePlanta();

  // Estado del formulario de prueba
  const [numeroSerie, setNumeroSerie] = useState('');
  const [validaEncendido, setValidaEncendido] = useState(true);
  const [validaAudio, setValidaAudio] = useState(true);
  const [validaCarga, setValidaCarga] = useState(true);
  const [validaBluetooth, setValidaBluetooth] = useState(true);

  // Dictamen y justificación
  const [idEstadoCalidad, setIdEstadoCalidad] = useState<number>(EstadosCalidadEnum.APROBADA);
  const [defectoSeleccionado, setDefectoSeleccionado] = useState(DEFECTOS_CATALOGO[0].descripcion);
  const [comentarios, setComentarios] = useState('');

  // Mensaje de retroalimentación
  const [mensajeTerminal, setMensajeTerminal] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Unidades pendientes de inspección (id_estado_calidad === 0)
  const unidadesPendientes = unidades.filter((u) => u.id_estado_calidad === 0);

  // Si alguna prueba funcional es desmarcada, sugerir automáticamente retrabajo
  const handleCheckPrueba = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    nuevoValor: boolean
  ) => {
    setter(nuevoValor);
    if (!nuevoValor && idEstadoCalidad === EstadosCalidadEnum.APROBADA) {
      setIdEstadoCalidad(EstadosCalidadEnum.EN_RETRABAJO);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroSerie.trim()) {
      setMensajeTerminal({ tipo: 'error', texto: 'Debe ingresar o seleccionar un Número de Serie para evaluar.' });
      return;
    }

    const estadoNombreMap: Record<number, string> = {
      [EstadosCalidadEnum.APROBADA]: 'Aprobada',
      [EstadosCalidadEnum.EN_RETRABAJO]: 'En retrabajo',
      [EstadosCalidadEnum.EN_RETENCION]: 'En retención',
      [EstadosCalidadEnum.SCRAP]: 'Scrap',
    };

    const estadoNuevoNombre = estadoNombreMap[idEstadoCalidad] ?? 'Desconocido';
    const motivoFinal =
      idEstadoCalidad === EstadosCalidadEnum.APROBADA
        ? 'Pruebas funcionales superadas sin defectos'
        : `${defectoSeleccionado} ${comentarios ? `(${comentarios})` : ''}`.trim();

    const res = dictaminarCalidad(
      numeroSerie,
      idEstadoCalidad,
      {
        encendido: validaEncendido,
        audio: validaAudio,
        carga: validaCarga,
        bluetooth: validaBluetooth,
      },
      motivoFinal
    );

    if (!res.ok) {
      setMensajeTerminal({ tipo: 'error', texto: res.error || 'Error al dictaminar calidad.' });
      return;
    }

    setMensajeTerminal({
      tipo: 'ok',
      texto: `✓ Unidad ${numeroSerie.toUpperCase().trim()} dictaminada como [${estadoNuevoNombre.toUpperCase()}]. Registrado en SSOT.`,
    });

    // Resetear formulario para la siguiente pieza
    setNumeroSerie('');
    setValidaEncendido(true);
    setValidaAudio(true);
    setValidaCarga(true);
    setValidaBluetooth(true);
    setIdEstadoCalidad(EstadosCalidadEnum.APROBADA);
    setComentarios('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. CABECERA DE ESTACIÓN */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="fact_check" color="#10b981" size="20px" />
            Estación de Inspección & Control de Calidad · Línea {sesion.linea.nombre_linea}
          </h2>
          <span className="badge badge-ok">CHECKLIST PROTOCOLO ISO-9001</span>
        </div>

        <div className="panel-body">
          {mensajeTerminal && (
            <div className={`alert-banner ${mensajeTerminal.tipo === 'ok' ? 'alert-banner-ok' : 'alert-banner-error'}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name={mensajeTerminal.tipo === 'ok' ? 'check_circle' : 'error'} size="16px" />
                {mensajeTerminal.texto}
              </span>
              <button
                type="button"
                onClick={() => setMensajeTerminal(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: '2px 6px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size="16px" />
              </button>
            </div>
          )}

          {/* Unidades en cola de espera */}
          {unidadesPendientes.length > 0 && (
            <div
              style={{
                backgroundColor: '#161f2c',
                border: '1px solid #28374d',
                padding: '10px 14px',
                borderRadius: '2px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                EN COLA DE INSPECCIÓN ({unidadesPendientes.length}):
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {unidadesPendientes.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      backgroundColor: numeroSerie === u.numero_serie ? '#0284c7' : '#1c283a',
                      borderColor: numeroSerie === u.numero_serie ? '#38bdf8' : '#2b3d56',
                      color: '#ffffff',
                    }}
                    onClick={() => setNumeroSerie(u.numero_serie)}
                  >
                    {u.numero_serie}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Campo Serie */}
            <div style={{ maxWidth: '500px' }}>
              <label htmlFor="input-serial" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px', textTransform: 'uppercase' }}>
                Número de Serie a Dictaminar:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="input-serial"
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ej. UN-0025 o escanee código"
                  className="scanner-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Banco de Pruebas Físicas */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="electrical_services" size="16px" color="#38bdf8" />
                1. Pruebas Funcionales y Eléctricas (prueba_funcional)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: validaEncendido ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${validaEncendido ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    padding: '10px 14px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={validaEncendido}
                    onChange={(e) => handleCheckPrueba(setValidaEncendido, e.target.checked)}
                  />
                  <Icon name="power_settings_new" size="18px" color={validaEncendido ? '#10b981' : '#ef4444'} />
                  <span style={{ color: validaEncendido ? '#f1f5f9' : '#f87171', fontWeight: 600 }}>
                    Encendido y Energía
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: validaAudio ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${validaAudio ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    padding: '10px 14px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={validaAudio}
                    onChange={(e) => handleCheckPrueba(setValidaAudio, e.target.checked)}
                  />
                  <Icon name="volume_up" size="18px" color={validaAudio ? '#10b981' : '#ef4444'} />
                  <span style={{ color: validaAudio ? '#f1f5f9' : '#f87171', fontWeight: 600 }}>
                    Respuesta Acústica / Driver
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: validaCarga ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${validaCarga ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    padding: '10px 14px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={validaCarga}
                    onChange={(e) => handleCheckPrueba(setValidaCarga, e.target.checked)}
                  />
                  <Icon name="battery_charging_full" size="18px" color={validaCarga ? '#10b981' : '#ef4444'} />
                  <span style={{ color: validaCarga ? '#f1f5f9' : '#f87171', fontWeight: 600 }}>
                    Carga Batería (USB-C)
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: validaBluetooth ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${validaBluetooth ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    padding: '10px 14px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={validaBluetooth}
                    onChange={(e) => handleCheckPrueba(setValidaBluetooth, e.target.checked)}
                  />
                  <Icon name="bluetooth" size="18px" color={validaBluetooth ? '#10b981' : '#ef4444'} />
                  <span style={{ color: validaBluetooth ? '#f1f5f9' : '#f87171', fontWeight: 600 }}>
                    Enlace Bluetooth 5.3
                  </span>
                </label>
              </div>
            </div>

            {/* Dictamen Formal de Calidad */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="gavel" size="16px" color="#38bdf8" />
                2. Dictamen Operativo (catalogo_estados_calidad)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIdEstadoCalidad(EstadosCalidadEnum.APROBADA)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${idEstadoCalidad === EstadosCalidadEnum.APROBADA ? '#10b981' : '#263449'}`,
                    backgroundColor: idEstadoCalidad === EstadosCalidadEnum.APROBADA ? 'rgba(16, 185, 129, 0.15)' : '#141d2b',
                    color: idEstadoCalidad === EstadosCalidadEnum.APROBADA ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="check_circle" size="16px" color="#10b981" />
                    1. APROBADA
                  </strong>
                  <span style={{ fontSize: '11px', color: '#8493a8' }}>Apta para empaque en caja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdEstadoCalidad(EstadosCalidadEnum.EN_RETRABAJO)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${idEstadoCalidad === EstadosCalidadEnum.EN_RETRABAJO ? '#f59e0b' : '#263449'}`,
                    backgroundColor: idEstadoCalidad === EstadosCalidadEnum.EN_RETRABAJO ? 'rgba(245, 158, 11, 0.15)' : '#141d2b',
                    color: idEstadoCalidad === EstadosCalidadEnum.EN_RETRABAJO ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ color: '#f59e0b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="build" size="16px" color="#f59e0b" />
                    2. EN RETRABAJO
                  </strong>
                  <span style={{ fontSize: '11px', color: '#8493a8' }}>Corrección técnica en línea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdEstadoCalidad(EstadosCalidadEnum.EN_RETENCION)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${idEstadoCalidad === EstadosCalidadEnum.EN_RETENCION ? '#f59e0b' : '#263449'}`,
                    backgroundColor: idEstadoCalidad === EstadosCalidadEnum.EN_RETENCION ? 'rgba(245, 158, 11, 0.15)' : '#141d2b',
                    color: idEstadoCalidad === EstadosCalidadEnum.EN_RETENCION ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ color: '#f59e0b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="pause_circle" size="16px" color="#f59e0b" />
                    3. EN RETENCIÓN
                  </strong>
                  <span style={{ fontSize: '11px', color: '#8493a8' }}>Auditoría o cuarentena</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdEstadoCalidad(EstadosCalidadEnum.SCRAP)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${idEstadoCalidad === EstadosCalidadEnum.SCRAP ? '#ef4444' : '#263449'}`,
                    backgroundColor: idEstadoCalidad === EstadosCalidadEnum.SCRAP ? 'rgba(239, 68, 68, 0.15)' : '#141d2b',
                    color: idEstadoCalidad === EstadosCalidadEnum.SCRAP ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="delete_forever" size="16px" color="#ef4444" />
                    4. SCRAP (DESECHO)
                  </strong>
                  <span style={{ fontSize: '11px', color: '#8493a8' }}>Falla destructiva / descarte</span>
                </button>
              </div>
            </div>

            {/* Bloque de defecto si no es Aprobada */}
            {idEstadoCalidad !== EstadosCalidadEnum.APROBADA && (
              <div
                style={{
                  backgroundColor: '#1b1419',
                  border: '1px solid #4a1f28',
                  padding: '14px',
                  borderRadius: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <label htmlFor="select-defecto" style={{ display: 'block', color: '#fca5a5', fontWeight: 700, marginBottom: '6px' }}>
                    Clasificación de Falla (catalogo_defectos):
                  </label>
                  <select
                    id="select-defecto"
                    value={defectoSeleccionado}
                    onChange={(e) => setDefectoSeleccionado(e.target.value)}
                    style={{ maxWidth: '400px' }}
                  >
                    {DEFECTOS_CATALOGO.map((def) => (
                      <option key={def.id} value={def.descripcion}>
                        [{def.categoria}] {def.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="comentarios" style={{ display: 'block', color: '#fca5a5', fontWeight: 700, marginBottom: '6px' }}>
                    Observaciones técnicas de inspección:
                  </label>
                  <input
                    id="comentarios"
                    type="text"
                    placeholder="Detalle de la falla o causa raíz..."
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Acciones finales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setNumeroSerie('');
                  setValidaEncendido(true);
                  setValidaAudio(true);
                  setValidaCarga(true);
                  setValidaBluetooth(true);
                  setIdEstadoCalidad(EstadosCalidadEnum.APROBADA);
                  setComentarios('');
                }}
              >
                <Icon name="restart_alt" size="16px" />
                Limpiar Formulario
              </button>
              <button
                type="submit"
                className={`btn ${idEstadoCalidad === EstadosCalidadEnum.APROBADA ? 'btn-success' : 'btn-danger'}`}
                style={{ padding: '8px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Icon name="task_alt" size="18px" />
                Registrar Dictamen de Calidad
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. BITÁCORA DE DICTÁMENES RECIENTES */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="history" size="18px" color="#38bdf8" />
            Trazabilidad de Calidad (historial_unidades)
          </h2>
          <span className="badge badge-neutral">{historialUnidades.length} Registros</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° de Serie</th>
                  <th>Dictamen</th>
                  <th>Motivo / Diagnóstico</th>
                  <th>Fecha y Hora</th>
                  <th>Inspector</th>
                </tr>
              </thead>
              <tbody>
                {historialUnidades.map((reg) => {
                  let badge = 'badge-ok';
                  if (reg.estado_nuevo === 'Scrap') badge = 'badge-danger';
                  else if (reg.estado_nuevo !== 'Aprobada') badge = 'badge-warn';

                  return (
                    <tr key={reg.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                        {reg.numero_serie}
                      </td>
                      <td>
                        <span className={`badge ${badge}`}>{reg.estado_nuevo}</span>
                      </td>
                      <td>{reg.motivo}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>{reg.fecha_hora}</td>
                      <td style={{ fontSize: '11px', color: '#cbd5e1' }}>{reg.usuario_nombre}</td>
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

export default CalidadStation;
