import React, { useRef, useState } from 'react';
import { PGC, type CuentaPGC } from '../../data/pgc';
import type { TemaId } from '../../data/temas';
import { Engine } from '../../lib/engine';
import { Fmt } from '../../lib/fmt';
import { barajarArray, Games } from '../../lib/games';
import { Store } from '../../lib/store';
import type { Asiento, Ejercicio } from '../../lib/types';
import type { MascotEstado } from '../Mascot';
import {
  EstudioView,
  FeedbackPanel,
  GameHeader,
  GameSummary,
  type ItemComparacion,
} from './common';
import type { JuegoProps } from './GameDebeHaber';

interface HuecoRellena {
  lineaIdx: number;
  tipo: 'cuenta' | 'importe';
  esperadaCuenta: string;
  esperadoImporte: number;
  lado: 'D' | 'H';
  opcionesCuenta: CuentaPGC[];
}

interface RondaRellena {
  ej: Ejercicio;
  indiceAsiento: number;
  asiento: Asiento;
  huecos: HuecoRellena[];
}

function construirOpcionesCuenta(cuentaCorrecta: string): CuentaPGC[] {
  const correcta = PGC.get(cuentaCorrecta);
  const grupo = correcta?.grupo;
  const mismoGrupo = barajarArray(
    PGC.filter((c) => c.n !== cuentaCorrecta && c.grupo === grupo)
  );
  const otras = barajarArray(
    PGC.filter((c) => c.n !== cuentaCorrecta && c.grupo !== grupo)
  );
  const distractores = [...mismoGrupo, ...otras].slice(0, 3);
  return barajarArray(correcta ? [correcta, ...distractores] : distractores);
}

function construirRondaRellena(
  tema: TemaId,
  paso: number,
  plantillaFija?: string,
  usadosBanco: string[] = []
): RondaRellena {
  for (let i = 0; i < 8; i++) {
    const ej = Games.obtenerEjercicio({
      tema,
      paso: paso + i,
      requiereAsientos: true,
      plantillaFija,
      usadosBanco,
    });
    if (ej.asientos.length === 0) continue;

    const indices = barajarArray(ej.asientos.map((_, idx) => idx));
    const idxAsiento =
      indices.find((idx) => ej.asientos[idx].lineas.length >= 2) ?? indices[0];
    const asiento = ej.asientos[idxAsiento];
    if (!asiento || asiento.lineas.length === 0) continue;

    const numHuecos = Math.min(
      asiento.lineas.length,
      asiento.lineas.length >= 3 ? (Math.random() < 0.5 ? 3 : 2) : 2
    );

    const ordenLineas = barajarArray(asiento.lineas.map((_, idx) => idx)).slice(
      0,
      numHuecos
    );

    const huecos: HuecoRellena[] = ordenLineas.map((lineaIdx, pos) => {
      const l = asiento.lineas[lineaIdx];
      const lado: 'D' | 'H' = l.d > 0 ? 'D' : 'H';
      const esperadoImporte = l.d > 0 ? l.d : l.h;
      const tipo: 'cuenta' | 'importe' =
        pos === 0 ? 'cuenta' : pos === 1 ? 'importe' : Math.random() < 0.5 ? 'cuenta' : 'importe';

      return {
        lineaIdx,
        tipo,
        esperadaCuenta: l.c,
        esperadoImporte,
        lado,
        opcionesCuenta:
          tipo === 'cuenta' ? construirOpcionesCuenta(l.c) : [],
      };
    });

    return { ej, indiceAsiento: idxAsiento, asiento, huecos };
  }

  const ej = Games.obtenerEjercicio({ tema: 'compras', paso, requiereAsientos: true });
  const asiento = ej.asientos[0];
  return {
    ej,
    indiceAsiento: 0,
    asiento,
    huecos: [
      {
        lineaIdx: 0,
        tipo: 'cuenta',
        esperadaCuenta: asiento.lineas[0].c,
        esperadoImporte: asiento.lineas[0].d || asiento.lineas[0].h,
        lado: asiento.lineas[0].d > 0 ? 'D' : 'H',
        opcionesCuenta: construirOpcionesCuenta(asiento.lineas[0].c),
      },
    ],
  };
}

function extraerCodigo(texto: string): string {
  const m = texto.trim().match(/^(\d{2,5})\b/);
  return m ? m[1] : texto.trim();
}

export function GameRellena({
  tema,
  modo,
  n,
  rapido = false,
  onRondaRapida,
  onTerminar,
  onCambiarTema,
}: JuegoProps) {
  const total = rapido ? 1 : n;
  const [paso, setPaso] = useState(0);
  const [ronda, setRonda] = useState<RondaRellena>(() =>
    construirRondaRellena(tema, 0)
  );
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [valores, setValores] = useState<Record<number, string>>({});
  const [busquedaAbierta, setBusquedaAbierta] = useState<number | null>(null);
  const [resultado, setResultado] = useState<{
    ok: boolean;
    puntos: number;
    comparaciones: ItemComparacion[];
  } | null>(null);

  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const usadosBancoRef = useRef<string[]>([]);

  React.useEffect(() => {
    if (rapido || finalizado) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [rapido, finalizado]);

  const comprobar = () => {
    if (resultado) return;

    const comparaciones: ItemComparacion[] = [];
    let okCount = 0;

    for (const h of ronda.huecos) {
      const raw = (valores[h.lineaIdx] ?? '').trim();
      if (h.tipo === 'cuenta') {
        const codigo = extraerCodigo(raw);
        const ok = codigo === h.esperadaCuenta;
        if (ok) okCount += 1;
        comparaciones.push({
          etiqueta: `Línea ${h.lineaIdx + 1} · Cuenta`,
          dada: codigo || '—',
          correcta: `${h.esperadaCuenta} ${PGC.nombre(h.esperadaCuenta)}`,
          ok,
        });
      } else {
        const num = Fmt.parse(raw);
        const ok =
          Number.isFinite(num) && Math.abs(num - h.esperadoImporte) <= 0.01;
        if (ok) okCount += 1;
        comparaciones.push({
          etiqueta: `Línea ${h.lineaIdx + 1} · Importe (${h.lado === 'D' ? 'Debe' : 'Haber'})`,
          dada: Number.isFinite(num) ? Fmt.eur(num) : raw || '—',
          correcta: Fmt.eur(h.esperadoImporte),
          ok,
        });
      }
    }

    const puntos = okCount / Math.max(1, ronda.huecos.length);
    const okTotal = puntos >= 0.99;
    if (okTotal) {
      setAciertos((a) => a + 1);
    }

    const xpPregunta =
      modo === 'estudio' && enAhoraTu
        ? okTotal
          ? 5
          : 0
        : Games.calcularXPReto(puntos);
    setXpAcumulado((prev) => prev + xpPregunta);

    Games.registrarPregunta({
      tema: ronda.ej.tema,
      puntos,
      juego: 'Rellena el asiento',
      enunciado: `${ronda.asiento.concepto}. ${ronda.ej.enunciado}`,
      tuRespuesta: comparaciones.map((c) => `${c.etiqueta}: ${c.dada}`).join(' | '),
      correcta: comparaciones.map((c) => `${c.etiqueta}: ${c.correcta}`).join(' | '),
      ejercicioId: `${ronda.ej.id}_rellena_${ronda.indiceAsiento}`,
    });

    setResultado({ ok: okTotal, puntos, comparaciones });
  };

  const avanzar = () => {
    if (rapido && onRondaRapida && resultado) {
      onRondaRapida({
        puntos: resultado.puntos,
        xp: xpAcumulado,
        acertada: resultado.ok,
      });
      return;
    }

    const siguientePaso = paso + 1;
    if (siguientePaso >= total) {
      const bonus =
        modo === 'reto' ? Games.calcularBonusPerfecto(aciertos, total) : 0;
      const xpFinal = xpAcumulado + bonus;
      setBonusPerfecto(bonus);
      setXpAcumulado(xpFinal);
      Store.addXP(xpFinal);
      setFinalizado(true);
      return;
    }

    if (ronda.ej.fuente === 'banco') {
      usadosBancoRef.current.push(ronda.ej.id);
    }

    setPaso(siguientePaso);
    setRonda(construirRondaRellena(tema, siguientePaso, undefined, usadosBancoRef.current));
    setValores({});
    setResultado(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  };

  const iniciarAhoraTu = () => {
    const plantillaId = Games.extraerPlantillaId(ronda.ej);
    setXpAcumulado((prev) => prev + 2);
    setRonda(
      construirRondaRellena(
        ronda.ej.tema,
        paso + 101,
        plantillaId,
        usadosBancoRef.current
      )
    );
    setValores({});
    setResultado(null);
    setEnEstudioVisto(false);
    setEnAhoraTu(true);
  };

  const saltarEstudio = () => {
    setXpAcumulado((prev) => prev + 2);
    avanzar();
  };

  const reiniciar = () => {
    usadosBancoRef.current = [];
    setPaso(0);
    setRonda(construirRondaRellena(tema, 0));
    setValores({});
    setResultado(null);
    setEnEstudioVisto(modo === 'estudio');
    setEnAhoraTu(false);
    setAciertos(0);
    setXpAcumulado(0);
    setBonusPerfecto(0);
    setSegundos(0);
    setFinalizado(false);
  };

  if (finalizado) {
    return (
      <GameSummary
        titulo="Rellena el asiento"
        tema={tema}
        aciertos={aciertos}
        total={total}
        xp={xpAcumulado}
        bonusPerfecto={bonusPerfecto}
        segundos={segundos}
        onRepetir={reiniciar}
        onOtraTematica={onCambiarTema}
        onVolver={onTerminar}
      />
    );
  }

  const mascotEstado: MascotEstado = resultado
    ? resultado.ok
      ? 'feliz'
      : 'triste'
    : 'pensando';

  const content = enEstudioVisto ? (
    <EstudioView
      ejercicio={ronda.ej}
      indiceAsiento={ronda.indiceAsiento}
      onAhoraTu={iniciarAhoraTu}
      onSaltar={saltarEstudio}
    />
  ) : (
    <>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="label">Completa los huecos</span>
            <h2 className="card-title" style={{ marginTop: 4 }}>
              {ronda.asiento.concepto}
            </h2>
          </div>
          <span className="chip tabular-nums">{ronda.asiento.fecha}</span>
        </div>

        <p style={{ margin: 0, fontSize: 13.5, color: '#6B6B6B', lineHeight: 1.5 }}>
          {ronda.ej.enunciado}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ronda.asiento.lineas.map((l, idx) => {
            const hueco = ronda.huecos.find((h) => h.lineaIdx === idx);
            const valor = valores[idx] ?? '';
            const sugerencias =
              hueco?.tipo === 'cuenta' && busquedaAbierta === idx
                ? PGC.buscar(extraerCodigo(valor) || valor, 6)
                : [];

            return (
              <div
                key={idx}
                style={{
                  background: hueco
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.52)',
                  borderRadius: 16,
                  padding: 12,
                  border: hueco
                    ? '1px solid rgba(17,17,17,0.16)'
                    : '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  {hueco?.tipo === 'cuenta' ? (
                    <div style={{ flex: '1 1 220px', position: 'relative' }}>
                      <input
                        type="text"
                        className="field"
                        disabled={Boolean(resultado)}
                        placeholder="Busca código o nombre del PGC..."
                        aria-label={`Cuenta línea ${idx + 1}`}
                        value={valor}
                        onFocus={(e) => {
                          e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                          setBusquedaAbierta(idx);
                        }}
                        onBlur={() =>
                          setTimeout(
                            () => setBusquedaAbierta((curr) => (curr === idx ? null : curr)),
                            150
                          )
                        }
                        onChange={(e) => {
                          setValores((prev) => ({ ...prev, [idx]: e.target.value }));
                          setBusquedaAbierta(idx);
                        }}
                      />
                      {sugerencias.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            zIndex: 30,
                            background: '#FFFFFF',
                            borderRadius: 14,
                            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            padding: 4,
                            maxHeight: 200,
                            overflowY: 'auto',
                          }}
                        >
                          {sugerencias.map((s) => (
                            <button
                              key={s.n}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setValores((prev) => ({
                                  ...prev,
                                  [idx]: `${s.n} · ${s.nombre}`,
                                }));
                                setBusquedaAbierta(null);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                border: 'none',
                                background: 'transparent',
                                padding: '8px 10px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 13,
                                display: 'flex',
                                gap: 8,
                              }}
                            >
                              <strong className="tabular-nums">{s.n}</strong>
                              <span>{s.nombre}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                      <strong className="tabular-nums">{l.c}</strong>{' '}
                      <span style={{ color: '#6B6B6B' }}>{PGC.nombre(l.c)}</span>
                    </div>
                  )}

                  {hueco?.tipo === 'importe' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="chip" style={{ fontSize: 11 }}>
                        {hueco.lado === 'D' ? 'Debe' : 'Haber'}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="field tabular-nums"
                        style={{ width: 140, textAlign: 'right' }}
                        disabled={Boolean(resultado)}
                        placeholder="0,00"
                        aria-label={`Importe línea ${idx + 1}`}
                        value={valor}
                        onFocus={(e) =>
                          e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
                        }
                        onChange={(e) =>
                          setValores((prev) => ({ ...prev, [idx]: e.target.value }))
                        }
                      />
                    </div>
                  ) : (
                    <div className="tabular-nums" style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {l.d > 0 ? `Debe ${Fmt.eur(l.d)}` : `Haber ${Fmt.eur(l.h)}`}
                    </div>
                  )}
                </div>

                {hueco?.tipo === 'cuenta' && hueco.opcionesCuenta.length > 0 && !resultado && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {hueco.opcionesCuenta.map((op) => {
                      const elegido = extraerCodigo(valor) === op.n;
                      return (
                        <button
                          key={op.n}
                          type="button"
                          className={elegido ? 'chip-dark' : 'chip'}
                          style={{ cursor: 'pointer', minHeight: 40 }}
                          onClick={() =>
                            setValores((prev) => ({
                              ...prev,
                              [idx]: `${op.n} · ${op.nombre}`,
                            }))
                          }
                        >
                          <span className="tabular-nums">{op.n}</span> · {op.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!resultado && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={comprobar}>
              Comprobar
            </button>
          </div>
        )}
      </section>

      {resultado && (
        <FeedbackPanel
          ok={resultado.ok}
          puntos={resultado.puntos}
          comparaciones={resultado.comparaciones}
          explicaciones={Engine.explicarLineas(ronda.asiento)}
          nota={ronda.ej.nota}
          esUltimo={!rapido && paso + 1 >= total}
          onSiguiente={avanzar}
        />
      )}
    </>
  );

  if (rapido) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{content}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GameHeader
        titulo="Rellena el asiento"
        tema={tema}
        modo={modo}
        actual={paso + 1}
        total={total}
        segundos={segundos}
        mascotEstado={mascotEstado}
        enAhoraTu={enAhoraTu}
        onSalir={onTerminar}
      />
      {content}
    </div>
  );
}
