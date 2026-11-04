import React, { useState } from 'react';
import { usePlanta, CATALOGO_CLIENTES, CATALOGO_MODELOS, CATALOGO_COLORES, CATALOGO_LINEAS } from '../context/PlantaContext';

export default function OrdenesStation() {
  const { ordenes, crearOrden, importarOrdenesCsv, asignarLineaOrden } = usePlanta();

  const [folio, setFolio] = useState('');
  const [idCliente, setIdCliente] = useState(CATALOGO_CLIENTES[0].id);
  const [idModelo, setIdModelo] = useState(CATALOGO_MODELOS[0].id);
  const [idColor, setIdColor] = useState(CATALOGO_COLORES[0].id);
  const [cantidad, setCantidad] = useState(100);
  const [fechaCompromiso, setFechaCompromiso] = useState('2026-11-20');
  const [modalImportar, setModalImportar] = useState(false);
  const [textoCsv, setTextoCsv] = useState(
    'folio,modelo,color,cliente,cantidad,compromiso\nORD-2026-201,NS-PRO,Negro,SoundCorp Retail,120,2026-11-25\nORD-2026-202,NS-SPORT,Azul,MegaAudio Distribución,80,2026-11-28\nORD-2026-203,NS-MINI,Blanco,TechBeat Stores,200,2026-11-30'
  );
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    const res = crearOrden(folio, idCliente, idModelo, idColor, cantidad, fechaCompromiso);
    if (!res.ok) {
      setMensaje({ tipo: 'err', texto: res.error || 'Error al crear la orden' });
    } else {
      setMensaje({ tipo: 'ok', texto: `Orden ${folio} registrada en sistema` });
      setFolio('');
    }
  };

  const handleImportar = () => {
    const res = importarOrdenesCsv(textoCsv);
    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: `Importación exitosa: ${res.importadas} órdenes cargadas` });
      setModalImportar(false);
    } else {
      setMensaje({ tipo: 'err', texto: res.error || 'Error en importación' });
    }
  };

  return (
    <div className="station-container">
      {/* CABECERA INDUSTRIAL ENDFIELD */}
      <div className="station-header tex-carbon">
        <div className="station-header-left">
          <div className="station-deco-sq">01</div>
          <div className="station-title-box">
            <span className="station-badge-code">[MOD_ORDENES // GESTIÓN DE PRODUCCIÓN]</span>
            <h1 className="station-title">Órdenes de Producción y Asignación</h1>
            <span className="station-subtitle">Alta, programación e importación de pedidos para líneas L1, L2 y L3</span>
          </div>
        </div>
        <div className="station-header-right">
          <button onClick={() => setModalImportar(true)} className="btn btn-carbon">
            IMPORTAR CSV
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* FORMULARIO DE CAPTURA MANUAL */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">ALTA DE NUEVA ORDEN</span>
              <span className="badge badge-accent">MANUAL_ENTRY</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">FOLIO DE LA ORDEN</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ORD-2026-105"
                    className="form-input"
                    value={folio}
                    onChange={(e) => setFolio(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CLIENTE DESTINO</label>
                  <select className="form-select" value={idCliente} onChange={(e) => setIdCliente(Number(e.target.value))}>
                    {CATALOGO_CLIENTES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_cliente} ({c.tipo_cliente})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">MODELO</label>
                    <select className="form-select" value={idModelo} onChange={(e) => setIdModelo(Number(e.target.value))}>
                      {CATALOGO_MODELOS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre_modelo} ({m.capacidad_caja}/caja)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">COLOR</label>
                    <select className="form-select" value={idColor} onChange={(e) => setIdColor(Number(e.target.value))}>
                      {CATALOGO_COLORES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre_color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">CANTIDAD (PIEZAS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="form-input"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">FECHA COMPROMISO</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={fechaCompromiso}
                      onChange={(e) => setFechaCompromiso(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-yellow" style={{ marginTop: '0.5rem' }}>
                  REGISTRAR ORDEN
                </button>
              </form>
            </div>
          </div>

          {/* LISTA DE ÓRDENES Y ASIGNACIÓN A LÍNEAS */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">ÓRDENES ACTIVAS EN PLANTA ({ordenes.length})</span>
              <span className="badge badge-info">EN_SEGUIMIENTO</span>
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
                      <th>LÍNEA ASIGNADA</th>
                      <th>ESTADO</th>
                      <th>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                          {ord.folio}
                        </td>
                        <td>{ord.cliente_nombre}</td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{ord.modelo_nombre}</span> - {ord.color_nombre}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {ord.piezas_ensambladas || 0} / {ord.cantidad} pzas
                        </td>
                        <td>
                          {ord.id_linea_asignada ? (
                            <span className="badge badge-ok">LÍNEA {ord.linea_nombre}</span>
                          ) : (
                            <span className="badge badge-warn">SIN ASIGNAR</span>
                          )}
                        </td>
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
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {CATALOGO_LINEAS.map((linea) => (
                              <button
                                key={linea.id}
                                onClick={() => asignarLineaOrden(ord.id, linea.id)}
                                className="btn btn-outline"
                                style={{
                                  height: '1.8rem',
                                  padding: '0 0.5rem',
                                  fontSize: '0.65rem',
                                  backgroundColor: ord.id_linea_asignada === linea.id ? 'var(--accent)' : undefined,
                                  color: ord.id_linea_asignada === linea.id ? 'var(--dark-900)' : undefined,
                                  borderColor: ord.id_linea_asignada === linea.id ? 'var(--accent)' : undefined,
                                }}
                                title={`Asignar a Línea ${linea.nombre_linea}`}
                              >
                                {linea.nombre_linea}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE IMPORTACIÓN CSV */}
      {modalImportar && (
        <div className="modal-overlay">
          <div className="modal-content tex-carbon">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="station-title" style={{ fontSize: '1.2rem' }}>
                IMPORTACIÓN MASIVA DE ÓRDENES (CSV)
              </span>
              <button onClick={() => setModalImportar(false)} className="btn btn-outline" style={{ height: '2rem' }}>
                CERRAR
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-300)', marginBottom: '0.75rem' }}>
              Formato esperado por línea: <code>folio,modelo,color,cliente,cantidad,compromiso</code>
            </p>
            <textarea
              className="form-textarea"
              rows={8}
              value={textoCsv}
              onChange={(e) => setTextoCsv(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setModalImportar(false)} className="btn btn-outline">
                CANCELAR
              </button>
              <button onClick={handleImportar} className="btn btn-yellow">
                PROCESAR IMPORTACIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
