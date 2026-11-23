import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTema } from '../data/temas';
import {
  Cards,
  INTERVALOS_LEITNER,
  SESION_TARJETAS_SIZE,
  type MazoTipo,
  type TarjetaEstudio,
} from '../lib/cards';
import { Fmt } from '../lib/fmt';
import { Store, useStore } from '../lib/store';
import { abrirCuadroCuentas, IconLibro } from './CuadroCuentas';
import { Header } from './Header';
import { Mascot, type MascotEstado } from './Mascot';
import { SelectorTema, useUi } from './Selectors';

type FaseFlashcards = 'mazos' | 'sesion' | 'resumen';

const ETIQUETA_CAJA = [
  'Caja 0 · Hoy',
  'Caja 1 · 1 día',
  'Caja 2 · 3 días',
  'Caja 3 · 7 días',
  'Caja 4 · 16 días',
  'Caja 5 · 35 días',
];

export function Flashcards() {
  const store = useStore();
  const { tema, setTema } = useUi();

  const [mazoActivo, setMazoActivo] = useState<MazoTipo>('tema');
  const [fase, setFase] = useState<FaseFlashcards>('mazos');
  const [cola, setCola] = useState<TarjetaEstudio[]>([]);
  const [volteada, setVolteada] = useState(false);
  const [vistasUnicas, setVistasUnicas] = useState<string[]>([]);
  const [resueltasOk, setResueltasOk] = useState<string[]>([]);
  const [repasosTotal, setRepasosTotal] = useState(0);
  const [reintentosTotal, setReintentosTotal] = useState(0);
  const [xpSesion, setXpSesion] = useState(0);
  const [mascotEstado, setMascotEstado] = useState<MascotEstado>('pensando');
  const [notaReencolada, setNotaReencolada] = useState(false);

  const tarjetasMazo = useMemo(
    () => Cards.obtenerMazo(mazoActivo, tema, store.errores, store.leitner),
    [mazoActivo, tema, store.errores, store.leitner]
  );

  const resumenMazo = useMemo(
    () => Cards.resumenCajas(tarjetasMazo, store.leitner),
    [tarjetasMazo, store.leitner]
  );

  const tarjetasErroresTotal = useMemo(
    () => Cards.tarjetasErrores(store.errores),
    [store.errores]
  );

  const pendientesGlobalesCount = useMemo(
    () =>
      Cards.resumenCajas(
        Cards.todasConErrores(store.errores),
        store.leitner
      ).pendientesHoy,
    [store.errores, store.leitner]
  );

  const iniciarSesion = useCallback(
    (incluirAdelantadas = false) => {
      const seleccion = Cards.crearSesion(tarjetasMazo, {
        cantidad: SESION_TARJETAS_SIZE,
        incluirAdelantadas,
        leitnerMap: Store.get().leitner,
      });
      if (seleccion.length === 0) {
        return;
      }
      setCola(seleccion);
      setVolteada(false);
      setVistasUnicas([]);
      setResueltasOk([]);
      setRepasosTotal(0);
      setReintentosTotal(0);
      setXpSesion(0);
      setMascotEstado('pensando');
      setNotaReencolada(false);
      setFase('sesion');
    },
    [tarjetasMazo]
  );

  const tarjetaActual = cola[0] ?? null;

  const responderTarjeta = useCallback(
    (acierto: boolean) => {
      if (fase !== 'sesion' || !tarjetaActual) {
        return;
      }
      if (!volteada) {
        setVolteada(true);
        return;
      }

      const primeraVezEnSesion = !vistasUnicas.includes(tarjetaActual.id);
      Cards.responder(tarjetaActual, acierto, primeraVezEnSesion);

      if (primeraVezEnSesion) {
        setVistasUnicas((prev) => [...prev, tarjetaActual.id]);
        setXpSesion((prev) => prev + 1);
      }

      setRepasosTotal((prev) => prev + 1);
      setMascotEstado(acierto ? 'feliz' : 'triste');

      const resto = cola.slice(1);
      if (acierto) {
        setResueltasOk((prev) =>
          prev.includes(tarjetaActual.id) ? prev : [...prev, tarjetaActual.id]
        );
        setNotaReencolada(false);
        if (resto.length === 0) {
          setCola([]);
          setVolteada(false);
          setFase('resumen');
        } else {
          setCola(resto);
          setVolteada(false);
        }
      } else {
        setReintentosTotal((prev) => prev + 1);
        const posReinsercion = Math.min(2, resto.length);
        const nuevaCola = [
          ...resto.slice(0, posReinsercion),
          tarjetaActual,
          ...resto.slice(posReinsercion),
        ];
        setCola(nuevaCola);
        setVolteada(false);
        setNotaReencolada(true);
      }
    },
    [cola, fase, tarjetaActual, vistasUnicas, volteada]
  );

  useEffect(() => {
    if (fase !== 'sesion' || !tarjetaActual) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setVolteada((v) => !v);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (volteada) {
          responderTarjeta(false);
        } else {
          setVolteada(true);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (volteada) {
          responderTarjeta(true);
        } else {
          setVolteada(true);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fase, responderTarjeta, tarjetaActual, volteada]);

  const temaActualInfo = getTema(tema);
  const maxCajaCount = Math.max(1, ...resumenMazo.cajas);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header
        titulo="Flashcards"
        subtitulo="Repaso espaciado Leitner · Cuentas, fórmulas y principios"
        accionTexto={fase === 'sesion' ? 'Salir de sesión' : 'Jugar'}
        accionRuta={fase === 'sesion' ? undefined : '/jugar'}
        onAccion={fase === 'sesion' ? () => setFase('mazos') : undefined}
      />

      {fase === 'mazos' && (
        <>
          {/* Mazos por temática */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="label">Mazo por temática</span>
            <SelectorTema />
          </div>

          {/* Mazos extra + acceso directo a Cuadro de cuentas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div
              role="tablist"
              aria-label="Seleccionar tipo de mazo"
              style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mazoActivo === 'tema'}
                className={mazoActivo === 'tema' ? 'chip-dark' : 'chip'}
                style={{ cursor: 'pointer', minHeight: 40, padding: '6px 14px' }}
                onClick={() => setMazoActivo('tema')}
              >
                Mazo temático ({temaActualInfo.nombre})
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mazoActivo === 'pendientes'}
                className={mazoActivo === 'pendientes' ? 'chip-dark' : 'chip'}
                style={{ cursor: 'pointer', minHeight: 40, padding: '6px 14px' }}
                onClick={() => setMazoActivo('pendientes')}
              >
                Pendientes hoy ({pendientesGlobalesCount})
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mazoActivo === 'errores'}
                className={mazoActivo === 'errores' ? 'chip-dark' : 'chip'}
                style={{ cursor: 'pointer', minHeight: 40, padding: '6px 14px' }}
                onClick={() => setMazoActivo('errores')}
              >
                Mis errores ({tarjetasErroresTotal.length})
              </button>
            </div>

            <button
              type="button"
              className="btn-sec"
              style={{ minHeight: 36, padding: '0 14px' }}
              onClick={abrirCuadroCuentas}
            >
              <IconLibro size={15} />
              <span>Cuadro de cuentas</span>
            </button>
          </div>

          {/* Tarjeta de resumen Leitner */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Mascot
                  color={temaActualInfo.color}
                  estado={resumenMazo.pendientesHoy > 0 ? 'reposo' : 'feliz'}
                  size={64}
                />
                <div>
                  <span className="label">
                    {mazoActivo === 'errores'
                      ? 'Mazo · Mis errores'
                      : mazoActivo === 'pendientes'
                        ? 'Mazo · Pendientes hoy'
                        : `Mazo · ${temaActualInfo.nombre}`}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      marginTop: 4,
                    }}
                  >
                    <span className="big-num" style={{ fontSize: 'clamp(34px, 8.5vw, 52px)' }}>
                      {Fmt.num(resumenMazo.pendientesHoy)}
                    </span>
                    <span style={{ fontSize: 13.5, color: '#6B6B6B' }}>
                      pendientes hoy de{' '}
                      <strong className="tabular-nums" style={{ color: '#111111' }}>
                        {Fmt.num(resumenMazo.total)}
                      </strong>{' '}
                      tarjetas
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {resumenMazo.pendientesHoy > 0 ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => iniciarSesion(false)}
                  >
                    Repasar {Math.min(SESION_TARJETAS_SIZE, resumenMazo.pendientesHoy)} tarjetas →
                  </button>
                ) : resumenMazo.total > 0 ? (
                  <button
                    type="button"
                    className="btn-sec"
                    onClick={() => iniciarSesion(true)}
                  >
                    Adelantar {Math.min(SESION_TARJETAS_SIZE, resumenMazo.total)} tarjetas
                  </button>
                ) : null}
              </div>
            </div>

            {/* Cajas 0-5 como barras finas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span className="label">Cajas Leitner (0–5)</span>
                <span className="tabular-nums" style={{ fontSize: 12, color: '#6B6B6B' }}>
                  Intervalos: {INTERVALOS_LEITNER.join(' · ')} días
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 10,
                }}
              >
                {resumenMazo.cajas.map((cantidad, idx) => {
                  const pct =
                    resumenMazo.total > 0
                      ? Math.round((cantidad / maxCajaCount) * 100)
                      : 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.72)',
                        borderRadius: 14,
                        padding: '10px 12px',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>
                          {ETIQUETA_CAJA[idx]}
                        </span>
                        <span
                          className="tabular-nums"
                          style={{ fontSize: 13.5, fontWeight: 600, color: '#111111' }}
                        >
                          {cantidad}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 4,
                          borderRadius: 999,
                          backgroundColor: '#EDEBE6',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${cantidad > 0 ? Math.max(8, pct) : 0}%`,
                            height: '100%',
                            borderRadius: 999,
                            backgroundColor: idx === 0 ? '#111111' : temaActualInfo.color,
                            transition: 'width 200ms ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {mazoActivo === 'errores' && resumenMazo.total === 0 && (
              <div
                style={{
                  background: '#EDEBE6',
                  borderRadius: 16,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13.5, color: '#111111', lineHeight: 1.45 }}>
                  No tienes fallos pendientes para este filtro. Cuando falles en Jugar o Supuestos, aparecerán aquí automáticamente.
                </span>
                <button
                  type="button"
                  className="btn-sec"
                  onClick={() => {
                    setTema('completo');
                    setMazoActivo('tema');
                  }}
                >
                  Ver todas las tarjetas
                </button>
              </div>
            )}

            {mazoActivo !== 'errores' && resumenMazo.pendientesHoy === 0 && resumenMazo.total > 0 && (
              <div
                style={{
                  background: '#EDEBE6',
                  borderRadius: 16,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#111111',
                  lineHeight: 1.45,
                }}
              >
                ¡Al día en este mazo! Todas tus tarjetas están programadas para los próximos días. Puedes adelantar una ronda si quieres seguir practicando.
              </div>
            )}
          </section>
        </>
      )}

      {fase === 'sesion' && tarjetaActual && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Barra superior de sesión */}
          <section
            className="card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div
                aria-live="polite"
                style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
              >
                <span className="chip-dark tabular-nums">
                  {resueltasOk.length} / {Math.max(resueltasOk.length + cola.length, 1)} completadas
                </span>
                <span className="chip tabular-nums">
                  +{xpSesion} XP
                </span>
                {notaReencolada && (
                  <span className="chip" style={{ color: '#92400E' }}>
                    La anterior volverá en esta sesión
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn-sec"
                  style={{ minHeight: 36, padding: '0 12px', fontSize: 12.5 }}
                  onClick={abrirCuadroCuentas}
                >
                  <IconLibro size={15} />
                  <span>Cuadro de cuentas</span>
                </button>
                <button
                  type="button"
                  className="btn-sec"
                  style={{ minHeight: 36, padding: '0 12px', fontSize: 12.5 }}
                  onClick={() => setFase('mazos')}
                >
                  Terminar
                </button>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                height: 5,
                borderRadius: 999,
                backgroundColor: '#EDEBE6',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${
                    Math.round(
                      (resueltasOk.length /
                        Math.max(1, resueltasOk.length + cola.length)) *
                        100
                    )
                  }%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: '#111111',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
          </section>

          {/* Tarjeta central grande */}
          {(() => {
            const temaTarjeta = getTema(tarjetaActual.tema);
            const estadoLeitner = Cards.estadoDe(tarjetaActual.id, store.leitner);
            return (
              <div
                style={{
                  maxWidth: 680,
                  width: '100%',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => setVolteada((v) => !v)}
                  aria-label={
                    volteada
                      ? 'Tarjeta volteada mostrando la respuesta. Toca para ver el frente.'
                      : 'Toca o pulsa espacio para voltear la tarjeta.'
                  }
                  className="card"
                  style={{
                    width: '100%',
                    minHeight: 310,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    background: volteada
                      ? 'rgba(255, 255, 255, 0.88)'
                      : 'rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 18,
                    padding: '24px 24px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="chip">{temaTarjeta.nombre}</span>
                      <span className="chip">{tarjetaActual.etiqueta}</span>
                    </div>
                    <span className="chip-dark tabular-nums">
                      Caja {estadoLeitner.caja}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 14,
                      maxWidth: 540,
                      padding: '8px 0',
                    }}
                  >
                    <Mascot
                      color={temaTarjeta.color}
                      estado={volteada ? 'reposo' : mascotEstado}
                      size={62}
                    />

                    <span className="label">
                      {volteada ? 'Respuesta · Dorso' : 'Pregunta · Frente'}
                    </span>

                    <div
                      className={
                        /^\d{2,5}$/.test(volteada ? tarjetaActual.dorso : tarjetaActual.frente)
                          ? 'big-num'
                          : undefined
                      }
                      style={
                        /^\d{2,5}$/.test(volteada ? tarjetaActual.dorso : tarjetaActual.frente)
                          ? { fontSize: 'clamp(34px, 9vw, 54px)', fontWeight: 300, color: '#111111' }
                          : {
                              fontSize: volteada ? 19 : 21,
                              fontWeight: 600,
                              color: '#111111',
                              lineHeight: 1.38,
                            }
                      }
                    >
                      {volteada ? tarjetaActual.dorso : tarjetaActual.frente}
                    </div>

                    {(volteada
                      ? tarjetaActual.dorsoDetalle
                      : tarjetaActual.frenteDetalle) && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13.5,
                          color: '#525252',
                          lineHeight: 1.5,
                        }}
                      >
                        {volteada
                          ? tarjetaActual.dorsoDetalle
                          : tarjetaActual.frenteDetalle}
                      </p>
                    )}
                  </div>

                  <span style={{ fontSize: 12, color: '#595959' }}>
                    {volteada
                      ? 'Toca para volver al frente · ← Otra vez · → Lo sé'
                      : 'Toca la tarjeta o pulsa Espacio para voltear'}
                  </span>
                </button>

                {/* Botones de valoración */}
                {!volteada ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ minWidth: 200 }}
                      onClick={() => setVolteada(true)}
                    >
                      Mostrar respuesta (Espacio)
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <button
                      type="button"
                      className="btn-sec"
                      style={{ minHeight: 48, fontSize: 14 }}
                      onClick={() => responderTarjeta(false)}
                    >
                      ← Otra vez (Caja 0)
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ minHeight: 48, fontSize: 14 }}
                      onClick={() => responderTarjeta(true)}
                    >
                      Lo sé (Caja {Math.min(5, estadoLeitner.caja + 1)}) →
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {fase === 'resumen' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span className="label">Sesión de flashcards completada</span>
              <h2 className="card-title" style={{ fontSize: 18, marginTop: 4 }}>
                {mazoActivo === 'errores'
                  ? 'Mis errores'
                  : mazoActivo === 'pendientes'
                    ? 'Pendientes hoy'
                    : temaActualInfo.nombre}
              </h2>
              <p className="card-subtitle">
                Has consolidado todas las tarjetas de esta ronda en tus cajas Leitner.
              </p>
            </div>
            <Mascot color={temaActualInfo.color} estado="feliz" size={68} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                borderRadius: 16,
                padding: '14px 14px',
              }}
            >
              <span className="label">Tarjetas dominadas</span>
              <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)', marginTop: 4 }}>
                {resueltasOk.length}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                borderRadius: 16,
                padding: '14px 14px',
              }}
            >
              <span className="label">Repasos totales</span>
              <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)', marginTop: 4 }}>
                {repasosTotal}
              </div>
              {reintentosTotal > 0 && (
                <span className="chip" style={{ marginTop: 6, fontSize: 11 }}>
                  {reintentosTotal} reintentos
                </span>
              )}
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                borderRadius: 16,
                padding: '14px 14px',
              }}
            >
              <span className="label">XP ganados</span>
              <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)', marginTop: 4 }}>
                +{xpSesion}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {resumenMazo.pendientesHoy > 0 ? (
              <button
                type="button"
                className="btn"
                onClick={() => iniciarSesion(false)}
              >
                Seguir repasando ({Math.min(SESION_TARJETAS_SIZE, resumenMazo.pendientesHoy)}) →
              </button>
            ) : resumenMazo.total > 0 ? (
              <button
                type="button"
                className="btn"
                onClick={() => iniciarSesion(true)}
              >
                Practicar otra ronda →
              </button>
            ) : null}
            <button
              type="button"
              className="btn-sec"
              onClick={() => setFase('mazos')}
            >
              Volver a los mazos
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
