import React, { useState } from 'react';
import { getTema, type TemaId } from '../../data/temas';
import {
  SECUENCIAS_ORDENA,
  type PasoOrdena,
  type SecuenciaOrdena,
} from '../../data/theory';
import { barajarArray, Games } from '../../lib/games';
import { Store } from '../../lib/store';
import type { MascotEstado } from '../Mascot';
import {
  FeedbackPanel,
  GameHeader,
  GameSummary,
  SinContenidoCard,
} from './common';
import type { JuegoProps } from './GameDebeHaber';

function estaOrdenCorrecto(orden: PasoOrdena[], referencia: PasoOrdena[]): boolean {
  return orden.every((p, idx) => p.rango === referencia[idx]?.rango);
}

function barajarDesordenado(pasos: PasoOrdena[]): PasoOrdena[] {
  for (let i = 0; i < 12; i++) {
    const barajado = barajarArray(pasos);
    if (!estaOrdenCorrecto(barajado, pasos)) {
      return barajado;
    }
  }
  return [...pasos].reverse();
}

function elegirSecuencia(tema: TemaId, paso: number): SecuenciaOrdena | null {
  const pool =
    tema === 'completo'
      ? SECUENCIAS_ORDENA
      : SECUENCIAS_ORDENA.filter((s) => s.tema === tema);
  if (pool.length === 0) {
    return null;
  }
  return pool[paso % pool.length];
}

export function GameOrdena({
  tema,
  modo,
  n,
  rapido = false,
  onRondaRapida,
  onTerminar,
  onCambiarTema,
}: JuegoProps) {
  const total = rapido ? 1 : n;
  const tiene = Games.tieneContenido('ordena', tema);

  const [paso, setPaso] = useState(0);
  const [secuencia, setSecuencia] = useState<SecuenciaOrdena | null>(() =>
    elegirSecuencia(tema, 0)
  );
  const [orden, setOrden] = useState<PasoOrdena[]>(() =>
    secuencia ? barajarDesordenado(secuencia.pasos) : []
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [enEstudioVisto, setEnEstudioVisto] = useState(
    !rapido && modo === 'estudio'
  );
  const [enAhoraTu, setEnAhoraTu] = useState(false);

  const [marcas, setMarcas] = useState<boolean[] | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  React.useEffect(() => {
    if (rapido || finalizado || !tiene) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [rapido, finalizado, tiene]);

  if (!tiene || !secuencia) {
    return (
      <SinContenidoCard
        juegoNombre="Ordena"
        temaNombre={getTema(tema).nombre}
        onCambiarCompleto={onCambiarTema}
        onVolver={onTerminar}
      />
    );
  }

  const moverPaso = (idx: number, delta: -1 | 1) => {
    if (marcas) return;
    const destino = idx + delta;
    if (destino < 0 || destino >= orden.length) return;
    setOrden((prev) => {
      const copia = [...prev];
      const tmp = copia[idx];
      copia[idx] = copia[destino];
      copia[destino] = tmp;
      return copia;
    });
  };

  const soltarEn = (destinoIdx: number) => {
    if (marcas || dragIdx === null || dragIdx === destinoIdx) {
      setDragIdx(null);
      return;
    }
    setOrden((prev) => {
      const copia = [...prev];
      const [movido] = copia.splice(dragIdx, 1);
      copia.splice(destinoIdx, 0, movido);
      return copia;
    });
    setDragIdx(null);
  };

  const comprobar = () => {
    if (marcas) return;
    const evaluacion = orden.map(
      (p, idx) => p.rango === secuencia.pasos[idx]?.rango
    );
    const okCount = evaluacion.filter(Boolean).length;
    const puntos = okCount / Math.max(1, evaluacion.length);
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
      tema: secuencia.tema,
      puntos,
      juego: 'Ordena',
      enunciado: `Ordena la secuencia: ${secuencia.titulo}`,
      tuRespuesta: orden.map((p, i) => `${i + 1}. ${p.texto}`).join(' → '),
      correcta: secuencia.pasos.map((p, i) => `${i + 1}. ${p.texto}`).join(' → '),
      ejercicioId: secuencia.id,
    });

    setMarcas(evaluacion);
  };

  const avanzar = () => {
    if (!marcas) return;
    const okCount = marcas.filter(Boolean).length;
    const puntos = okCount / Math.max(1, marcas.length);
    const okTotal = puntos >= 0.99;

    if (rapido && onRondaRapida) {
      onRondaRapida({
        puntos,
        xp: xpAcumulado,
        acertada: okTotal,
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

    const nextSec = elegirSecuencia(tema, siguiente)!;
    setPaso(siguiente);
    setSecuencia(nextSec);
    setOrden(barajarDesordenado(nextSec.pasos));
    setMarcas(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(modo === 'estudio');
  };

  const iniciarAhoraTu = () => {
    setXpAcumulado((prev) => prev + 2);
    setOrden(barajarDesordenado(secuencia.pasos));
    setMarcas(null);
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
    const nextSec = elegirSecuencia(tema, siguiente)!;
    setPaso(siguiente);
    setSecuencia(nextSec);
    setOrden(barajarDesordenado(nextSec.pasos));
    setMarcas(null);
    setEnAhoraTu(false);
    setEnEstudioVisto(true);
  };

  const reiniciar = () => {
    const first = elegirSecuencia(tema, 0)!;
    setPaso(0);
    setSecuencia(first);
    setOrden(barajarDesordenado(first.pasos));
    setMarcas(null);
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
        titulo="Ordena"
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

  const okCount = marcas ? marcas.filter(Boolean).length : 0;
  const puntos = marcas ? okCount / Math.max(1, marcas.length) : 0;
  const mascotEstado: MascotEstado = marcas
    ? puntos >= 0.99
      ? 'feliz'
      : 'triste'
    : 'pensando';

  const content = enEstudioVisto ? (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="label">Modo Estudio · Secuencia correcta</span>
          <h2 className="card-title" style={{ marginTop: 4 }}>
            {secuencia.titulo}
          </h2>
        </div>
        <span className="chip-dark">{secuencia.pasos.length} pasos</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {secuencia.pasos.map((p, idx) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 14,
              padding: '10px 14px',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: 13.5,
            }}
          >
            <span className="chip-dark tabular-nums" style={{ minWidth: 28, padding: '4px 8px' }}>
              {idx + 1}
            </span>
            <span>{p.texto}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#EDEBE6', borderRadius: 14, padding: '12px 14px', fontSize: 13, lineHeight: 1.5 }}>
        <strong>Nota:</strong> {secuencia.nota}
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
            <span className="label">Arrastra o usa ↑ ↓ para ordenar</span>
            <h2 className="card-title" style={{ marginTop: 4 }}>
              {secuencia.titulo}
            </h2>
          </div>
          <span className="chip">{secuencia.pasos.length} pasos</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orden.map((item, idx) => {
            const marca = marcas ? marcas[idx] : null;
            return (
              <div
                key={item.id}
                draggable={!marcas}
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarEn(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 16,
                  touchAction: 'manipulation',
                  cursor: marcas ? 'default' : 'grab',
                  background:
                    marca === null
                      ? dragIdx === idx
                        ? '#EDEBE6'
                        : 'rgba(255,255,255,0.82)'
                      : marca
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(239,68,68,0.11)',
                  border: `1px solid ${
                    marca === null
                      ? 'rgba(0,0,0,0.07)'
                      : marca
                        ? 'rgba(16,185,129,0.35)'
                        : 'rgba(239,68,68,0.35)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className="chip tabular-nums" style={{ minWidth: 28, padding: '4px 8px' }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.4, color: '#111111' }}>
                    {item.texto}
                  </span>
                </div>

                {!marcas ? (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn-sec"
                      disabled={idx === 0}
                      aria-label={`Subir paso ${idx + 1}`}
                      style={{
                        width: 44,
                        minWidth: 44,
                        minHeight: 44,
                        padding: 0,
                        touchAction: 'manipulation',
                      }}
                      onClick={() => moverPaso(idx, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn-sec"
                      disabled={idx === orden.length - 1}
                      aria-label={`Bajar paso ${idx + 1}`}
                      style={{
                        width: 44,
                        minWidth: 44,
                        minHeight: 44,
                        padding: 0,
                        touchAction: 'manipulation',
                      }}
                      onClick={() => moverPaso(idx, 1)}
                    >
                      ↓
                    </button>
                  </div>
                ) : (
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: marca ? '#065F46' : '#991B1B',
                      flexShrink: 0,
                    }}
                  >
                    {marca ? '✓' : '✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {!marcas && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={comprobar}>
              Comprobar
            </button>
          </div>
        )}
      </section>

      {marcas && (
        <FeedbackPanel
          ok={puntos >= 0.99}
          puntos={puntos}
          titulo={
            puntos >= 0.99
              ? '✓ Secuencia en orden perfecto'
              : `${okCount} de ${marcas.length} pasos en su posición`
          }
          explicaciones={
            puntos < 0.99
              ? [
                  `Orden correcto: ${secuencia.pasos
                    .map((p, i) => `${i + 1}) ${p.texto}`)
                    .join(' · ')}`,
                ]
              : undefined
          }
          nota={secuencia.nota}
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
        titulo="Ordena"
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
