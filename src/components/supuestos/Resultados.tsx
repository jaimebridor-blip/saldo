import React, { useState } from 'react';
import { PGC } from '../../data/pgc';
import { getTema } from '../../data/temas';
import { AI } from '../../lib/ai';
import {
  formatearLineasCorto,
  type ItemAsientoResultado,
  type ResultadoSupuesto,
} from '../../lib/correccion';
import { Fmt } from '../../lib/fmt';
import { go } from '../../lib/router';
import type { Ejercicio } from '../../lib/types';
import { Mascot } from '../Mascot';
import { TablaPyGResuelta } from './PyGBalance';

export interface ResultadosSupuestoProps {
  ejercicio: Ejercicio;
  resultado: ResultadoSupuesto;
  duracionSegundos: number;
  tiempoAgotado: boolean;
  onRepetirOtro: () => void;
  onVolverConfig: () => void;
}

function formatDuracion(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  const min = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(min).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function ResultadosSupuesto({
  ejercicio,
  resultado,
  duracionSegundos,
  tiempoAgotado,
  onRepetirOtro,
  onVolverConfig,
}: ResultadosSupuestoProps) {
  const temaInfo = getTema(ejercicio.tema);
  const tieneClaveIA = AI.tieneClave();

  const [explicacionesIA, setExplicacionesIA] = useState<
    Record<number, { cargando: boolean; texto?: string; error?: string }>
  >({});

  const pedirExplicacionIA = async (item: ItemAsientoResultado) => {
    const idx = item.indice;
    setExplicacionesIA((prev) => ({
      ...prev,
      [idx]: { cargando: true },
    }));

    const respTxt = formatearLineasCorto(item.respuestaAlumno);
    const solTxt = formatearLineasCorto(item.asientoSolucion.lineas);

    const prompt = [
      'Eres profesor de Contabilidad Financiera (PGC español).',
      `Enunciado del supuesto: ${ejercicio.enunciado}`,
      `Operación a explicar: Operación ${idx + 1} (${item.asientoSolucion.fecha} - ${item.asientoSolucion.concepto}).`,
      `Respuesta del alumno: ${respTxt}`,
      `Solución correcta: ${solTxt}`,
      'Explica en español, en menos de 120 palabras, por qué está mal la respuesta del alumno y cómo se razona este asiento paso a paso.',
    ].join('\n');

    try {
      const texto = await AI.llamar(prompt);
      setExplicacionesIA((prev) => ({
        ...prev,
        [idx]: { cargando: false, texto: texto.trim() },
      }));
    } catch (err) {
      setExplicacionesIA((prev) => ({
        ...prev,
        [idx]: {
          cargando: false,
          error:
            err instanceof Error
              ? err.message
              : 'No se pudo obtener la explicación de la IA.',
        },
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {tiempoAgotado && (
        <div
          role="status"
          aria-live="polite"
          className="card"
          style={{
            padding: '12px 16px',
            background: 'rgba(245, 158, 11, 0.14)',
            color: '#92400E',
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          Tiempo agotado: el examen se ha cerrado y corregido automáticamente con lo que habías completado.
        </div>
      )}

      {/* Tarjeta principal de nota */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="label">Resultado del supuesto · {temaInfo.nombre}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="big-num" style={{ fontSize: 'clamp(40px, 10vw, 64px)' }}>
                {Fmt.num(resultado.nota)}
              </span>
              <span style={{ fontSize: 22, fontWeight: 300, color: '#6B6B6B' }} className="tabular-nums">
                / 5
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                className="chip tabular-nums"
                style={{
                  background: resultado.aprobado
                    ? 'rgba(16, 185, 129, 0.14)'
                    : 'rgba(239, 68, 68, 0.12)',
                  color: resultado.aprobado ? '#065F46' : '#991B1B',
                  fontWeight: 600,
                }}
              >
                {resultado.aprobado ? '✓ Aprobado' : '✗ No superado'}
              </span>
              <span className="chip tabular-nums">
                Equivalente: {Fmt.num(resultado.notaSobre10)} / 10
              </span>
              <span className="chip tabular-nums">
                Duración: {formatDuracion(duracionSegundos)}
              </span>
              <span className="chip-dark tabular-nums">+{resultado.xpGanado} XP</span>
            </div>

            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#6B6B6B' }}>
              Aprobado a partir de 2,5 sobre 5 (5 sobre 10). Los ítems fallados se han guardado en Error Vault.
            </p>
          </div>

          <Mascot
            color={temaInfo.color}
            estado={resultado.aprobado ? 'feliz' : 'triste'}
            size={72}
          />
        </div>

        {/* Desglose por bloques */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.68)', borderRadius: 16, padding: 14 }}>
            <div className="label">Asientos (2 pts)</div>
            <div className="big-num" style={{ fontSize: 'clamp(26px, 7vw, 38px)', marginTop: 4 }}>
              {Fmt.num(resultado.asientosNota)}
            </div>
            <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 4 }} className="tabular-nums">
              Bruto {Fmt.num(resultado.asientosBruto)} · Pen. -{Fmt.num(resultado.asientosPenalizacion)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.68)', borderRadius: 16, padding: 14 }}>
            <div className="label">PyG (1,5 pts)</div>
            <div className="big-num" style={{ fontSize: 'clamp(26px, 7vw, 38px)', marginTop: 4 }}>
              {Fmt.num(resultado.pygNota)}
            </div>
            <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 4 }} className="tabular-nums">
              {resultado.itemsPyG.filter((i) => i.evaluada && i.ok).length} /{' '}
              {resultado.itemsPyG.filter((i) => i.evaluada).length || 0} líneas clave
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.68)', borderRadius: 16, padding: 14 }}>
            <div className="label">Balance (1,5 pts)</div>
            <div className="big-num" style={{ fontSize: 'clamp(26px, 7vw, 38px)', marginTop: 4 }}>
              {Fmt.num(resultado.balanceNota)}
            </div>
            <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 4 }} className="tabular-nums">
              {resultado.itemsBalance.filter((i) => i.ok).length} / 7 campos
            </div>
          </div>
        </div>
      </section>

      {/* Tarjeta Penalizaciones */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="card-title">Penalizaciones</h3>
            <p className="card-subtitle">
              −0,20 puntos por asiento descuadrado o cuenta que no pertenece a la solución.
            </p>
          </div>
          <span
            className="chip tabular-nums"
            style={{
              background:
                resultado.penalizaciones.length > 0
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(16, 185, 129, 0.12)',
              color: resultado.penalizaciones.length > 0 ? '#991B1B' : '#065F46',
              fontWeight: 600,
            }}
          >
            {resultado.penalizaciones.length > 0
              ? `-${Fmt.num(resultado.asientosPenalizacion)} pts`
              : '✓ Sin penalizaciones'}
          </span>
        </div>

        {resultado.penalizaciones.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: '#6B6B6B' }}>
            Ningún asiento quedó descuadrado ni usaste cuentas ajenas a la solución.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resultado.penalizaciones.map((pen, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.09)',
                  color: '#991B1B',
                  fontSize: 13,
                }}
              >
                <span>✗ {pen.motivo}</span>
                <span className="tabular-nums" style={{ fontWeight: 600, flexShrink: 0 }}>
                  -{Fmt.num(pen.importe)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Corrección línea a línea de cada asiento */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="card-title">Asientos del Libro Diario</h3>
            <p className="card-subtitle">Corrección línea a línea frente al asiento de referencia.</p>
          </div>
          <span className="chip-dark tabular-nums">
            {resultado.itemsAsientos.filter((i) => i.correccion.ok).length} /{' '}
            {resultado.itemsAsientos.length} perfectos
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resultado.itemsAsientos.map((item) => {
            const ok = item.correccion.ok;
            const iaState = explicacionesIA[item.indice];

            return (
              <article
                key={item.indice}
                style={{
                  background: 'rgba(255, 255, 255, 0.72)',
                  borderRadius: 16,
                  padding: 14,
                  border: `1px solid ${
                    ok ? 'rgba(16, 185, 129, 0.28)' : 'rgba(0, 0, 0, 0.06)'
                  }`,
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
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>
                      Operación {item.indice + 1} · {item.asientoSolucion.fecha} ·{' '}
                      {item.asientoSolucion.concepto}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      className="chip tabular-nums"
                      style={{
                        background: ok
                          ? 'rgba(16, 185, 129, 0.14)'
                          : 'rgba(239, 68, 68, 0.12)',
                        color: ok ? '#065F46' : '#991B1B',
                        fontWeight: 600,
                      }}
                    >
                      {ok ? '✓ Correcto' : '✗ Con fallos'} ({Fmt.num(item.puntosBrutos)} /{' '}
                      {Fmt.num(item.puntosMax)})
                    </span>

                    {!ok && tieneClaveIA && (
                      <button
                        type="button"
                        className="btn-sec"
                        disabled={Boolean(iaState?.cargando)}
                        style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
                        onClick={() => pedirExplicacionIA(item)}
                      >
                        {iaState?.cargando ? 'Pensando...' : 'Explicar con IA'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Corrección línea a línea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {item.correccion.lineas.map((l, lIdx) => {
                    const colorEstado =
                      l.estado === 'ok'
                        ? '#065F46'
                        : l.estado === 'importe'
                          ? '#92400E'
                          : '#991B1B';
                    const bgEstado =
                      l.estado === 'ok'
                        ? 'rgba(16, 185, 129, 0.08)'
                        : l.estado === 'importe'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(239, 68, 68, 0.08)';
                    const codigo = l.esperada?.c || l.dada?.c || '—';
                    const prefijo = l.estado === 'ok' ? '✓' : '✗';
                    return (
                      <div
                        key={lIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          fontSize: 12.5,
                          padding: '7px 10px',
                          borderRadius: 10,
                          background: bgEstado,
                          color: colorEstado,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          {prefijo} <strong className="tabular-nums">{codigo}</strong>{' '}
                          {PGC.nombre(codigo)}
                        </span>
                        <span style={{ fontWeight: 500, textAlign: 'right' }}>
                          {l.mensaje}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Solución de referencia del asiento */}
                {!ok && (
                  <div
                    style={{
                      background: '#EDEBE6',
                      borderRadius: 12,
                      padding: '10px 12px',
                      fontSize: 12.5,
                    }}
                  >
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>
                      Solución esperada
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {item.asientoSolucion.lineas.map((l, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <span>
                            <strong className="tabular-nums">{l.c}</strong> {PGC.nombre(l.c)}
                          </span>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>
                            {l.d > 0 ? `Debe ${Fmt.eur(l.d)}` : `Haber ${Fmt.eur(l.h)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarjeta con explicación de IA opcional */}
                {iaState && (iaState.texto || iaState.error) && (
                  <div
                    className="card"
                    style={{
                      padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: 'none',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: iaState.error ? '#991B1B' : '#111111',
                    }}
                  >
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>
                      Explicación con IA
                    </span>
                    {iaState.error ?? iaState.texto}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Corrección de PyG y Balance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 16,
        }}
      >
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h3 className="card-title">Ítems PyG</h3>
              <p className="card-subtitle">Comparación por línea significativa.</p>
            </div>
            <span className="chip-dark tabular-nums">{Fmt.num(resultado.pygNota)} / 1,5</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resultado.itemsPyG.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#6B6B6B' }}>
                ✓ Sin líneas de PyG con saldo distinto de cero en este supuesto.
              </p>
            ) : (
              resultado.itemsPyG.map((item) => (
                <div
                  key={item.numLinea}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: item.ok
                      ? 'rgba(16, 185, 129, 0.09)'
                      : 'rgba(239, 68, 68, 0.09)',
                    color: item.ok ? '#065F46' : '#991B1B',
                    fontSize: 12.5,
                  }}
                >
                  <span>
                    {item.ok ? '✓' : '✗'} {item.etiqueta}
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 600, textAlign: 'right' }}>
                    {item.ok
                      ? Fmt.eur(item.esperado)
                      : `${Fmt.eur(item.dado)} → ${Fmt.eur(item.esperado)}`}
                  </span>
                </div>
              ))
            )}
          </div>

          <TablaPyGResuelta pyg={resultado.solucionPyG} soloNoCero />
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h3 className="card-title">Ítems Balance</h3>
              <p className="card-subtitle">7 campos evaluados contra la solución.</p>
            </div>
            <span className="chip-dark tabular-nums">
              {Fmt.num(resultado.balanceNota)} / 1,5
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resultado.itemsBalance.map((item) => (
              <div
                key={item.clave}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 12,
                  background: item.ok
                    ? 'rgba(16, 185, 129, 0.09)'
                    : 'rgba(239, 68, 68, 0.09)',
                  color: item.ok ? '#065F46' : '#991B1B',
                  fontSize: 12.5,
                }}
              >
                <span>
                  {item.ok ? '✓' : '✗'} {item.etiqueta}
                </span>
                <span className="tabular-nums" style={{ fontWeight: 600, textAlign: 'right' }}>
                  {item.ok
                    ? Fmt.eur(item.esperado)
                    : `${Fmt.eur(item.dado)} → ${Fmt.eur(item.esperado)}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Acciones finales */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={onRepetirOtro}>
          Otro supuesto →
        </button>
        <button type="button" className="btn-sec" onClick={() => go('/vault')}>
          Ir al Error Vault
        </button>
        <button type="button" className="btn-sec" onClick={onVolverConfig}>
          Configurar nuevo
        </button>
      </div>
    </div>
  );
}
