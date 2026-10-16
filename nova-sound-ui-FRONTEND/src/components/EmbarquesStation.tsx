import React, { useState, useEffect } from 'react';
import { usePlanta, CATALOGO_CAJAS } from '../context/PlantaContext';
import Icon from './common/Icon';

interface TransportistaItem {
  id: number;
  nombre: string;
  rfc: string;
  telefono: string;
  activo: boolean;
}

interface ClienteItem {
  id: number;
  nombre_cliente: string;
  tipo_cliente: string;
}

const TRANSPORTISTAS_CATALOGO: TransportistaItem[] = [
  { id: 1, nombre: 'Transportes Castores S.A.', rfc: 'CAS980214XX1', telefono: '8441234560', activo: true },
  { id: 2, nombre: 'Logística Express Norte', rfc: 'LEN050820XX2', telefono: '8441234561', activo: true },
  { id: 3, nombre: 'Juan Pérez (Flete Directo)', rfc: 'PERJ800101XX3', telefono: '8441234562', activo: true },
  { id: 4, nombre: 'Transportes Rápidos Monterrey', rfc: 'TRM120305XX4', telefono: '8441234563', activo: true },
];

const CLIENTES_CATALOGO: ClienteItem[] = [
  { id: 1, nombre_cliente: 'AudioMax', tipo_cliente: 'Cadena Comercial' },
  { id: 2, nombre_cliente: 'SonidoPlus', tipo_cliente: 'Distribuidor' },
  { id: 3, nombre_cliente: 'ElectroWorld', tipo_cliente: 'Cadena Comercial' },
  { id: 4, nombre_cliente: 'MegaSound', tipo_cliente: 'Distribuidor' },
];

export const EmbarquesStation: React.FC = () => {
  const {
    cajas,
    embarques,
    historialEmbarque,
    crearEmbarque,
    asignarCajaAEmbarque,
    retirarCajaDeEmbarque,
    despacharEmbarque,
    unidades,
  } = usePlanta();

  const [embarqueActivoId, setEmbarqueActivoId] = useState<number>(1);

  useEffect(() => {
    if (embarques.length > 0 && !embarques.some((e) => e.id === embarqueActivoId)) {
      setEmbarqueActivoId(embarques[0].id);
    }
  }, [embarques, embarqueActivoId]);
  const [cajaParaAsignarId, setCajaParaAsignarId] = useState<number>(0);

  const [mostrarNuevoEmbarque, setMostrarNuevoEmbarque] = useState(false);
  const [nuevoClienteId, setNuevoClienteId] = useState<number>(1);
  const [nuevoTransportistaId, setNuevoTransportistaId] = useState<number>(1);
  const [nuevaFechaProg, setNuevaFechaProg] = useState<string>('2026-09-26');
  const [nuevasObservaciones, setNuevasObservaciones] = useState<string>('');

  const [notificacion, setNotificacion] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const embarqueActivo = embarques.find((e) => e.id === embarqueActivoId) ?? embarques[0];
  const clienteActivo = CLIENTES_CATALOGO.find((c) => c.id === embarqueActivo?.id_cliente);
  const transportistaActivo = TRANSPORTISTAS_CATALOGO.find((t) => t.id === embarqueActivo?.id_transportista);

  const cajasEnEmbarque = cajas.filter((c) => c.id_embarque_asignado === embarqueActivo?.id);

  const totalPiezasEnEmbarque = cajasEnEmbarque.reduce((acc, c) => {
    const pzsEnCaja = unidades.filter((u) => u.id_caja === c.id).length;
    return acc + pzsEnCaja;
  }, 0);

  const cajasDisponibles = cajas.filter((c) => c.id_embarque_asignado === null);

  const handleAsignarCaja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!embarqueActivo) return;

    const idTarget = cajaParaAsignarId || cajasDisponibles[0]?.id;
    if (!idTarget) {
      setNotificacion({ tipo: 'error', texto: 'No hay cajas disponibles en almacén.' });
      return;
    }

    const res = asignarCajaAEmbarque(idTarget, embarqueActivo.id);
    if (!res.ok) {
      setNotificacion({ tipo: 'error', texto: res.error || 'Error al asignar caja.' });
    } else {
      setNotificacion({
        tipo: 'ok',
        texto: `✓ Caja asignada exitosamente al embarque ${embarqueActivo.referencia_embarque}.`,
      });
    }
  };

  const handleRetirarCaja = (cajaId: number, codigoCaja: string) => {
    if (!embarqueActivo) return;
    const res = retirarCajaDeEmbarque(cajaId, embarqueActivo.id);
    if (!res.ok) {
      setNotificacion({ tipo: 'error', texto: res.error || 'Error al retirar caja.' });
    } else {
      setNotificacion({
        tipo: 'ok',
        texto: `Caja ${codigoCaja} retirada del embarque y devuelta a almacén.`,
      });
    }
  };

  const handleConfirmarDespacho = () => {
    if (!embarqueActivo) return;
    const res = despacharEmbarque(embarqueActivo.id);
    if (!res.ok) {
      setNotificacion({ tipo: 'error', texto: res.error || 'Error al despachar embarque.' });
    } else {
      setNotificacion({
        tipo: 'ok',
        texto: `✓ EMBARQUE ${embarqueActivo.referencia_embarque} DESPACHADO FORMALMENTE. Estado: [EN TRÁNSITO].`,
      });
    }
  };

  const handleCrearEmbarque = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo = crearEmbarque(nuevoClienteId, nuevoTransportistaId, nuevaFechaProg, nuevasObservaciones);
    setEmbarqueActivoId(nuevo.id);
    setMostrarNuevoEmbarque(false);
    setNuevasObservaciones('');
    setNotificacion({
      tipo: 'ok',
      texto: `✓ Nuevo embarque ${nuevo.referencia_embarque} registrado y listo para carga de cajas.`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. CABECERA Y SELECCIÓN DE EMBARQUE */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="local_shipping" color="#38bdf8" size="20px" />
            Módulo de Embarques & Despacho Logístico de Andén
          </h2>
          <span className="badge badge-info">CONTROL DE REMISIONES</span>
        </div>

        <div className="panel-body">
          {notificacion && (
            <div className={`alert-banner ${notificacion.tipo === 'ok' ? 'alert-banner-ok' : 'alert-banner-error'}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name={notificacion.tipo === 'ok' ? 'check_circle' : 'error'} size="16px" />
                {notificacion.texto}
              </span>
              <button
                type="button"
                onClick={() => setNotificacion(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: '2px 6px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size="16px" />
              </button>
            </div>
          )}

          {/* Selector de Embarque */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px' }}>
              <label htmlFor="select-emb" style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase' }}>
                Orden de Embarque:
              </label>
              <select
                id="select-emb"
                value={embarqueActivoId}
                onChange={(e) => {
                  setEmbarqueActivoId(Number(e.target.value));
                  setNotificacion(null);
                }}
                style={{ flex: 1 }}
              >
                {embarques.map((emb) => {
                  const cli = CLIENTES_CATALOGO.find((c) => c.id === emb.id_cliente);
                  return (
                    <option key={emb.id} value={emb.id}>
                      {emb.referencia_embarque} · {cli?.nombre_cliente} · [{emb.estado.toUpperCase()}]
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setMostrarNuevoEmbarque(!mostrarNuevoEmbarque)}
            >
              <Icon name={mostrarNuevoEmbarque ? 'close' : 'add_task'} size="16px" />
              {mostrarNuevoEmbarque ? 'Cancelar' : 'Programar Nuevo Embarque'}
            </button>
          </div>

          {/* Formulario desplegable para nuevo embarque */}
          {mostrarNuevoEmbarque && (
            <form
              onSubmit={handleCrearEmbarque}
              style={{
                backgroundColor: '#161f2c',
                border: '1px solid #28374d',
                padding: '16px',
                borderRadius: '2px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="schedule_send" size="16px" color="#38bdf8" />
                Programar Nueva Salida de Andén (embarque)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <label htmlFor="nuevo-cliente" style={{ display: 'block', marginBottom: '4px' }}>Cliente Destino:</label>
                  <select
                    id="nuevo-cliente"
                    value={nuevoClienteId}
                    onChange={(e) => setNuevoClienteId(Number(e.target.value))}
                  >
                    {CLIENTES_CATALOGO.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.nombre_cliente} ({cli.tipo_cliente})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nuevo-transp" style={{ display: 'block', marginBottom: '4px' }}>Transportista Autorizado:</label>
                  <select
                    id="nuevo-transp"
                    value={nuevoTransportistaId}
                    onChange={(e) => setNuevoTransportistaId(Number(e.target.value))}
                  >
                    {TRANSPORTISTAS_CATALOGO.map((tra) => (
                      <option key={tra.id} value={tra.id}>
                        {tra.nombre} - RFC: {tra.rfc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="fecha-prog" style={{ display: 'block', marginBottom: '4px' }}>Fecha Programada:</label>
                  <input
                    id="fecha-prog"
                    type="date"
                    value={nuevaFechaProg}
                    onChange={(e) => setNuevaFechaProg(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="obs-prog" style={{ display: 'block', marginBottom: '4px' }}>Instrucciones / Observaciones:</label>
                <input
                  id="obs-prog"
                  type="text"
                  placeholder="Detalles de entrega, andén, chofer..."
                  value={nuevasObservaciones}
                  onChange={(e) => setNuevasObservaciones(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="submit" className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="check" size="16px" />
                  Confirmar Registro de Embarque
                </button>
              </div>
            </form>
          )}

          {/* Ficha técnica del embarque */}
          {embarqueActivo && (
            <div
              style={{
                backgroundColor: '#161f2c',
                border: '1px solid #233145',
                padding: '16px',
                borderRadius: '2px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#8493a8', textTransform: 'uppercase' }}>Folio Embarque:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                  {embarqueActivo.referencia_embarque}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#8493a8', textTransform: 'uppercase' }}>Cliente:</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                  {clienteActivo?.nombre_cliente}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#8493a8', textTransform: 'uppercase' }}>Transporte / RFC:</span>
                <div style={{ fontSize: '13px', color: '#f1f5f9' }}>
                  {transportistaActivo?.nombre}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>RFC: {transportistaActivo?.rfc}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#8493a8', textTransform: 'uppercase' }}>Fecha Salida:</span>
                <div style={{ fontSize: '13px', color: '#f1f5f9' }}>
                  {embarqueActivo.fecha_programada}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#8493a8', textTransform: 'uppercase' }}>Estado de Andén:</span>
                <div>
                  <span className={`badge ${embarqueActivo.estado === 'En Tránsito' ? 'badge-ok' : 'badge-warn'}`}>
                    {embarqueActivo.estado.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. CARGA DE CAJAS SELLADAS */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="move_to_inbox" size="18px" color="#38bdf8" />
            Asignación de Cajas a la Carga (embarque_caja)
          </h2>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8493a8' }}>
            {cajasDisponibles.length} Cajas Disponibles en Almacén
          </span>
        </div>

        <div className="panel-body">
          <form onSubmit={handleAsignarCaja} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '320px' }}>
              <select
                value={cajaParaAsignarId}
                onChange={(e) => setCajaParaAsignarId(Number(e.target.value))}
                disabled={embarqueActivo?.estado === 'En Tránsito' || cajasDisponibles.length === 0}
              >
                {cajasDisponibles.map((c) => {
                  const cat = CATALOGO_CAJAS.find((k) => k.id === c.id_cat_caja);
                  const pzs = unidades.filter((u) => u.id_caja === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.codigo_caja} · {cat?.tipo_caja} ({pzs} piezas) · [{c.estado.toUpperCase()}]
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={embarqueActivo?.estado === 'En Tránsito' || cajasDisponibles.length === 0}
            >
              <Icon name="add" size="16px" />
              Cargar Caja a Remisión
            </button>
          </form>

          <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            * Regla estricta: Solo cajas con dictamen de <strong>Cerrada</strong> en Empaque pueden ser asignadas a la unidad de transporte.
          </span>
        </div>
      </div>

      {/* 3. MANIFIESTO DE CARGA */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="receipt_long" size="18px" color="#38bdf8" />
            Manifiesto de Carga: {embarqueActivo?.referencia_embarque}
          </h2>
          <span className="badge badge-info">
            {cajasEnEmbarque.length} Cajas · {totalPiezasEnEmbarque} Bocinas
          </span>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Item</th>
                  <th>Código de Caja</th>
                  <th>Modelo de Caja</th>
                  <th>Contenido (Unidades)</th>
                  <th>Estado</th>
                  <th style={{ width: '120px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cajasEnEmbarque.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                      (No hay cajas cargadas en este embarque. Seleccione una caja arriba para agregarla).
                    </td>
                  </tr>
                ) : (
                  cajasEnEmbarque.map((c, idx) => {
                    const cat = CATALOGO_CAJAS.find((k) => k.id === c.id_cat_caja);
                    const pzs = unidades.filter((u) => u.id_caja === c.id).length;
                    return (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>#{idx + 1}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                          {c.codigo_caja}
                        </td>
                        <td>{cat?.tipo_caja}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {pzs} piezas
                        </td>
                        <td>
                          <span className="badge badge-ok">{c.estado}</span>
                        </td>
                        <td>
                          {embarqueActivo?.estado !== 'En Tránsito' ? (
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleRetirarCaja(c.id, c.codigo_caja)}
                            >
                              <Icon name="delete" size="14px" />
                              Bajar de Carga
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Bloqueado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Barra de acción de despacho */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#161f2c',
              borderTop: '1px solid #233145',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#8493a8' }}>TOTAL REMISIÓN:</span>{' '}
              <strong style={{ color: '#f1f5f9' }}>{cajasEnEmbarque.length} cajas selladas</strong> ({totalPiezasEnEmbarque} bocinas terminadas).
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => window.print()}>
                <Icon name="print" size="16px" />
                Imprimir Remisión
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmarDespacho}
                disabled={embarqueActivo?.estado === 'En Tránsito' || cajasEnEmbarque.length === 0}
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Icon name="local_shipping" size="18px" />
                Confirmar Salida de Transporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BITÁCORA LOGÍSTICA */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="history" size="18px" color="#38bdf8" />
            Bitácora de Salidas y Trazabilidad (embarque_historial)
          </h2>
          <span className="badge badge-neutral">{historialEmbarque.length} Eventos</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Hora</th>
                  <th>Operación</th>
                  <th>Detalle</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {historialEmbarque.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>{ev.fecha_hora}</td>
                    <td style={{ fontWeight: 600, color: '#38bdf8' }}>{ev.operacion}</td>
                    <td>{ev.detalle}</td>
                    <td style={{ fontSize: '11px', color: '#cbd5e1' }}>{ev.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbarquesStation;
