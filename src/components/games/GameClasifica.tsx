import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NATURALEZA_LABEL, PGC, type CuentaPGC } from '../../data/pgc';
import {
  clasificarMasaCuenta,
  Games,
  MASAS_CLASIFICA,
  type MasaClasificacion,
} from '../../lib/games';
import { Store } from '../../lib/store';
import type { MascotEstado } from '../Mascot';
import {
  FeedbackPanel,
  GameHeader,
  GameSummary,
} from './common';
import type { JuegoProps } from './GameDebeHaber';

function elegirCuentaAleatoria(evitar: string[]): CuentaPGC {
  const disponibles = PGC.filter((c) => !evitar.includes(c.n));
  const pool = disponibles.length > 0 ? disponibles : PGC;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function GameClasifica({
  tema,
  modo,
  n,
  rapido = false,
  onRondaRapida,
  onTerminar,
  onCambiarTema,
}: JuegoProps) {
  const total = rapido ? 1 : n;
  const usadasRef = useRef<string[]>([]);

  const [paso, setPaso] = useState(0);
  const [cuenta, setCuenta] = useState<CuentaPGC>(() => {
    const c = elegirCuentaAleatoria([]);
    usadasRef.current.push(c.n);
    return c;
  });
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [elegida, setElegida] = useState<MasaClasificacion | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const infoCorrecta = clasificarMasaCuenta(cuenta.n);

  useEffect(() => {
    if (rapido || finalizado) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [rapido, finalizado]);

  const responder = useCallback(
    (masa: MasaClasificacion) => {
      if (elegida !== null || enEstudioVisto || finalizado) return;

      const ok = masa === infoCorrecta.masaBoton;
      const puntos = ok ? 1 : 0;

      setElegida(masa);
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
        tema: tema === 'completo' ? 'conceptos' : tema,
        puntos,
        juego: 'Clasifica',
        enunciado: `Clasifica la cuenta ${cuenta.n} (${cuenta.nombre}) en su masa patrimonial.`,
        tuRespuesta: masa,
        correcta: infoCorrecta.masaBoton,
        ejercicioId: `clasifica_${cuenta.n}`,
      });
    },
    [
      cuenta,
      elegida,
      enAhoraTu,
      enEstudioVisto,
      finalizado,
      infoCorrecta.masaBoton,
      modo,
      tema,
    ]
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
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < MASAS_CLASIFICA.length) {
        e.preventDefault();
        responder(MASAS_CLASIFICA[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [elegida, enEstudioVisto, finalizado, responder]);

  const avanzar = () => {
    if (elegida === null) return;
    const ok = elegida === infoCorrecta.masaBoton;

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

    const siguienteCuenta = elegirCuentaAleatoria(usadasRef.current);
    usadasRef.current.push(siguienteCuenta.n);
    setPaso(siguiente);
    setCuenta(siguienteCuenta);
    setElegida(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  };

  const iniciarAhoraTu = () => {
    setXpAcumulado((prev) => prev + 2);
    const nueva = elegirCuentaAleatoria(usadasRef.current);
    usadasRef.current.push(nueva.n);
    setCuenta(nueva);
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
    const siguienteCuenta = elegirCuentaAleatoria(usadasRef.current);
    usadasRef.current.push(siguienteCuenta.n);
    setPaso(siguiente);
    setCuenta(siguienteCuenta);
    setElegida(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(true);
  };

  const reiniciar = () => {
    const primera = elegirCuentaAleatoria([]);
    usadasRef.current = [primera.n];
    setPaso(0);
    setCuenta(primera);
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
        titulo="Clasifica"
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

  const explicacionCuenta =
    `La cuenta ${cuenta.n} (${cuenta.nombre}) pertenece a ${infoCorrecta.masaBoton}` +
    (infoCorrecta.submasa !== infoCorrecta.masaBoton
      ? ` (submasa: ${infoCorrecta.submasa})`
      : '') +
    `. Naturaleza: ${NATURALEZA_LABEL[cuenta.nat]}${
      cuenta.inv ? ', con sentido inverso al habitual de su masa.' : '.'
    }`;

  const mascotEstado: MascotEstado =
    elegida !== null
      ? elegida === infoCorrecta.masaBoton
        ? 'feliz'
        : 'triste'
      : 'pensando';

  const content = enEstudioVisto ? (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="label">Modo Estudio · Masa patrimonial</span>
          <h2 className="card-title" style={{ marginTop: 4 }}>
            <span className="tabular-nums">{cuenta.n}</span> · {cuenta.nombre}
          </h2>
        </div>
        <span className="chip-dark">{infoCorrecta.masaBoton}</span>
      </div>

      <div style={{ background: '#EDEBE6', borderRadius: 14, padding: '12px 14px', fontSize: 13, lineHeight: 1.5 }}>
        <strong>Explicación:</strong> {explicacionCuenta}
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
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <span className="label">Elige la masa patrimonial (teclas 1-7)</span>
          <span className="chip">Grupo {cuenta.grupo}</span>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            padding: '20px 18px',
            border: '1px solid rgba(0,0,0,0.06)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)' }}>
            {cuenta.n}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111111' }}>
            {cuenta.nombre}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 8,
          }}
        >
          {MASAS_CLASIFICA.map((masa, idx) => {
            const respondida = elegida !== null;
            const esCorrecta = masa === infoCorrecta.masaBoton;
            const esElegida = masa === elegida;

            let bg = '#EDEBE6';
            let color = '#111111';
            if (respondida) {
              if (esCorrecta) {
                bg = 'rgba(16,185,129,0.16)';
                color = '#065F46';
              } else if (esElegida) {
                bg = 'rgba(239,68,68,0.15)';
                color = '#991B1B';
              }
            }

            return (
              <button
                key={masa}
                type="button"
                disabled={respondida}
                onClick={() => responder(masa)}
                style={{
                  minHeight: 46,
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: 'none',
                  background: bg,
                  color,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: respondida ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <span>{masa}</span>
                <span className="tabular-nums" style={{ fontSize: 11, opacity: 0.65 }}>
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {elegida !== null && (
        <FeedbackPanel
          ok={elegida === infoCorrecta.masaBoton}
          puntos={elegida === infoCorrecta.masaBoton ? 1 : 0}
          titulo={
            elegida === infoCorrecta.masaBoton
              ? `✓ ${infoCorrecta.masaBoton}`
              : `Pertenece a ${infoCorrecta.masaBoton}`
          }
          explicaciones={[explicacionCuenta]}
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
        titulo="Clasifica"
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
