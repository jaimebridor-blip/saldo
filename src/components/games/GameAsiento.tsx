import React, { useRef, useState } from 'react';
import { PGC } from '../../data/pgc';
import type { TemaId } from '../../data/temas';
import { Engine, type ResultadoCorreccion } from '../../lib/engine';
import { Fmt } from '../../lib/fmt';
import { Games } from '../../lib/games';
import { Store } from '../../lib/store';
import type { Asiento, Ejercicio, Linea } from '../../lib/types';
import { EditorAsiento, type EditorAsientoHandle } from '../EditorAsiento';
import type { MascotEstado } from '../Mascot';
import {
  EstudioView,
  FeedbackPanel,
  GameHeader,
  GameSummary,
} from './common';
import type { JuegoProps } from './GameDebeHaber';

interface RondaAsiento {
  ej: Ejercicio;
  indiceAsiento: number;
  asiento: Asiento;
}

function construirRondaAsiento(
  tema: TemaId,
  paso: number,
  plantillaFija?: string,
  usadosBanco: string[] = []
): RondaAsiento {
  for (let i = 0; i < 8; i++) {
    const ej = Games.obtenerEjercicio({
      tema,
      paso: paso + i,
      requiereAsientos: true,
      plantillaFija,
      usadosBanco,
    });
    if (ej.asientos.length > 0) {
      const idx = Math.floor(Math.random() * ej.asientos.length);
      return { ej, indiceAsiento: idx, asiento: ej.asientos[idx] };
    }
  }
  const ej = Games.obtenerEjercicio({ tema: 'compras', paso, requiereAsientos: true });
  return { ej, indiceAsiento: 0, asiento: ej.asientos[0] };
}

function formatearLineasCorto(lineas: Linea[]): string {
  if (lineas.length === 0) return '(vacío)';
  return lineas
    .map((l) => `${l.c} ${l.d > 0 ? `D ${Fmt.eur(l.d)}` : `H ${Fmt.eur(l.h)}`}`)
    .join(' | ');
}

export function GameAsiento({
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
  const [ronda, setRonda] = useState<RondaAsiento>(() =>
    construirRondaAsiento(tema, 0)
  );
  const [editorKey, setEditorKey] = useState(1);
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [resultado, setResultado] = useState<ResultadoCorreccion | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const editorRef = useRef<EditorAsientoHandle | null>(null);
  const usadosBancoRef = useRef<string[]>([]);

  React.useEffect(() => {
    if (rapido || finalizado) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [rapido, finalizado]);

  const comprobar = (lineasDadas: Linea[]) => {
    if (resultado) return;
    const res = Engine.corregir(ronda.asiento, lineasDadas);
    editorRef.current?.marcar(res);
    setResultado(res);

    if (res.ok) {
      setAciertos((a) => a + 1);
    }

    const xpPregunta =
      modo === 'estudio' && enAhoraTu
        ? res.ok
          ? 5
          : 0
        : Games.calcularXPReto(res.puntos);
    setXpAcumulado((prev) => prev + xpPregunta);

    Games.registrarPregunta({
      tema: ronda.ej.tema,
      puntos: res.puntos,
      juego: 'Asiento completo',
      enunciado: `${ronda.asiento.concepto} (${ronda.asiento.fecha}) · ${ronda.ej.enunciado}`,
      tuRespuesta: formatearLineasCorto(lineasDadas),
      correcta: formatearLineasCorto(ronda.asiento.lineas),
      ejercicioId: `${ronda.ej.id}_asiento_${ronda.indiceAsiento}`,
    });
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
    setRonda(construirRondaAsiento(tema, siguientePaso, undefined, usadosBancoRef.current));
    setEditorKey((k) => k + 1);
    setResultado(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  };

  const iniciarAhoraTu = () => {
    const plantillaId = Games.extraerPlantillaId(ronda.ej);
    setXpAcumulado((prev) => prev + 2);
    setRonda(
      construirRondaAsiento(
        ronda.ej.tema,
        paso + 101,
        plantillaId,
        usadosBancoRef.current
      )
    );
    setEditorKey((k) => k + 1);
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
    setRonda(construirRondaAsiento(tema, 0));
    setEditorKey((k) => k + 1);
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
        titulo="Asiento completo"
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
            <span className="label">Redacta el asiento</span>
            <h2 className="card-title" style={{ marginTop: 4 }}>
              {ronda.ej.asientos.length > 1
                ? `Asiento ${ronda.indiceAsiento + 1} de ${ronda.ej.asientos.length}: ${ronda.asiento.concepto}`
                : ronda.asiento.concepto}
            </h2>
          </div>
          <span className="chip tabular-nums">{ronda.asiento.fecha}</span>
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#111111' }}>
          {ronda.ej.enunciado}
        </p>

        {ronda.ej.inicial && ronda.ej.inicial.length > 0 && (
          <div
            style={{
              background: '#EDEBE6',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 12.5,
            }}
          >
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>
              Saldos iniciales
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
              {ronda.ej.inicial.map((s, idx) => (
                <span key={idx} className="tabular-nums">
                  <strong>{s.c}</strong> {PGC.nombre(s.c)}:{' '}
                  {s.d > 0 ? `${Fmt.eur(s.d)} (D)` : `${Fmt.eur(s.h)} (H)`}
                </span>
              ))}
            </div>
          </div>
        )}

        <EditorAsiento
          key={editorKey}
          ref={editorRef}
          lineas={Math.max(2, ronda.asiento.lineas.length)}
          bloqueado={Boolean(resultado)}
          onComprobar={comprobar}
        />
      </section>

      {resultado && (
        <FeedbackPanel
          ok={resultado.ok}
          puntos={resultado.puntos}
          correccionAsiento={resultado}
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
        titulo="Asiento completo"
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
