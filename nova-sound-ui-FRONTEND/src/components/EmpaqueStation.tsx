import React, { useState, useEffect } from 'react';
import { EstadosCalidadEnum } from '../types/database';
import { usePlanta, CATALOGO_CAJAS } from '../context/PlantaContext';
import Icon from './common/Icon';

export const EmpaqueStation: React.FC = () => {
  const {
    unidades,
    cajas,
    movimientosEmpaque,
    crearCaja,
    empacarUnidadEnCaja,
    cerrarYSellarCaja,
    sesion,
  } = usePlanta();

  // Caja seleccionada actualmente en terminal
  const [cajaActivaId, setCajaActivaId] = useState<number>(1);

  useEffect(() => {
    if (cajas.length > 0 && !cajas.some((c) => c.id === cajaActivaId)) {
      setCajaActivaId(cajas[0].id);
    }
  }, [cajas, cajaActivaId]);

  // Input de código de serie
  const [inputSerial, setInputSerial] = useState('');

  // Notificaciones operativas
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Apertura de nueva caja
  const [mostrarCrearCaja, setMostrarCrearCaja] = useState(false);
  const [nuevoTipoCajaId, setNuevoTipoCajaId] = useState<number>(3); // PRO por defecto

  // Obtener caja activa y su catálogo
  const cajaActiva = cajas.find((c) => c.id === cajaActivaId) ?? cajas[0];
  const catalogoActivo = CATALOGO_CAJAS.find((cat) => cat.id === cajaActiva?.id_cat_caja);
  const unidadesEnCajaActiva = unidades.filter((u) => u.id_caja === cajaActiva?.id);
  const capacidadMaxima = catalogoActivo?.capacidad_maxima ?? 0;
  const cantidadActual = unidadesEnCajaActiva.length;
  const cajaLlena = capacidadMaxima > 0 && cantidadActual >= capacidadMaxima;
  const porcentajeLlenado = capacidadMaxima > 0 ? Math.round((cantidadActual / capacidadMaxima) * 100) : 0;

  // Piezas aprobadas listas para empaque (sueltas en planta)
  const piezasListasParaEmpaque = unidades.filter(
    (u) => u.id_estado_calidad === EstadosCalidadEnum.APROBADA && u.id_caja === null
  );

  const handleEmpacar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSerial.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'Ingrese o escanee un número de serie válido.' });
      return;
    }

    if (!cajaActiva) {
      setMensajeEstado({ tipo: 'error', texto: 'No hay ninguna caja seleccionada.' });
      return;
    }

    const res = empacarUnidadEnCaja(inputSerial, cajaActiva.id);
    if (!res.ok) {
      setMensajeEstado({ tipo: 'error', texto: res.error || 'Error al empacar unidad.' });
    } else {
      setMensajeEstado({
        tipo: 'ok',
        texto: `✓ Unidad ${inputSerial.toUpperCase().trim()} empacada con éxito en ${cajaActiva.codigo_caja}.`,
      });
      setInputSerial('');
    }
  };

  const handleCerrarCaja = () => {
    if (!cajaActiva) return;
    const res = cerrarYSellarCaja(cajaActiva.id);
    if (!res.ok) {
      setMensajeEstado({ tipo: 'error', texto: res.error || 'Error al sellar caja.' });
    } else {
      setMensajeEstado({
        tipo: 'ok',
        texto: `✓ Caja ${cajaActiva.codigo_caja} cerrada y sellada formalmente. Ahora disponible para Embarque.`,
      });
    }
  };

  const handleCrearNuevaCaja = () => {
    const nueva = crearCaja(nuevoTipoCajaId);
    setCajaActivaId(nueva.id);
    setMostrarCrearCaja(false);
    setMensajeEstado({
      tipo: 'ok',
      texto: `✓ Nueva caja ${nueva.codigo_caja} aperturada exitosamente en Línea ${sesion.linea.nombre_linea}.`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. SELECCIÓN Y ESTADO DE CAJA ACTIVA */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="inventory_2" color="#f59e0b" size="20px" />
            Estación de Empaque & Embalaje · Línea {sesion.linea.nombre_linea}
          </h2>
          <span className="badge badge-info">CONTROL DE LOTES Y CONTENEDORES</span>
        </div>

        <div className="panel-body">
          {mensajeEstado && (
            <div className={`alert-banner ${mensajeEstado.tipo === 'ok' ? 'alert-banner-ok' : 'alert-banner-error'}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name={mensajeEstado.tipo === 'ok' ? 'check_circle' : 'error'} size="16px" />
                {mensajeEstado.texto}
              </span>
              <button
                type="button"
                onClick={() => setMensajeEstado(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', padding: '2px 6px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size="16px" />
              </button>
            </div>
          )}

          {/* Selector de Caja y Apertura */}
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
              <label htmlFor="select-caja" style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase' }}>
                Caja Activa:
              </label>
              <select
                id="select-caja"
                value={cajaActivaId}
                onChange={(e) => {
                  setCajaActivaId(Number(e.target.value));
                  setMensajeEstado(null);
                }}
                style={{ flex: 1 }}
              >
                {cajas.map((c) => {
                  const cat = CATALOGO_CAJAS.find((k) => k.id === c.id_cat_caja);
                  const conteo = unidades.filter((u) => u.id_caja === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.codigo_caja} · {cat?.tipo_caja} ({conteo}/{cat?.capacidad_maxima} pzas) · [{c.estado.toUpperCase()}]
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setMostrarCrearCaja(!mostrarCrearCaja)}
            >
              <Icon name={mostrarCrearCaja ? 'close' : 'add_box'} size="16px" />
              {mostrarCrearCaja ? 'Cancelar' : 'Aperturar Nueva Caja'}
            </button>
          </div>

          {/* Subpanel para apertura de caja */}
          {mostrarCrearCaja && (
            <div
              style={{
                backgroundColor: '#161f2c',
                border: '1px solid #28374d',
                padding: '14px',
                borderRadius: '2px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="add_circle" size="16px" color="#38bdf8" />
                Aperturar Nuevo Contenedor (cat_cajas)
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={nuevoTipoCajaId}
                  onChange={(e) => setNuevoTipoCajaId(Number(e.target.value))}
                  style={{ minWidth: '300px' }}
                >
                  {CATALOGO_CAJAS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.tipo_caja} (Capacidad: {cat.capacidad_maxima} piezas)
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleCrearNuevaCaja}>
                  <Icon name="check" size="16px" />
                  Confirmar Apertura de Caja
                </button>
              </div>
            </div>
          )}

          {/* Ficha técnica y telemetría de la caja activa */}
          {cajaActiva && (
            <div
              style={{
                backgroundColor: '#161f2c',
                border: '1px solid #233145',
                padding: '16px',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#8493a8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    Contenedor Seleccionado:
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>
                    {cajaActiva.codigo_caja}{' '}
                    <span style={{ fontSize: '13px', color: '#38bdf8' }}>({catalogoActivo?.tipo_caja})</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className={`badge ${cajaActiva.estado === 'Cerrada' ? 'badge-danger' : 'badge-ok'}`}>
                    ESTADO: {cajaActiva.estado.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    className="btn btn-warning"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleCerrarCaja}
                    disabled={cajaActiva.estado === 'Cerrada' || cantidadActual === 0}
                  >
                    <Icon name="lock" size="16px" />
                    Cerrar y Sellar Caja
                  </button>
                </div>
              </div>

              {/* Barra de capacidad */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#8493a8' }}>CAPACIDAD EMPACADA</span>
                  <strong style={{ color: cajaLlena ? '#10b981' : '#38bdf8' }}>
                    {cantidadActual} / {capacidadMaxima} PZAS ({porcentajeLlenado}%)
                  </strong>
                </div>
                <div className="progress-track" style={{ height: '10px' }}>
                  <div
                    className={`progress-fill ${cajaLlena ? 'success' : ''}`}
                    style={{ width: `${porcentajeLlenado}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. ESCANEO PARA ASIGNACIÓN A CAJA */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="qr_code_scanner" size="18px" color="#38bdf8" />
            Empacar Unidad (Lectura de Pieza Aprobada)
          </h2>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8493a8' }}>
            UPDATE unidades.id_caja
          </span>
        </div>

        <div className="panel-body">
          {/* Piezas sueltas en planta listas para empacar */}
          {piezasListasParaEmpaque.length > 0 && (
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
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                PIEZAS APROBADAS ESPERANDO CAJA ({piezasListasParaEmpaque.length}):
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {piezasListasParaEmpaque.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      backgroundColor: inputSerial === u.numero_serie ? '#0284c7' : '#1c283a',
                      borderColor: inputSerial === u.numero_serie ? '#38bdf8' : '#2b3d56',
                      color: '#ffffff',
                    }}
                    onClick={() => setInputSerial(u.numero_serie)}
                  >
                    {u.numero_serie}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleEmpacar} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
            <label htmlFor="input-serial-pack" style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase' }}>
              Número de Serie a Empacar:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                id="input-serial-pack"
                type="text"
                value={inputSerial}
                onChange={(e) => setInputSerial(e.target.value)}
                placeholder="Escanee serie con dictamen APROBADA"
                disabled={cajaActiva?.estado === 'Cerrada' || cajaLlena}
                className="scanner-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={cajaActiva?.estado === 'Cerrada' || cajaLlena}
                style={{ padding: '0 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="archive" size="16px" />
                Empacar
              </button>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Solo unidades formalmente dictaminadas como <strong>Aprobada</strong> en Calidad pueden ingresar a la caja.
            </span>
          </form>
        </div>
      </div>

      {/* 3. CONTENIDO ACTUAL DE LA CAJA */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="inventory" size="18px" color="#38bdf8" />
            Piezas dentro de {cajaActiva?.codigo_caja} ({cantidadActual} Piezas)
          </h2>
          <span className="badge badge-neutral">Trazabilidad de Contenedor</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Slot</th>
                  <th>N° de Serie</th>
                  <th>Modelo</th>
                  <th>Color</th>
                  <th>Estado Calidad</th>
                </tr>
              </thead>
              <tbody>
                {unidadesEnCajaActiva.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                      (La caja se encuentra vacía. Escanee una unidad para comenzar el llenado).
                    </td>
                  </tr>
                ) : (
                  unidadesEnCajaActiva.map((u, idx) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>#{idx + 1}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                        {u.numero_serie}
                      </td>
                      <td>{u.modelo}</td>
                      <td>{u.color}</td>
                      <td>
                        <span className="badge badge-ok">Aprobada</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. BITÁCORA DE MOVIMIENTOS DE EMPAQUE */}
      <div className="panel">
        <div className="panel-header">
          <h2>
            <Icon name="history" size="18px" color="#38bdf8" />
            Bitácora de Empaque (historial_movimientos)
          </h2>
          <span className="badge badge-neutral">{movimientosEmpaque.length} Eventos</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Hora</th>
                  <th>Evento Operativo</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {movimientosEmpaque.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#8493a8' }}>{m.fecha}</td>
                    <td>{m.evento}</td>
                    <td style={{ fontSize: '11px', color: '#cbd5e1' }}>{m.usuario}</td>
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

export default EmpaqueStation;
