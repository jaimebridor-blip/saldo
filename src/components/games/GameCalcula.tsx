import React, { useRef, useState } from 'react';
import type { TemaId } from '../../data/temas';
import { Fmt } from '../../lib/fmt';
import { Games } from '../../lib/games';
import { Store } from '../../lib/store';
import type { Ejercicio } from '../../lib/types';
import type { MascotEstado } from '../Mascot';
import {
  EstudioView,
  FeedbackPanel,
  GameHeader,
  GameSummary,
  type ItemComparacion,
} from './common';
import type { JuegoProps } from './GameDebeHaber';

function cargarEjercicioCalcula(
  tema: TemaId,
  paso: number,
  plantillaFija?: string,
  usadosBanco: string[] = []
): Ejercicio {
  for (let i = 0; i < 8; i++) {
    const ej = Games.obtenerEjercicio({
      tema,
      paso: paso + i,
      requiereCalculos: true,
      plantillaFija,
      usadosBanco,
    });
    const tieneNumericos = ej.calc.some((c) => typeof c.valor === 'number');
    if (ej.calc.length > 0 && tieneNumericos) {
      return ej;
    }
  }
  return Games.obtenerEjercicio({ tema: 'conceptos', paso, requiereCalculos: true });
}

interface PasoResuelto {
  etiqueta: string;
  dada: string;
  correcta: string;
  ok: boolean;
}

export function GameCalcula({
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
  const [ej, setEj] = useState<Ejercicio>(() => cargarEjercicioCalcula(tema, 0));
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [stepIdx, setStepIdx] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [mostrarPista, setMostrarPista] = useState(false);
  const [pasoFeedback, setPasoFeedback] = useState<PasoResuelto | null>(null);
  const [resueltos, setResueltos] = useState<PasoResuelto[]>([]);
  const [rondaTerminada, setRondaTerminada] = useState(false);

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

  const calcItems = ej.calc.filter((c) => typeof c.valor === 'number');
  const pasoActual = calcItems[stepIdx];

  const comprobarPaso = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pasoActual || pasoFeedback || rondaTerminada) return;

    const esperado = Number(pasoActual.valor);
    const num = Fmt.parse(inputVal);
    const ok = Number.isFinite(num) && Math.abs(num - esperado) <= 0.01;

    const item: PasoResuelto = {
      etiqueta: pasoActual.etiqueta,
      dada: Number.isFinite(num) ? Fmt.eur(num) : inputVal.trim() || '—',
      correcta: Fmt.eur(esperado),
      ok,
    };
    setPasoFeedback(item);
  };

  const siguientePasoCalculo = () => {
    if (!pasoFeedback) return;
    const nuevos = [...resueltos, pasoFeedback];
    setResueltos(nuevos);
    setPasoFeedback(null);
    setInputVal('');

    if (stepIdx + 1 < calcItems.length) {
      setStepIdx((i) => i + 1);
      return;
    }

    // Ronda completada
    const okCount = nuevos.filter((x) => x.ok).length;
    const puntos = okCount / Math.max(1, nuevos.length);
    const okRonda = puntos >= 0.99;

    if (okRonda) {
      setAciertos((a) => a + 1);
    }

    const xpPregunta =
      modo === 'estudio' && enAhoraTu
        ? okRonda
          ? 5
          : 0
        : Games.calcularXPReto(puntos);
    setXpAcumulado((prev) => prev + xpPregunta);

    Games.registrarPregunta({
      tema: ej.tema,
      puntos,
      juego: 'Calcula',
      enunciado: ej.enunciado,
      tuRespuesta: nuevos.map((x) => `${x.etiqueta}: ${x.dada}`).join(' | '),
      correcta: nuevos.map((x) => `${x.etiqueta}: ${x.correcta}`).join(' | '),
      ejercicioId: `${ej.id}_calc`,
    });

    setRondaTerminada(true);
  };

  const avanzarEjercicio = () => {
    const okCount = resueltos.filter((x) => x.ok).length;
    const puntos = okCount / Math.max(1, resueltos.length);
    const okRonda = puntos >= 0.99;

    if (rapido && onRondaRapida) {
      onRondaRapida({
        puntos,
        xp: xpAcumulado,
        acertada: okRonda,
      });
      return;
    }

    const siguiente = paso + 1;
    if (siguiente >= total) {
      const bonus =
        modo === 'reto' ? Games.calcularBonusPerfecto(aciertos, total) : 0;
      const xpFinal = xpAcumulado + bonus;
      setBonusPerfecto(bonus);
      setXpAcumulado(xpFinal);
      Store.addXP(xpFinal);
      setFinalizado(true);
      return;
    }

    if (ej.fuente === 'banco') {
      usadosBancoRef.current.push(ej.id);
    }

    setPaso(siguiente);
    setEj(cargarEjercicioCalcula(tema, siguiente, undefined, usadosBancoRef.current));
    setStepIdx(0);
    setInputVal('');
    setMostrarPista(false);
    setPasoFeedback(null);
    setResueltos([]);
    setRondaTerminada(false);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  };

  const iniciarAhoraTu = () => {
    const plantillaId = Games.extraerPlantillaId(ej);
    setXpAcumulado((prev) => prev + 2);
    setEj(cargarEjercicioCalcula(ej.tema, paso + 101, plantillaId, usadosBancoRef.current));
    setStepIdx(0);
    setInputVal('');
    setMostrarPista(false);
    setPasoFeedback(null);
    setResueltos([]);
    setRondaTerminada(false);
    setEnEstudioVisto(false);
    setEnAhoraTu(true);
  };

  const saltarEstudio = () => {
    setXpAcumulado((prev) => prev + 2);
    avanzarEjercicio();
  };

  const reiniciar = () => {
    usadosBancoRef.current = [];
    setPaso(0);
    setEj(cargarEjercicioCalcula(tema, 0));
    setStepIdx(0);
    setInputVal('');
    setMostrarPista(false);
    setPasoFeedback(null);
    setResueltos([]);
    setRondaTerminada(false);
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
        titulo="Calcula"
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

  const okCount = resueltos.filter((x) => x.ok).length;
  const puntosRonda = okCount / Math.max(1, resueltos.length);
  const mascotEstado: MascotEstado = rondaTerminada
    ? puntosRonda >= 0.99
      ? 'feliz'
      : 'triste'
    : pasoFeedback
      ? pasoFeedback.ok
        ? 'feliz'
        : 'triste'
      : 'pensando';

  const comparaciones: ItemComparacion[] = resueltos;

  const content = enEstudioVisto ? (
    <EstudioView
      ejercicio={ej}
      soloCalculos
      onAhoraTu={iniciarAhoraTu}
      onSaltar={saltarEstudio}
    />
  ) : rondaTerminada ? (
    <FeedbackPanel
      ok={puntosRonda >= 0.99}
      puntos={puntosRonda}
      titulo={
        puntosRonda >= 0.99
          ? '✓ Todos los cálculos correctos'
          : `Completado ${okCount} de ${resueltos.length} pasos`
      }
      comparaciones={comparaciones}
      nota={ej.nota}
      esUltimo={!rapido && paso + 1 >= total}
      onSiguiente={avanzarEjercicio}
    />
  ) : (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="label">
            Paso {stepIdx + 1} de {calcItems.length}
          </span>
          <h2 className="card-title" style={{ marginTop: 4 }}>
            {ej.titulo}
          </h2>
        </div>
        <button
          type="button"
          className="btn-sec"
          style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
          onClick={() => setMostrarPista((v) => !v)}
        >
          {mostrarPista ? 'Ocultar pista' : 'Pista'}
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#111111' }}>
        {ej.enunciado}
      </p>

      {mostrarPista && ej.nota && (
        <div
          style={{
            background: '#EDEBE6',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 12.5,
            lineHeight: 1.5,
            color: '#111111',
          }}
        >
          <strong>Pista:</strong> {ej.nota}
        </div>
      )}

      {resueltos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resueltos.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12.5,
                padding: '7px 12px',
                borderRadius: 12,
                background: r.ok
                  ? 'rgba(16,185,129,0.09)'
                  : 'rgba(239,68,68,0.09)',
                color: r.ok ? '#065F46' : '#991B1B',
              }}
            >
              <span>{r.etiqueta}</span>
              <span className="tabular-nums" style={{ fontWeight: 600 }}>
                {r.ok ? `✓ ${r.correcta}` : `${r.dada} → ${r.correcta}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {pasoActual && (
        <form
          onSubmit={comprobarPaso}
          style={{
            background: 'rgba(255,255,255,0.78)',
            borderRadius: 16,
            padding: 14,
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <label htmlFor="calcula-step-input" style={{ fontSize: 14, fontWeight: 600 }}>
            {pasoActual.etiqueta}
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              id="calcula-step-input"
              type="text"
              inputMode="decimal"
              className="field tabular-nums"
              style={{ flex: '1 1 160px', textAlign: 'right' }}
              disabled={Boolean(pasoFeedback)}
              placeholder="Importe (tolerancia 0,01)"
              value={inputVal}
              onFocus={(e) =>
                e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
              }
              onChange={(e) => setInputVal(e.target.value)}
              autoFocus
            />

            {!pasoFeedback && (
              <button type="submit" className="btn">
                Comprobar
              </button>
            )}
          </div>
        </form>
      )}

      {pasoFeedback && (
        <div
          aria-live="polite"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 14,
            background: pasoFeedback.ok
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(239,68,68,0.1)',
            color: pasoFeedback.ok ? '#065F46' : '#991B1B',
          }}
        >
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            {pasoFeedback.ok
              ? `✓ Correcto: ${pasoFeedback.correcta}`
              : `Valor correcto: ${pasoFeedback.correcta} (pusiste ${pasoFeedback.dada})`}
          </div>
          {!pasoFeedback.ok && ej.nota && (
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#111111' }}>
              <strong>Cómo se obtiene:</strong> {ej.nota}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={siguientePasoCalculo} autoFocus>
              {stepIdx + 1 < calcItems.length ? 'Siguiente paso →' : 'Ver resultado →'}
            </button>
          </div>
        </div>
      )}
    </section>
  );

  if (rapido) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{content}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GameHeader
        titulo="Calcula"
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
