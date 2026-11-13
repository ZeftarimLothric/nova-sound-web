import React, { useState } from 'react';
import {
  usePlanta,
  CATALOGO_CLIENTES,
  CATALOGO_TRANSPORTISTAS,
} from '../context/PlantaContext';

export default function EmbarquesStation() {
  const {
    embarques,
    cajas,
    cajasAsignadasEmbarque,
    crearEmbarque,
    asignarCajaEmbarque,
    retirarCajaEmbarque,
    despacharEmbarque,
  } = usePlanta();

  const [embarqueSeleccionadoId, setEmbarqueSeleccionadoId] = useState<number>(embarques[0]?.id || 1);
  const [modalNuevo, setModalNuevo] = useState<boolean>(false);

  // Formulario nuevo embarque
  const [pedido, setPedido] = useState<string>('PED-2026-001');
  const [idCliente, setIdCliente] = useState<number>(CATALOGO_CLIENTES[0].id);
  const [idTransportista, setIdTransportista] = useState<number>(CATALOGO_TRANSPORTISTAS[0].id);
  const [chofer, setChofer] = useState<string>('Ramiro Valdés');
  const [placas, setPlacas] = useState<string>('NL-884-TX');
  const [fechaProg, setFechaProg] = useState<string>('2026-11-05 14:00');
  const [obs, setObs] = useState<string>('Embarque prioritario con sello de seguridad');

  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const embarqueActual = embarques.find((e) => e.id === embarqueSeleccionadoId);
  const cajasAsignadasIds = cajasAsignadasEmbarque[embarqueSeleccionadoId] || [];
  const cajasAsignadas = cajas.filter((c) => cajasAsignadasIds.includes(c.id));

  // Cajas cerradas disponibles SOLO para el cliente del embarque seleccionado (P-27)
  const cajasDisponibles = cajas.filter(
    (c) =>
      c.estado === 'Cerrada' &&
      c.id_cliente === embarqueActual?.id_cliente &&
      !cajasAsignadasIds.includes(c.id) &&
      (!c.id_embarque_asignado || c.id_embarque_asignado === embarqueActual?.id)
  );

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await crearEmbarque(pedido, idCliente, idTransportista, chofer, placas, fechaProg, obs);
    if (res.ok && res.embarque) {
      setEmbarqueSeleccionadoId(res.embarque.id);
      setModalNuevo(false);
      setMensaje({ tipo: 'ok', texto: `Embarque ${res.embarque.referencia_embarque} programado en sistema` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al programar embarque' });
    }
  };

  const handleAsignarCaja = async (cajaId: number) => {
    if (!embarqueActual) return;
    const res = await asignarCajaEmbarque(embarqueActual.id, cajaId);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Caja #${cajaId} vinculada al manifiesto del embarque` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al asignar caja' });
    }
  };

  const handleRetirarCaja = async (cajaId: number) => {
    if (!embarqueActual) return;
    const res = await retirarCajaEmbarque(embarqueActual.id, cajaId);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Caja #${cajaId} retirada del embarque` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al retirar caja' });
    }
  };

  const handleDespachar = async () => {
    if (!embarqueActual) return;
    const res = await despacharEmbarque(embarqueActual.id);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `¡EMBARQUE DESPACHADO! Salida confirmada y registrada en auditoría` });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Bloqueo de salida' });
    }
  };

  return (
    <div className="station-container">
      {/* HEADER INDUSTRIAL */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-deco-sq">06</div>
          <div className="station-title-box">
            <span className="station-badge-code">Módulo 06 · Despacho y Logística</span>
            <h1 className="station-title">Embarques y Salida de Producto Terminado</h1>
            <span className="station-subtitle">
              Manifiesto de carga con revalidación de Calidad en tiempo real (Incidente C)
            </span>
          </div>
        </div>
        <div className="station-header-right">
          <button onClick={() => setModalNuevo(true)} className="btn btn-yellow">
            + PROGRAMAR EMBARQUE
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

        {/* SELECTOR DE EMBARQUE */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">SELECCIÓN DE EMBARQUE ACTIVO (P-26..P-29)</span>
            {embarqueActual && (
              <span className={`badge ${embarqueActual.estado === 'Despachado' ? 'badge-ok' : 'badge-info'}`}>
                {embarqueActual.estado.toUpperCase()}
              </span>
            )}
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">EXPEDIENTE DE EMBARQUE</label>
                <select
                  className="form-select"
                  value={embarqueSeleccionadoId}
                  onChange={(e) => setEmbarqueSeleccionadoId(Number(e.target.value))}
                >
                  {embarques.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.referencia_embarque} - {e.cliente_nombre} [Pedido: {e.id_pedido}] - {e.estado}
                    </option>
                  ))}
                </select>
              </div>

              {embarqueActual && (
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', border: '1px solid var(--border-default)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--carbon-900)' }}>
                      Transportista: {embarqueActual.transportista_nombre}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Prog: {embarqueActual.fecha_programada}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>
                    Chofer: <strong>{embarqueActual.nombre_chofer}</strong> | Placas: <strong>{embarqueActual.placas_unidad}</strong> | Cliente: <strong>{embarqueActual.cliente_nombre}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MANIFIESTO DE CARGA Y ASIGNACIÓN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* CAJAS ASIGNADAS AL MANIFIESTO */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">MANIFIESTO DE CARGA ({cajasAsignadas.length} CAJAS)</span>
              <span className="badge badge-accent">
                TOTAL: {cajasAsignadas.reduce((sum, c) => sum + (c.piezas_actuales || 0), 0)} PIEZAS
              </span>
            </div>
            <div className="panel-body">
              {cajasAsignadas.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  [SIN CAJAS ASIGNADAS AL EMBARQUE - SELECCIONE DE LA LISTA DE DISPONIBLES]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {cajasAsignadas.map((caja) => (
                    <div
                      key={caja.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        borderLeft: '4px solid var(--accent)',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {caja.codigo_caja} // {caja.modelo_nombre} ({caja.color_nombre})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {caja.piezas_actuales} unidades selladas | Creador: Usuario #{caja.id_usuario_creador}
                        </div>
                      </div>

                      {embarqueActual?.estado !== 'Despachado' && (
                        <button
                          type="button"
                          onClick={() => handleRetirarCaja(caja.id)}
                          className="btn btn-outline"
                          style={{ height: '1.8rem', padding: '0 0.5rem', fontSize: '0.65rem' }}
                        >
                          RETIRAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {embarqueActual && embarqueActual.estado !== 'Despachado' && (
                <button
                  type="button"
                  onClick={handleDespachar}
                  disabled={cajasAsignadas.length === 0}
                  className="btn btn-yellow"
                  style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}
                >
                  CONFIRMAR SALIDA Y DESPACHO DE ANDÉN (REVALIDAR CALIDAD)
                </button>
              )}
            </div>
          </div>

          {/* CAJAS CERRADAS DISPONIBLES DEL CLIENTE (P-27) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">CAJAS CERRADAS DE {embarqueActual?.cliente_nombre?.toUpperCase()}</span>
              <span className="badge badge-accent">{cajasDisponibles.length} DISPONIBLES</span>
            </div>
            <div className="panel-body">
              {cajasDisponibles.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  [NO HAY MÁS CAJAS CERRADAS PARA ESTE CLIENTE EN ALMACÉN]
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cajasDisponibles.map((caja) => (
                    <div
                      key={caja.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {caja.codigo_caja}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {caja.modelo_nombre} ({caja.color_nombre}) - {caja.piezas_actuales} pzas
                        </div>
                      </div>

                      {embarqueActual?.estado !== 'Despachado' && (
                        <button
                          type="button"
                          onClick={() => handleAsignarCaja(caja.id)}
                          className="btn btn-carbon"
                          style={{ height: '1.8rem', padding: '0 0.6rem', fontSize: '0.65rem' }}
                        >
                          + AGREGAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PROGRAMAR EMBARQUE */}
      {modalNuevo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="station-title" style={{ fontSize: '1.2rem' }}>
                PROGRAMAR EMBARQUE (P-26)
              </span>
              <button onClick={() => setModalNuevo(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">PEDIDO / ORDEN DE COMPRA</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={pedido}
                    onChange={(e) => setPedido(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CLIENTE DESTINO</label>
                  <select className="form-select" value={idCliente} onChange={(e) => setIdCliente(Number(e.target.value))}>
                    {CATALOGO_CLIENTES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_cliente}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">LÍNEA TRANSPORTISTA</label>
                  <select
                    className="form-select"
                    value={idTransportista}
                    onChange={(e) => setIdTransportista(Number(e.target.value))}
                  >
                    {CATALOGO_TRANSPORTISTAS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">FECHA PROGRAMADA DE SALIDA</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={fechaProg}
                    onChange={(e) => setFechaProg(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">NOMBRE DEL CHOFER</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={chofer}
                    onChange={(e) => setChofer(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PLACAS DE LA UNIDAD</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={placas}
                    onChange={(e) => setPlacas(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">OBSERVACIONES DE EMBARQUE</label>
                <input
                  type="text"
                  className="form-input"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setModalNuevo(false)} className="btn btn-outline">
                  CANCELAR
                </button>
                <button type="submit" className="btn btn-yellow">
                  PROGRAMAR EMBARQUE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
