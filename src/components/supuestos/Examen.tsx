import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PGC } from '../../data/pgc';
import { getTema } from '../../data/temas';
import {
  crearRespuestaBalanceVacia,
  crearRespuestaPyGVacia,
  type RespuestaBalance,
  type RespuestaPyG,
} from '../../lib/correccion';
import { Engine, type ValidacionResultado } from '../../lib/engine';
import { Fmt } from '../../lib/fmt';
import type { Ejercicio, Linea } from '../../lib/types';
import { EditorAsiento, type EditorAsientoHandle } from '../EditorAsiento';
import { MiniBalanceForm, MiniPyGForm } from './PyGBalance';

export interface EntregaSupuesto {
  respuestasAsientos: Linea[][];
  respuestaPyG: RespuestaPyG;
  respuestaBalance: RespuestaBalance;
  duracionSegundos: number;
  tiempoAgotado: boolean;
}

export interface ExamenSupuestoProps {
  ejercicio: Ejercicio;
  conCrono: boolean;
  minutos: number;
  onTerminar: (entrega: EntregaSupuesto) => void;
  onSalir: () => void;
}

type PasoExamen = number | 'pyg' | 'balance';

function formatTiempo(seg: number): string {
  const limpio = Math.max(0, Math.floor(seg));
  const m = Math.floor(limpio / 60);
  const s = limpio % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExamenSupuesto({
  ejercicio,
  conCrono,
  minutos,
  onTerminar,
  onSalir,
}: ExamenSupuestoProps) {
  const totalSegundos = Math.max(60, Math.round(minutos * 60));
  const temaInfo = getTema(ejercicio.tema);
  const numOps = ejercicio.asientos.length;

  const [paso, setPaso] = useState<PasoExamen>(numOps > 0 ? 0 : 'pyg');
  const [enunciadoAbierto, setEnunciadoAbierto] = useState(true);
  const [segundosCrono, setSegundosCrono] = useState(conCrono ? totalSegundos : 0);

  const [respuestasAsientos, setRespuestasAsientos] = useState<Linea[][]>(() =>
    ejercicio.asientos.map(() => [])
  );
  const [validacionesOp, setValidacionesOp] = useState<
    Record<number, ValidacionResultado | undefined>
  >({});
  const [respuestaPyG, setRespuestaPyG] = useState<RespuestaPyG>(() =>
    crearRespuestaPyGVacia()
  );
  const [respuestaBalance, setRespuestaBalance] = useState<RespuestaBalance>(() =>
    crearRespuestaBalanceVacia()
  );

  const editorRefs = useRef<Array<EditorAsientoHandle | null>>([]);
  const entregadoRef = useRef(false);

  const datosRef = useRef({
    respuestasAsientos,
    respuestaPyG,
    respuestaBalance,
    segundosCrono,
  });

  useEffect(() => {
    datosRef.current = {
      respuestasAsientos,
      respuestaPyG,
      respuestaBalance,
      segundosCrono,
    };
  }, [respuestasAsientos, respuestaPyG, respuestaBalance, segundosCrono]);

  const entregar = useCallback(
    (tiempoAgotado: boolean) => {
      if (entregadoRef.current) return;
      entregadoRef.current = true;

      const {
        respuestasAsientos: stateAsientos,
        respuestaPyG: pyg,
        respuestaBalance: balance,
        segundosCrono: seg,
      } = datosRef.current;

      const asientosFinales = ejercicio.asientos.map((_, idx) => {
        const handle = editorRefs.current[idx];
        return handle ? handle.getLineas() : stateAsientos[idx] ?? [];
      });

      const duracionSegundos = conCrono
        ? Math.max(0, totalSegundos - seg)
        : Math.max(0, seg);

      onTerminar({
        respuestasAsientos: asientosFinales,
        respuestaPyG: pyg,
        respuestaBalance: balance,
        duracionSegundos,
        tiempoAgotado,
      });
    },
    [conCrono, ejercicio.asientos, onTerminar, totalSegundos]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setSegundosCrono((prev) => {
        if (conCrono) {
          if (prev <= 1) {
            window.clearInterval(id);
            entregar(true);
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [conCrono, entregar]);

  const pasosLista: Array<{ id: PasoExamen; etiqueta: string }> = [
    ...ejercicio.asientos.map((_, idx) => ({
      id: idx as PasoExamen,
      etiqueta: `Op ${idx + 1}`,
    })),
    { id: 'pyg', etiqueta: 'PyG' },
    { id: 'balance', etiqueta: 'Balance' },
  ];

  const indiceActual = pasosLista.findIndex((p) => p.id === paso);
  const irPaso = (delta: -1 | 1) => {
    const nextIdx = indiceActual + delta;
    if (nextIdx >= 0 && nextIdx < pasosLista.length) {
      setPaso(pasosLista[nextIdx].id);
    }
  };

  const alertaTiempo = conCrono && segundosCrono <= 120;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barra superior: Stepper de píldoras + Cronómetro blanco + Terminar examen */}
      <header
        className="card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
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
            <button
              type="button"
              className="btn-sec"
              style={{ minHeight: 36, padding: '0 12px', fontSize: 12.5 }}
              onClick={onSalir}
            >
              ← Salir
            </button>
            <span className="chip" style={{ fontSize: 11.5 }}>
              {temaInfo.nombre}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              className="chip tabular-nums"
              style={{
                background: '#FFFFFF',
                color: alertaTiempo ? '#991B1B' : '#111111',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: alertaTiempo
                  ? '1px solid rgba(239, 68, 68, 0.35)'
                  : '1px solid rgba(0, 0, 0, 0.06)',
                fontWeight: 600,
                padding: '7px 14px',
              }}
              aria-label={conCrono ? 'Tiempo restante' : 'Tiempo transcurrido'}
            >
              {conCrono ? formatTiempo(segundosCrono) : `Tiempo ${formatTiempo(segundosCrono)}`}
            </span>

            <button
              type="button"
              className="btn"
              style={{ minHeight: 38, padding: '0 16px' }}
              onClick={() => entregar(false)}
            >
              Terminar examen
            </button>
          </div>
        </div>

        {/* Stepper "Op 1 › Op 2 › ... › PyG › Balance" */}
        <nav
          aria-label="Pasos del supuesto"
          className="tema-scroll"
          style={{ paddingBottom: 2 }}
        >
          {pasosLista.map((item, idx) => {
            const activo = item.id === paso;
            return (
              <React.Fragment key={String(item.id)}>
                {idx > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      color: '#595959',
                      fontSize: 13,
                      userSelect: 'none',
                      flexShrink: 0,
                    }}
                  >
                    ›
                  </span>
                )}
                <button
                  type="button"
                  className={activo ? 'chip-dark' : 'chip'}
                  aria-current={activo ? 'step' : undefined}
                  style={{
                    cursor: 'pointer',
                    minHeight: 34,
                    padding: '5px 13px',
                    fontSize: 12.5,
                    background: activo ? '#111111' : 'rgba(255, 255, 255, 0.85)',
                    color: activo ? '#FFFFFF' : '#111111',
                  }}
                  onClick={() => setPaso(item.id)}
                >
                  {item.etiqueta}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </header>

      {/* Enunciado completo fijo y plegable + saldos iniciales */}
      <section className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            <span className="label">Enunciado del supuesto</span>
            <h2 className="card-title" style={{ marginTop: 2 }}>
              {ejercicio.titulo}
            </h2>
          </div>

          <button
            type="button"
            className="btn-sec"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
            aria-expanded={enunciadoAbierto}
            onClick={() => setEnunciadoAbierto((v) => !v)}
          >
            {enunciadoAbierto ? 'Ocultar enunciado ▲' : 'Ver enunciado ▼'}
          </button>
        </div>

        {enunciadoAbierto && (
          <>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.58, color: '#111111' }}>
              {ejercicio.enunciado}
            </p>

            {ejercicio.inicial && ejercicio.inicial.length > 0 && (
              <div
                style={{
                  background: '#EDEBE6',
                  borderRadius: 14,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <span className="label">Saldos iniciales</span>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B6B6B', fontSize: 11 }}>
                        <th style={{ textAlign: 'left', padding: '5px 6px' }}>Cuenta</th>
                        <th style={{ textAlign: 'right', padding: '5px 6px' }}>Debe</th>
                        <th style={{ textAlign: 'right', padding: '5px 6px' }}>Haber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ejercicio.inicial.map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '5px 6px' }}>
                            <strong className="tabular-nums">{s.c}</strong>{' '}
                            <span style={{ color: '#6B6B6B' }}>{PGC.nombre(s.c)}</span>
                          </td>
                          <td className="tabular-nums" style={{ textAlign: 'right', padding: '5px 6px' }}>
                            {s.d > 0 ? Fmt.eur(s.d) : '—'}
                          </td>
                          <td className="tabular-nums" style={{ textAlign: 'right', padding: '5px 6px' }}>
                            {s.h > 0 ? Fmt.eur(s.h) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Operaciones (se mantienen montadas para conservar todas las líneas al navegar entre pasos) */}
      {ejercicio.asientos.map((asiento, idx) => {
        const visible = paso === idx;
        const val = validacionesOp[idx];

        return (
          <section
            key={idx}
            className="card"
            style={{
              display: visible ? 'flex' : 'none',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div className="card-head" style={{ marginBottom: 0 }}>
              <div>
                <span className="label">Libro Diario</span>
                <h3 className="card-title" style={{ marginTop: 2 }}>
                  Operación {idx + 1} · {asiento.fecha}
                </h3>
              </div>
              <span className="chip tabular-nums">
                {idx + 1} / {numOps}
              </span>
            </div>

            <EditorAsiento
              ref={(el) => {
                editorRefs.current[idx] = el;
              }}
              lineas={Math.max(2, asiento.lineas.length)}
              onCambio={(lineas) => {
                setRespuestasAsientos((prev) => {
                  const next = [...prev];
                  next[idx] = lineas;
                  return next;
                });
                setValidacionesOp((prev) => ({ ...prev, [idx]: undefined }));
              }}
              onComprobar={(lineas) => {
                const res = Engine.validar(lineas);
                setValidacionesOp((prev) => ({ ...prev, [idx]: res }));
              }}
            />

            {val && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  borderRadius: 14,
                  padding: '10px 14px',
                  fontSize: 13,
                  background: val.ok
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(245, 158, 11, 0.14)',
                  color: val.ok ? '#065F46' : '#92400E',
                }}
              >
                {val.ok ? (
                  <span>✓ Formato válido: cuentas del PGC correctas y asiento cuadrado.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <strong>Revisa antes de entregar:</strong>
                    {val.errores.map((err, eIdx) => (
                      <span key={eIdx}>· {err}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn-sec"
                disabled={indiceActual <= 0}
                onClick={() => irPaso(-1)}
              >
                ← Anterior
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => irPaso(1)}
              >
                {idx + 1 < numOps ? `Siguiente (Op ${idx + 2}) →` : 'Ir a PyG →'}
              </button>
            </div>
          </section>
        );
      })}

      {/* Paso PyG */}
      {paso === 'pyg' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <span className="label">Cuentas anuales · 1,5 puntos</span>
              <h3 className="card-title" style={{ marginTop: 2 }}>
                Cuenta de Pérdidas y Ganancias (PYMES)
              </h3>
            </div>
            <span className="chip-dark">PyG</span>
          </div>

          <MiniPyGForm valor={respuestaPyG} onChange={setRespuestaPyG} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button type="button" className="btn-sec" onClick={() => irPaso(-1)}>
              ← Anterior
            </button>
            <button type="button" className="btn" onClick={() => irPaso(1)}>
              Ir a Balance →
            </button>
          </div>
        </section>
      )}

      {/* Paso Balance */}
      {paso === 'balance' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <span className="label">Cuentas anuales · 1,5 puntos</span>
              <h3 className="card-title" style={{ marginTop: 2 }}>
                Balance de situación
              </h3>
            </div>
            <span className="chip-dark">Balance</span>
          </div>

          <MiniBalanceForm valor={respuestaBalance} onChange={setRespuestaBalance} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button type="button" className="btn-sec" onClick={() => irPaso(-1)}>
              ← PyG
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => entregar(false)}
            >
              Terminar examen →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
