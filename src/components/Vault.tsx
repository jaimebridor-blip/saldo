import React, { useMemo, useRef, useState } from 'react';
import { getTema, TEMAS, type TemaId } from '../data/temas';
import { AI } from '../lib/ai';
import { Engine, type ResultadoCorreccion } from '../lib/engine';
import { Fmt } from '../lib/fmt';
import { go } from '../lib/router';
import { Store, useStore } from '../lib/store';
import type { Linea } from '../lib/types';
import {
  Vault as VaultLib,
  type DetalleSolucionVault,
  type ErrorVaultItem,
  type EstadoVaultFiltro,
  type OrdenVaultFiltro,
  type RetoVaultItem,
} from '../lib/vault';
import { EditorAsiento, type EditorAsientoHandle } from './EditorAsiento';
import { FeedbackPanel, TablaAsientoResuelto } from './games/common';
import { Header } from './Header';
import { Mascot, type MascotEstado } from './Mascot';

function formatearFechaHora(ts: number): string {
  const f = Fmt.fechaHora(ts);
  return f === '—' ? 'Fecha reciente' : f;
}

function formatearLineasCorto(lineas: Linea[]): string {
  if (lineas.length === 0) return 'Sin responder';
  return lineas
    .map((l) => `${l.c} ${l.d > 0 ? `D ${Fmt.eur(l.d)}` : `H ${Fmt.eur(l.h)}`}`)
    .join(' | ');
}

interface ResumenRepaso {
  aciertos: number;
  total: number;
  xp: number;
  nuevosDominados: number;
}

export function Vault() {
  const store = useStore();
  const tieneAI = AI.tieneClave();

  // Filtros de la vista principal
  const [temaFiltro, setTemaFiltro] = useState<TemaId | 'todas'>('todas');
  const [juegoFiltro, setJuegoFiltro] = useState<string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoVaultFiltro>('pendientes');
  const [ordenFiltro, setOrdenFiltro] = useState<OrdenVaultFiltro>('recientes');

  // Expansión de solución resuelta e IA por tarjeta
  const [solucionesAbiertas, setSolucionesAbiertas] = useState<
    Record<string, DetalleSolucionVault>
  >({});
  const [iaTextos, setIaTextos] = useState<Record<string, string>>({});
  const [iaCargando, setIaCargando] = useState<Record<string, boolean>>({});
  const [iaErrores, setIaErrores] = useState<Record<string, string>>({});

  // Modo "Repasar como juego"
  const [enRepaso, setEnRepaso] = useState(false);
  const [retos, setRetos] = useState<RetoVaultItem[]>([]);
  const [indiceReto, setIndiceReto] = useState(0);
  const [resumen, setResumen] = useState<ResumenRepaso | null>(null);

  // Estado de cada pregunta del repaso
  const [feedbackReto, setFeedbackReto] = useState<{
    ok: boolean;
    puntos: number;
    titulo: string;
    correccionAsiento?: ResultadoCorreccion;
    explicaciones: string[];
    dominadoAhora?: boolean;
  } | null>(null);
  const [numInput, setNumInput] = useState('');
  const [editorKey, setEditorKey] = useState(1);
  const editorRef = useRef<EditorAsientoHandle | null>(null);

  const [sesionAciertos, setSesionAciertos] = useState(0);
  const [sesionXp, setSesionXp] = useState(0);
  const [sesionDominados, setSesionDominados] = useState(0);

  const pendientesCount = useMemo(
    () => VaultLib.pendientes(store.errores).length,
    [store.errores]
  );
  const dominadosCount = store.errores.length - pendientesCount;

  const juegosDisponibles = useMemo(
    () => VaultLib.juegosDisponibles(store.errores),
    [store.errores]
  );

  const erroresFiltrados = useMemo(
    () =>
      VaultLib.filtrar(store.errores, {
        tema: temaFiltro,
        juego: juegoFiltro,
        estado: estadoFiltro,
        orden: ordenFiltro,
      }),
    [store.errores, temaFiltro, juegoFiltro, estadoFiltro, ordenFiltro]
  );

  const temaActualColor = getTema(
    temaFiltro === 'todas' ? store.ui.tema : temaFiltro
  ).color;

  const toggleSolucion = (item: ErrorVaultItem) => {
    setSolucionesAbiertas((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: VaultLib.resolverDetalle(item),
      };
    });
  };

  const marcarDominado = (id: string) => {
    Store.update((prev) => ({
      ...prev,
      errores: VaultLib.marcarDominado(prev.errores, id),
    }));
  };

  const borrarError = (id: string) => {
    Store.update((prev) => ({
      ...prev,
      errores: VaultLib.eliminar(prev.errores, id),
    }));
  };

  const explicarConIA = async (item: ErrorVaultItem) => {
    if (!AI.tieneClave() || iaCargando[item.id]) {
      return;
    }

    setIaCargando((prev) => ({ ...prev, [item.id]: true }));
    setIaErrores((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    const prompt =
      `Eres profesor de Contabilidad Financiera (PGC español). Explica de forma clara y directa por qué la respuesta del alumno falla y cómo llegar a la correcta. ` +
      `Responde en español en menos de 120 palabras, sin markdown innecesario.\n\n` +
      `Enunciado: ${item.enunciado}\n` +
      `Tu respuesta: ${item.tuRespuesta}\n` +
      `Solución correcta: ${item.correcta}`;

    try {
      const texto = await AI.llamar(prompt);
      setIaTextos((prev) => ({ ...prev, [item.id]: texto.trim() }));
    } catch (err) {
      setIaErrores((prev) => ({
        ...prev,
        [item.id]:
          err instanceof Error
            ? err.message
            : 'No se pudo obtener la explicación con IA.',
      }));
    } finally {
      setIaCargando((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const iniciarRepasoComoJuego = () => {
    const base =
      erroresFiltrados.length > 0
        ? erroresFiltrados
        : VaultLib.pendientes(store.errores);
    if (base.length === 0) {
      return;
    }
    const listaRetos = base.slice(0, 12).map((e) => VaultLib.crearRetoRepaso(e));
    setRetos(listaRetos);
    setIndiceReto(0);
    setFeedbackReto(null);
    setNumInput('');
    setEditorKey((k) => k + 1);
    setSesionAciertos(0);
    setSesionXp(0);
    setSesionDominados(0);
    setResumen(null);
    setEnRepaso(true);
  };

  const registrarResultadoRepaso = (
    item: ErrorVaultItem,
    ok: boolean,
    tuRespuestaTexto: string,
    detallesFeedback: {
      puntos: number;
      titulo: string;
      correccionAsiento?: ResultadoCorreccion;
      explicaciones: string[];
    }
  ) => {
    Store.contar('vault');
    Store.marcarDia();
    Store.registrar(item.tema === 'completo' ? 'conceptos' : item.tema, ok);

    let dominadoAhora = false;

    if (ok) {
      Store.addXP(8);
      setSesionAciertos((a) => a + 1);
      setSesionXp((x) => x + 8);
      const antesDominado = item.dominado;
      Store.update((prev) => {
        const siguientes = VaultLib.marcarAcierto(prev.errores, item.id, 2);
        const actualizado = siguientes.find((e) => e.id === item.id);
        dominadoAhora = Boolean(!antesDominado && actualizado?.dominado);
        return {
          ...prev,
          errores: siguientes,
        };
      });
      if (dominadoAhora) {
        setSesionDominados((d) => d + 1);
      }
    } else {
      Store.update((prev) => ({
        ...prev,
        errores: VaultLib.registrarFalloRepaso(
          prev.errores,
          item.id,
          tuRespuestaTexto
        ),
      }));
    }

    setFeedbackReto({
      ok,
      puntos: detallesFeedback.puntos,
      titulo: detallesFeedback.titulo,
      correccionAsiento: detallesFeedback.correccionAsiento,
      explicaciones: detallesFeedback.explicaciones,
      dominadoAhora,
    });
  };

  const retoActual = retos[indiceReto] ?? null;

  const responderAsientoReto = (lineas: Linea[]) => {
    if (!retoActual || retoActual.tipo !== 'asiento' || feedbackReto) return;
    const res = Engine.corregir(retoActual.asiento, lineas);
    editorRef.current?.marcar(res);
    const explicaciones = Engine.explicarLineas(retoActual.asiento);
    if (retoActual.nota) {
      explicaciones.push(retoActual.nota);
    }
    registrarResultadoRepaso(
      retoActual.item,
      res.ok,
      formatearLineasCorto(lineas),
      {
        puntos: res.puntos,
        titulo: res.ok ? '✓ Asiento correcto (+8 XP)' : 'Revisa el asiento',
        correccionAsiento: res,
        explicaciones,
      }
    );
  };

  const responderOpcionReto = (opcion: string) => {
    if (!retoActual || retoActual.tipo !== 'opcion' || feedbackReto) return;
    const ok = opcion === retoActual.correctaTexto;
    registrarResultadoRepaso(retoActual.item, ok, opcion, {
      puntos: ok ? 1 : 0,
      titulo: ok
        ? '✓ Respuesta correcta (+8 XP)'
        : `La correcta era: ${retoActual.correctaTexto}`,
      explicaciones: retoActual.explicaciones,
    });
  };

  const responderNumeroReto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retoActual || retoActual.tipo !== 'numero' || feedbackReto) return;
    const parsed = Fmt.parse(numInput);
    const ok =
      Number.isFinite(parsed) && Math.abs(parsed - retoActual.esperado) <= 0.01;
    const dadaTxt = Number.isFinite(parsed)
      ? Fmt.eur(parsed)
      : numInput.trim() || '—';
    registrarResultadoRepaso(retoActual.item, ok, dadaTxt, {
      puntos: ok ? 1 : 0,
      titulo: ok
        ? `✓ Exacto: ${Fmt.eur(retoActual.esperado)} (+8 XP)`
        : `Valor esperado: ${Fmt.eur(retoActual.esperado)}`,
      explicaciones: retoActual.explicaciones,
    });
  };

  const responderEstudioReto = (loSabia: boolean) => {
    if (!retoActual || retoActual.tipo !== 'estudio-reto' || feedbackReto) return;
    registrarResultadoRepaso(
      retoActual.item,
      loSabia,
      loSabia ? retoActual.item.correcta : 'Necesito repasarlo más',
      {
        puntos: loSabia ? 1 : 0,
        titulo: loSabia
          ? '✓ Registrado como acierto (+8 XP)'
          : 'Anotado para volver a practicarlo',
        explicaciones: retoActual.explicaciones,
      }
    );
  };

  const avanzarReto = () => {
    const siguiente = indiceReto + 1;
    if (siguiente >= retos.length) {
      setResumen({
        aciertos: sesionAciertos,
        total: retos.length,
        xp: sesionXp,
        nuevosDominados: sesionDominados,
      });
      return;
    }
    setIndiceReto(siguiente);
    setFeedbackReto(null);
    setNumInput('');
    setEditorKey((k) => k + 1);
  };

  const salirRepaso = () => {
    setEnRepaso(false);
    setRetos([]);
    setIndiceReto(0);
    setFeedbackReto(null);
    setResumen(null);
  };

  // =========================================================================
  // VISTA MODO "REPASAR COMO JUEGO"
  // =========================================================================
  if (enRepaso) {
    if (resumen) {
      const ratio = resumen.total > 0 ? resumen.aciertos / resumen.total : 0;
      const estadoMascota: MascotEstado =
        ratio >= 0.7 ? 'feliz' : ratio >= 0.4 ? 'pensando' : 'triste';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Header
            titulo="Error Vault"
            subtitulo="Registro de fallos · Repaso completado"
            accionTexto="Volver al Vault"
            onAccion={salirRepaso}
          />

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
                <span className="label">Repaso de fallos completado</span>
                <h2 className="card-title" style={{ fontSize: 18, marginTop: 4 }}>
                  Sesión en modo Reto
                </h2>
                <p className="card-subtitle">
                  Con 2 aciertos seguidos cada fallo queda marcado como dominado.
                </p>
              </div>
              <Mascot color={temaActualColor} estado={estadoMascota} size={68} />
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
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: 16,
                  padding: '14px 14px',
                }}
              >
                <span className="label">Aciertos</span>
                <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)', marginTop: 4 }}>
                  {resumen.aciertos}/{resumen.total}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: 16,
                  padding: '14px 14px',
                }}
              >
                <span className="label">XP ganados</span>
                <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)', marginTop: 4 }}>
                  +{resumen.xp}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: 16,
                  padding: '14px 14px',
                }}
              >
                <span className="label">Nuevos dominados</span>
                <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)', marginTop: 4 }}>
                  {resumen.nuevosDominados}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {pendientesCount > 0 && (
                <button
                  type="button"
                  className="btn"
                  onClick={iniciarRepasoComoJuego}
                >
                  Seguir repasando pendientes →
                </button>
              )}
              <button type="button" className="btn-sec" onClick={salirRepaso}>
                Volver al Error Vault
              </button>
            </div>
          </section>
        </div>
      );
    }

    const itemActual = retoActual?.item;
    const temaRetoInfo = getTema(itemActual?.tema ?? 'conceptos');
    const itemEnStore = store.errores.find((e) => e.id === itemActual?.id) ?? itemActual;
    const estadoMascotaReto: MascotEstado = feedbackReto
      ? feedbackReto.ok
        ? 'feliz'
        : 'triste'
      : 'pensando';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header
          titulo="Error Vault"
          subtitulo="Repasar como juego · Modo Reto (+8 XP por acierto)"
          accionTexto="Salir"
          onAccion={salirRepaso}
        />

        {retoActual && itemActual && (
          <>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip-dark tabular-nums">
                    Fallo {indiceReto + 1} de {retos.length}
                  </span>
                  <span className="chip">{temaRetoInfo.nombre}</span>
                  <span className="chip">{itemActual.juego}</span>
                  <span className="chip tabular-nums">
                    Racha: {itemEnStore?.aciertosSeguidos ?? 0}/2
                  </span>
                </div>

                <Mascot
                  color={temaRetoInfo.color}
                  estado={estadoMascotaReto}
                  size={44}
                />
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
                    width: `${Math.round(((indiceReto + (feedbackReto ? 1 : 0)) / Math.max(1, retos.length)) * 100)}%`,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: '#111111',
                    transition: 'width 200ms ease',
                  }}
                />
              </div>
            </section>

            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card-head" style={{ marginBottom: 0 }}>
                <div>
                  <span className="label">Enunciado del fallo</span>
                  <h2 className="card-title" style={{ marginTop: 6, fontSize: 16 }}>
                    {itemActual.enunciado}
                  </h2>
                </div>
                <span className="chip tabular-nums">
                  {itemActual.vecesFallo} {itemActual.vecesFallo === 1 ? 'fallo' : 'fallos'}
                </span>
              </div>

              {retoActual.tipo === 'asiento' && (
                <EditorAsiento
                  key={editorKey}
                  ref={editorRef}
                  lineas={Math.max(2, retoActual.asiento.lineas.length)}
                  bloqueado={Boolean(feedbackReto)}
                  onComprobar={responderAsientoReto}
                />
              )}

              {retoActual.tipo === 'opcion' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {retoActual.opciones.map((op, idx) => {
                    const respondida = Boolean(feedbackReto);
                    const esCorrecta = op === retoActual.correctaTexto;
                    let bg = 'rgba(255,255,255,0.84)';
                    let color = '#111111';
                    let border = 'rgba(0,0,0,0.08)';
                    if (respondida && esCorrecta) {
                      bg = 'rgba(16,185,129,0.14)';
                      color = '#065F46';
                      border = 'rgba(16,185,129,0.4)';
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={respondida}
                        onClick={() => responderOpcionReto(op)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          minHeight: 46,
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: bg,
                          color,
                          border: `1px solid ${border}`,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: respondida ? 'default' : 'pointer',
                        }}
                      >
                        {op}
                      </button>
                    );
                  })}
                </div>
              )}

              {retoActual.tipo === 'numero' && (
                <form
                  onSubmit={responderNumeroReto}
                  style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    className="field tabular-nums"
                    style={{ flex: '1 1 200px', textAlign: 'right' }}
                    disabled={Boolean(feedbackReto)}
                    placeholder="Introduce el importe exacto (tol. 0,01)"
                    value={numInput}
                    onChange={(e) => setNumInput(e.target.value)}
                    autoFocus
                  />
                  {!feedbackReto && (
                    <button type="submit" className="btn">
                      Comprobar
                    </button>
                  )}
                </form>
              )}

              {retoActual.tipo === 'estudio-reto' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      background: '#EDEBE6',
                      borderRadius: 14,
                      padding: '12px 14px',
                      fontSize: 13.5,
                      color: '#111111',
                    }}
                  >
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>
                      Solución esperada
                    </span>
                    <strong>{itemActual.correcta}</strong>
                  </div>

                  {!feedbackReto && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button
                        type="button"
                        className="btn-sec"
                        onClick={() => responderEstudioReto(false)}
                      >
                        Aún lo fallo
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => responderEstudioReto(true)}
                      >
                        Lo he resuelto bien
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {feedbackReto && (
              <FeedbackPanel
                ok={feedbackReto.ok}
                puntos={feedbackReto.puntos}
                titulo={
                  feedbackReto.dominadoAhora
                    ? `${feedbackReto.titulo} · ¡Dominado (2 seguidos)!`
                    : feedbackReto.titulo
                }
                correccionAsiento={feedbackReto.correccionAsiento}
                explicaciones={feedbackReto.explicaciones}
                esUltimo={indiceReto + 1 >= retos.length}
                onSiguiente={avanzarReto}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL DEL ERROR VAULT
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header
        titulo="Error Vault"
        subtitulo="Registro de fallos"
        accionTexto={erroresFiltrados.length > 0 ? 'Repasar como juego' : undefined}
        onAccion={erroresFiltrados.length > 0 ? iniciarRepasoComoJuego : undefined}
      />

      {/* Resumen + Repasar como juego */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Mascot
              color={temaActualColor}
              estado={pendientesCount === 0 ? 'feliz' : 'reposo'}
              size={60}
            />
            <div>
              <span className="label">Fallos pendientes de dominar</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <span className="big-num" style={{ fontSize: 'clamp(32px, 9vw, 50px)' }}>
                  {Fmt.num(pendientesCount)}
                </span>
                <span style={{ fontSize: 13.5, color: '#6B6B6B' }}>
                  pendientes ·{' '}
                  <strong className="tabular-nums" style={{ color: '#111111' }}>
                    {Fmt.num(dominadosCount)}
                  </strong>{' '}
                  dominados
                </span>
              </div>
            </div>
          </div>

          {erroresFiltrados.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={iniciarRepasoComoJuego}
            >
              Repasar como juego ({Math.min(12, erroresFiltrados.length)}) →
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filtro por temática (chips) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="label">Temática</span>
            <div className="tema-scroll" role="group" aria-label="Filtrar fallos por temática">
              <button
                type="button"
                className={temaFiltro === 'todas' ? 'chip-dark' : 'chip'}
                style={{ cursor: 'pointer', minHeight: 34 }}
                onClick={() => setTemaFiltro('todas')}
              >
                Todas
              </button>
              {TEMAS.filter((t) => t.id !== 'completo').map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={temaFiltro === t.id ? 'chip-dark' : 'chip'}
                  style={{ cursor: 'pointer', minHeight: 34 }}
                  onClick={() => setTemaFiltro(t.id)}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: t.color,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span>{t.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por juego */}
          {juegosDisponibles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="label">Juego u origen</span>
              <div className="tema-scroll" role="group" aria-label="Filtrar fallos por juego">
                <button
                  type="button"
                  className={juegoFiltro === 'todos' ? 'chip-dark' : 'chip'}
                  style={{ cursor: 'pointer', minHeight: 34 }}
                  onClick={() => setJuegoFiltro('todos')}
                >
                  Todos
                </button>
                {juegosDisponibles.map((j) => (
                  <button
                    key={j}
                    type="button"
                    className={juegoFiltro === j ? 'chip-dark' : 'chip'}
                    style={{ cursor: 'pointer', minHeight: 34 }}
                    onClick={() => setJuegoFiltro(j)}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtro por estado y orden */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div className="segmented" role="tablist" aria-label="Filtrar por estado">
              {(
                [
                  { id: 'pendientes', label: `Pendientes (${pendientesCount})` },
                  { id: 'dominados', label: `Dominados (${dominadosCount})` },
                  { id: 'todos', label: `Todos (${store.errores.length})` },
                ] as const
              ).map((est) => (
                <button
                  key={est.id}
                  type="button"
                  role="tab"
                  className={`segmented-btn tabular-nums ${
                    estadoFiltro === est.id ? 'is-active' : ''
                  }`}
                  onClick={() => setEstadoFiltro(est.id)}
                  aria-selected={estadoFiltro === est.id}
                >
                  {est.label}
                </button>
              ))}
            </div>

            <div className="segmented" role="tablist" aria-label="Ordenar fallos">
              <button
                type="button"
                role="tab"
                aria-selected={ordenFiltro === 'recientes'}
                className={`segmented-btn ${
                  ordenFiltro === 'recientes' ? 'is-active' : ''
                }`}
                onClick={() => setOrdenFiltro('recientes')}
              >
                Más recientes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ordenFiltro === 'fallados'}
                className={`segmented-btn ${
                  ordenFiltro === 'fallados' ? 'is-active' : ''
                }`}
                onClick={() => setOrdenFiltro('fallados')}
              >
                Más fallados
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de fallos o estado vacío */}
      {erroresFiltrados.length === 0 ? (
        <section
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 14,
            padding: '32px 22px',
          }}
        >
          <Mascot color={temaActualColor} estado="feliz" size={76} />
          <div style={{ maxWidth: 460 }}>
            <h2 className="card-title" style={{ fontSize: 17 }}>
              {store.errores.length === 0
                ? 'Tu Error Vault está limpio'
                : 'No hay fallos con este filtro'}
            </h2>
            <p className="card-subtitle" style={{ marginTop: 6, fontSize: 13.5 }}>
              {store.errores.length === 0
                ? 'Cada vez que falles en Jugar o en un Supuesto, el ejercicio se guardará aquí para repasarlo hasta dominarlo con 2 aciertos seguidos.'
                : 'Prueba a cambiar la temática, el juego o el estado para ver tus registros guardados.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {store.errores.length > 0 ? (
              <button
                type="button"
                className="btn-sec"
                onClick={() => {
                  setTemaFiltro('todas');
                  setJuegoFiltro('todos');
                  setEstadoFiltro('todos');
                }}
              >
                Mostrar todos los fallos
              </button>
            ) : null}
            <button
              type="button"
              className="btn"
              onClick={() => go(store.modo === 'examen' ? '/supuestos' : '/jugar')}
            >
              {store.modo === 'examen' ? 'Ir a Supuestos →' : 'Ir a Jugar →'}
            </button>
          </div>
        </section>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {erroresFiltrados.map((item) => {
            const temaInfo = getTema(item.tema);
            const solucion = solucionesAbiertas[item.id];
            const textoIA = iaTextos[item.id];
            const cargandoIA = Boolean(iaCargando[item.id]);
            const errorIA = iaErrores[item.id];

            return (
              <article
                key={item.id}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {/* Cabecera de la tarjeta: temática, juego, estado y fecha */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="chip">
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: temaInfo.color,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      <span>{temaInfo.nombre}</span>
                    </span>
                    <span className="chip">{item.juego}</span>
                    <span
                      className={item.dominado ? 'chip-dark' : 'chip'}
                      style={{ fontSize: 11.5 }}
                    >
                      {item.dominado
                        ? 'Dominado ✓'
                        : `Pendiente · ${item.aciertosSeguidos}/2 seguidos`}
                    </span>
                  </div>

                  <div
                    className="tabular-nums"
                    style={{ fontSize: 12, color: '#595959', display: 'flex', gap: 10 }}
                  >
                    <span>
                      {item.vecesFallo}{' '}
                      {item.vecesFallo === 1 ? 'fallo' : 'fallos'}
                    </span>
                    <span>{formatearFechaHora(item.ts)}</span>
                  </div>
                </div>

                {/* Enunciado */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: '#111111',
                    lineHeight: 1.45,
                  }}
                >
                  {item.enunciado}
                </p>

                {/* Bloques distintos: Tu respuesta vs La buena */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.09)',
                      border: '1px solid rgba(239, 68, 68, 0.22)',
                      borderRadius: 14,
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span className="label" style={{ color: '#991B1B' }}>
                      Tu respuesta
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: 13.5, color: '#7F1D1D', lineHeight: 1.4 }}
                    >
                      {item.tuRespuesta || 'Sin responder'}
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 14,
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span className="label" style={{ color: '#065F46' }}>
                      La buena
                    </span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: '#064E3B',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.correcta}
                    </span>
                  </div>
                </div>

                {/* Solución resuelta desplegable */}
                {solucion && (
                  <div
                    style={{
                      background: '#EDEBE6',
                      borderRadius: 16,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {solucion.asiento && (
                      <TablaAsientoResuelto asiento={solucion.asiento} />
                    )}

                    {!solucion.asiento && solucion.explicaciones.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          fontSize: 13,
                          color: '#111111',
                          lineHeight: 1.45,
                        }}
                      >
                        <span className="label">Solución explicada</span>
                        {solucion.explicaciones.map((txt, idx) => (
                          <div key={idx}>· {txt}</div>
                        ))}
                      </div>
                    )}

                    {solucion.nota && (
                      <div style={{ fontSize: 12.5, color: '#6B6B6B', lineHeight: 1.45 }}>
                        <strong style={{ color: '#111111' }}>Nota:</strong> {solucion.nota}
                      </div>
                    )}
                  </div>
                )}

                {/* Explicación opcional con IA */}
                {(textoIA || errorIA) && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: 16,
                      padding: '12px 14px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: errorIA ? '#991B1B' : '#111111',
                    }}
                  >
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>
                      Explicación con IA
                    </span>
                    {errorIA ?? textoIA}
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-sec"
                    style={{ minHeight: 38, padding: '0 14px' }}
                    onClick={() => toggleSolucion(item)}
                  >
                    {solucion ? 'Ocultar solución' : 'Ver solución resuelta'}
                  </button>

                  {!item.dominado && (
                    <button
                      type="button"
                      className="btn-sec"
                      style={{ minHeight: 38, padding: '0 14px' }}
                      onClick={() => marcarDominado(item.id)}
                    >
                      Marcar como dominado
                    </button>
                  )}

                  {tieneAI && (
                    <button
                      type="button"
                      className="btn-sec"
                      disabled={cargandoIA}
                      style={{ minHeight: 38, padding: '0 14px' }}
                      onClick={() => explicarConIA(item)}
                    >
                      {cargandoIA ? 'Explicando...' : 'Explicar con IA'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-sec"
                    style={{ minHeight: 38, padding: '0 14px', marginLeft: 'auto' }}
                    onClick={() => borrarError(item.id)}
                  >
                    Borrar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
