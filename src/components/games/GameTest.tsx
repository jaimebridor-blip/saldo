import React, { useCallback, useEffect, useState } from 'react';
import type { TemaId } from '../../data/temas';
import {
  generarPreguntaAutomaticaPGC,
  PREGUNTAS_TEORIA,
  type PreguntaTeoria,
} from '../../data/theory';
import { barajarArray, Games } from '../../lib/games';
import { Store } from '../../lib/store';
import type { MascotEstado } from '../Mascot';
import {
  FeedbackPanel,
  GameHeader,
  GameSummary,
} from './common';
import type { JuegoProps } from './GameDebeHaber';

function construirBateriaPreguntas(tema: TemaId, cantidad: number): PreguntaTeoria[] {
  const fijas =
    tema === 'completo'
      ? barajarArray(PREGUNTAS_TEORIA)
      : barajarArray(PREGUNTAS_TEORIA.filter((p) => p.tema === tema));

  const lista: PreguntaTeoria[] = [...fijas.slice(0, cantidad)];
  let idxAuto = 0;
  while (lista.length < cantidad) {
    lista.push(generarPreguntaAutomaticaPGC(tema, idxAuto));
    idxAuto += 1;
  }
  return lista;
}

export function GameTest({
  tema,
  modo,
  n,
  rapido = false,
  onRondaRapida,
  onTerminar,
  onCambiarTema,
}: JuegoProps) {
  const total = rapido ? 1 : n;
  const [preguntas, setPreguntas] = useState<PreguntaTeoria[]>(() =>
    construirBateriaPreguntas(tema, total)
  );
  const [paso, setPaso] = useState(0);
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const pregunta = preguntas[paso] ?? preguntas[0];

  useEffect(() => {
    if (rapido || finalizado) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [rapido, finalizado]);

  const responder = useCallback(
    (idx: number) => {
      if (elegida !== null || enEstudioVisto || finalizado || !pregunta) return;
      if (idx < 0 || idx >= pregunta.opciones.length) return;

      const ok = idx === pregunta.correcta;
      const puntos = ok ? 1 : 0;

      setElegida(idx);
      if (ok) {
        setAciertos((a) => a + 1);
      }

      const xpPregunta =
        modo === 'estudio' && enAhoraTu
          ? ok
            ? 5
            : 0
          : Games.calcularXPReto(puntos);
      setXpAcumulado((prev) => prev + xpPregunta);

      Games.registrarPregunta({
        tema: pregunta.tema,
        puntos,
        juego: 'Test de teoría',
        enunciado: pregunta.enunciado,
        tuRespuesta: pregunta.opciones[idx] ?? '—',
        correcta: pregunta.opciones[pregunta.correcta] ?? '—',
        ejercicioId: pregunta.id,
      });
    },
    [elegida, enAhoraTu, enEstudioVisto, finalizado, modo, pregunta]
  );

  useEffect(() => {
    if (elegida !== null || enEstudioVisto || finalizado) return;
    const onKey = (e: KeyboardEvent) => {
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
      const num = Number(e.key);
      if (num >= 1 && num <= (pregunta?.opciones.length ?? 0)) {
        e.preventDefault();
        responder(num - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [elegida, enEstudioVisto, finalizado, pregunta, responder]);

  const avanzar = () => {
    if (elegida === null) return;
    const ok = elegida === pregunta.correcta;

    if (rapido && onRondaRapida) {
      onRondaRapida({
        puntos: ok ? 1 : 0,
        xp: xpAcumulado,
        acertada: ok,
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

    setPaso(siguiente);
    setElegida(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  };

  const iniciarAhoraTu = () => {
    setXpAcumulado((prev) => prev + 2);
    const nueva = generarPreguntaAutomaticaPGC(tema, paso + 500);
    setPreguntas((prev) => prev.map((p, i) => (i === paso ? nueva : p)));
    setElegida(null);
    setEnEstudioVisto(false);
    setEnAhoraTu(true);
  };

  const saltarEstudio = () => {
    setXpAcumulado((prev) => prev + 2);
    const siguiente = paso + 1;
    if (siguiente >= total) {
      Store.addXP(xpAcumulado + 2);
      setXpAcumulado((p) => p + 2);
      setFinalizado(true);
      return;
    }
    setPaso(siguiente);
    setElegida(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(true);
  };

  const reiniciar = () => {
    setPreguntas(construirBateriaPreguntas(tema, total));
    setPaso(0);
    setElegida(null);
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
        titulo="Test de teoría"
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

  const mascotEstado: MascotEstado =
    elegida !== null
      ? elegida === pregunta.correcta
        ? 'feliz'
        : 'triste'
      : 'pensando';

  const content = enEstudioVisto ? (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="label">Modo Estudio · Concepto clave</span>
          <h2 className="card-title" style={{ marginTop: 4 }}>
            {pregunta.enunciado}
          </h2>
        </div>
        <span className="chip">{pregunta.tipo === 'vf' ? 'V / F' : 'Test'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pregunta.opciones.map((op, idx) => {
          const esCorrecta = idx === pregunta.correcta;
          return (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: esCorrecta ? '#111111' : 'rgba(255,255,255,0.65)',
                color: esCorrecta ? '#FFFFFF' : '#6B6B6B',
                fontSize: 13.5,
                fontWeight: esCorrecta ? 600 : 400,
              }}
            >
              {esCorrecta ? '✓ ' : ''}
              {op}
            </div>
          );
        })}
      </div>

      <div style={{ background: '#EDEBE6', borderRadius: 14, padding: '12px 14px', fontSize: 13, lineHeight: 1.5 }}>
        <strong>Explicación:</strong> {pregunta.explicacion}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" className="btn-sec" onClick={saltarEstudio}>
          Siguiente (+2 XP)
        </button>
        <button type="button" className="btn" onClick={iniciarAhoraTu}>
          Entendido, ahora tú →
        </button>
      </div>
    </section>
  ) : (
    <>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="label">
              {pregunta.tipo === 'vf' ? 'Verdadero o falso' : 'Elige la opción correcta (teclas 1-4)'}
            </span>
            <h2 className="card-title" style={{ marginTop: 6, fontSize: 16 }}>
              {pregunta.enunciado}
            </h2>
          </div>
          {pregunta.automatica && <span className="chip">PGC</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pregunta.opciones.map((op, idx) => {
            const respondida = elegida !== null;
            const esCorrecta = idx === pregunta.correcta;
            const esElegida = idx === elegida;

            let bg = 'rgba(255,255,255,0.82)';
            let color = '#111111';
            let border = 'rgba(0,0,0,0.08)';

            if (respondida) {
              if (esCorrecta) {
                bg = 'rgba(16,185,129,0.14)';
                color = '#065F46';
                border = 'rgba(16,185,129,0.4)';
              } else if (esElegida) {
                bg = 'rgba(239,68,68,0.12)';
                color = '#991B1B';
                border = 'rgba(239,68,68,0.4)';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={respondida}
                onClick={() => responder(idx)}
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
                  fontWeight: esElegida || (respondida && esCorrecta) ? 600 : 500,
                  cursor: respondida ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span className="chip tabular-nums" style={{ padding: '3px 8px', fontSize: 11 }}>
                  {idx + 1}
                </span>
                <span>{op}</span>
              </button>
            );
          })}
        </div>
      </section>

      {elegida !== null && (
        <FeedbackPanel
          ok={elegida === pregunta.correcta}
          puntos={elegida === pregunta.correcta ? 1 : 0}
          titulo={
            elegida === pregunta.correcta
              ? '✓ Respuesta correcta'
              : `Respuesta correcta: ${pregunta.opciones[pregunta.correcta]}`
          }
          explicaciones={[pregunta.explicacion]}
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
        titulo="Test de teoría"
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
