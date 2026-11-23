import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PGC } from '../../data/pgc';
import type { TemaId } from '../../data/temas';
import { Engine } from '../../lib/engine';
import { Fmt } from '../../lib/fmt';
import { Games } from '../../lib/games';
import { Store, type ModoJuego } from '../../lib/store';
import type { Asiento, Ejercicio, Linea } from '../../lib/types';
import type { MascotEstado } from '../Mascot';
import {
  FeedbackPanel,
  GameHeader,
  GameSummary,
} from './common';

export interface JuegoProps {
  tema: TemaId;
  modo: ModoJuego;
  n: number;
  rapido?: boolean;
  onRondaRapida?: (res: { puntos: number; xp: number; acertada: boolean }) => void;
  onTerminar: () => void;
  onCambiarTema: () => void;
}

interface TarjetaDebeHaber {
  ej: Ejercicio;
  asiento: Asiento;
  linea: Linea;
  ladoCorrecto: 'D' | 'H';
  importe: number;
  explicacion: string;
}

function construirTarjeta(
  tema: TemaId,
  paso: number,
  plantillaFija?: string,
  usadosBanco: string[] = []
): TarjetaDebeHaber {
  for (let i = 0; i < 8; i++) {
    const ej = Games.obtenerEjercicio({
      tema,
      paso: paso + i,
      requiereAsientos: true,
      plantillaFija,
      usadosBanco,
    });
    if (ej.asientos.length === 0) continue;
    const asiento = ej.asientos[Math.floor(Math.random() * ej.asientos.length)];
    const validas = asiento.lineas.filter((l) => (l.d > 0) !== (l.h > 0));
    if (validas.length === 0) continue;
    const idx = Math.floor(Math.random() * validas.length);
    const linea = validas[idx];
    const explicaciones = Engine.explicarLineas({ ...asiento, lineas: [linea] });
    return {
      ej,
      asiento,
      linea,
      ladoCorrecto: linea.d > 0 ? 'D' : 'H',
      importe: linea.d > 0 ? linea.d : linea.h,
      explicacion: explicaciones[0] || '',
    };
  }
  const ej = Games.obtenerEjercicio({ tema: 'compras', paso, requiereAsientos: true });
  const asiento = ej.asientos[0];
  const linea = asiento.lineas[0];
  return {
    ej,
    asiento,
    linea,
    ladoCorrecto: linea.d > 0 ? 'D' : 'H',
    importe: linea.d > 0 ? linea.d : linea.h,
    explicacion: Engine.explicarLineas({ ...asiento, lineas: [linea] })[0] || '',
  };
}

export function GameDebeHaber({
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
  const [tarjeta, setTarjeta] = useState<TarjetaDebeHaber>(() =>
    construirTarjeta(tema, 0)
  );
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [dragX, setDragX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const startXRef = useRef<number | null>(null);

  const [respuestaDada, setRespuestaDada] = useState<'D' | 'H' | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const usadosBancoRef = useRef<string[]>([]);

  useEffect(() => {
    if (rapido || finalizado) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [rapido, finalizado]);

  const responder = useCallback(
    (eleccion: 'D' | 'H') => {
      if (respuestaDada || enEstudioVisto || finalizado) return;

      const ok = eleccion === tarjeta.ladoCorrecto;
      const puntos = ok ? 1 : 0;

      setRespuestaDada(eleccion);
      setDragX(0);
      setArrastrando(false);

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
        tema: tarjeta.ej.tema,
        puntos,
        juego: '¿Debe o Haber?',
        enunciado: `${tarjeta.asiento.concepto} · ${tarjeta.linea.c} ${PGC.nombre(tarjeta.linea.c)} (${Fmt.eur(tarjeta.importe)})`,
        tuRespuesta: eleccion === 'D' ? 'Debe' : 'Haber',
        correcta: tarjeta.ladoCorrecto === 'D' ? 'Debe' : 'Haber',
        ejercicioId: `${tarjeta.ej.id}_${tarjeta.linea.c}`,
      });
    },
    [enAhoraTu, enEstudioVisto, finalizado, modo, respuestaDada, tarjeta]
  );

  useEffect(() => {
    if (respuestaDada || enEstudioVisto || finalizado) return;
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
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        responder('D');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        responder('H');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enEstudioVisto, finalizado, responder, respuestaDada]);

  const avanzar = useCallback(() => {
    if (rapido && onRondaRapida) {
      const ok = respuestaDada === tarjeta.ladoCorrecto;
      onRondaRapida({
        puntos: ok ? 1 : 0,
        xp: xpAcumulado,
        acertada: ok,
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

    if (tarjeta.ej.fuente === 'banco') {
      usadosBancoRef.current.push(tarjeta.ej.id);
    }

    setPaso(siguientePaso);
    setTarjeta(construirTarjeta(tema, siguientePaso, undefined, usadosBancoRef.current));
    setRespuestaDada(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  }, [
    aciertos,
    modo,
    onRondaRapida,
    paso,
    rapido,
    respuestaDada,
    tarjeta,
    tema,
    total,
    xpAcumulado,
  ]);

  const iniciarAhoraTu = () => {
    const plantillaId = Games.extraerPlantillaId(tarjeta.ej);
    setXpAcumulado((prev) => prev + 2);
    setTarjeta(
      construirTarjeta(
        tarjeta.ej.tema,
        paso + 101,
        plantillaId,
        usadosBancoRef.current
      )
    );
    setEnEstudioVisto(false);
    setEnAhoraTu(true);
    setRespuestaDada(null);
  };

  const saltarEstudio = () => {
    setXpAcumulado((prev) => prev + 2);
    avanzar();
  };

  const reiniciar = () => {
    usadosBancoRef.current = [];
    setPaso(0);
    setTarjeta(construirTarjeta(tema, 0));
    setEnEstudioVisto(modo === 'estudio');
    setEnAhoraTu(false);
    setRespuestaDada(null);
    setAciertos(0);
    setXpAcumulado(0);
    setBonusPerfecto(0);
    setSegundos(0);
    setFinalizado(false);
  };

  if (finalizado) {
    return (
      <GameSummary
        titulo="¿Debe o Haber?"
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

  const mascotEstado: MascotEstado = respuestaDada
    ? respuestaDada === tarjeta.ladoCorrecto
      ? 'feliz'
      : 'triste'
    : 'pensando';

  const nombreCuenta = PGC.nombre(tarjeta.linea.c) || 'Cuenta del PGC';

  const content = enEstudioVisto ? (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="label">Modo Estudio · Movimiento resuelto</span>
          <h2 className="card-title" style={{ marginTop: 4 }}>
            {tarjeta.asiento.concepto}
          </h2>
        </div>
        <span className="chip-dark">
          {tarjeta.ladoCorrecto === 'D' ? 'Va al Debe' : 'Va al Haber'}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13.5, color: '#6B6B6B', lineHeight: 1.5 }}>
        {tarjeta.ej.enunciado}
      </p>

      <div
        style={{
          background: 'rgba(255,255,255,0.75)',
          borderRadius: 18,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="label">Cuenta e importe</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          <span className="tabular-nums">{tarjeta.linea.c}</span> · {nombreCuenta}
        </div>
        <div className="big-num" style={{ fontSize: 'clamp(28px, 7.5vw, 38px)' }}>
          {Fmt.eur(tarjeta.importe)}
        </div>
      </div>

      <div style={{ background: '#EDEBE6', borderRadius: 14, padding: '12px 14px', fontSize: 13, lineHeight: 1.5 }}>
        <strong>Explicación:</strong> {tarjeta.explicacion}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="label">Desliza o pulsa ← Debe / Haber →</span>
          <span className="chip">{tarjeta.asiento.fecha}</span>
        </div>

        <p style={{ margin: 0, fontSize: 13.5, color: '#6B6B6B', lineHeight: 1.45 }}>
          <strong>Operación:</strong> {tarjeta.asiento.concepto}. {tarjeta.ej.enunciado}
        </p>

        <div
          onPointerDown={(e) => {
            if (respuestaDada) return;
            startXRef.current = e.clientX;
            setArrastrando(true);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!arrastrando || startXRef.current === null || respuestaDada) return;
            const dx = e.clientX - startXRef.current;
            setDragX(Math.max(-160, Math.min(160, dx)));
          }}
          onPointerUp={() => {
            if (!arrastrando) return;
            if (dragX <= -75) {
              responder('D');
            } else if (dragX >= 75) {
              responder('H');
            } else {
              setDragX(0);
              setArrastrando(false);
            }
            startXRef.current = null;
          }}
          onPointerCancel={() => {
            setDragX(0);
            setArrastrando(false);
            startXRef.current = null;
          }}
          style={{
            position: 'relative',
            touchAction: 'pan-y',
            userSelect: 'none',
            cursor: respuestaDada ? 'default' : 'grab',
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px 20px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
            transition: arrastrando ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 10,
          }}
        >
          {dragX < -24 && (
            <span
              className="chip-dark"
              style={{ position: 'absolute', top: 12, left: 12 }}
            >
              ← Debe
            </span>
          )}
          {dragX > 24 && (
            <span
              className="chip-dark"
              style={{ position: 'absolute', top: 12, right: 12 }}
            >
              Haber →
            </span>
          )}

          <span className="chip tabular-nums" style={{ fontSize: 13, fontWeight: 600 }}>
            Cuenta {tarjeta.linea.c}
          </span>

          <div style={{ fontSize: 18, fontWeight: 600, color: '#111111', lineHeight: 1.3 }}>
            {nombreCuenta}
          </div>

          <div className="big-num" style={{ fontSize: 'clamp(30px, 8vw, 44px)' }}>
            {Fmt.eur(tarjeta.importe)}
          </div>
        </div>

        {!respuestaDada && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              className="btn-sec"
              style={{ minHeight: 48, fontSize: 14 }}
              onClick={() => responder('D')}
            >
              ← Debe
            </button>
            <button
              type="button"
              className="btn"
              style={{ minHeight: 48, fontSize: 14 }}
              onClick={() => responder('H')}
            >
              Haber →
            </button>
          </div>
        )}
      </section>

      {respuestaDada && (
        <FeedbackPanel
          ok={respuestaDada === tarjeta.ladoCorrecto}
          puntos={respuestaDada === tarjeta.ladoCorrecto ? 1 : 0}
          titulo={
            respuestaDada === tarjeta.ladoCorrecto
              ? `✓ Correcto: ${tarjeta.ladoCorrecto === 'D' ? 'Debe' : 'Haber'}`
              : `Correspondía al ${tarjeta.ladoCorrecto === 'D' ? 'Debe' : 'Haber'}`
          }
          explicaciones={[tarjeta.explicacion]}
          nota={tarjeta.ej.nota}
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
        titulo="¿Debe o Haber?"
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
