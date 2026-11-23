import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTema, TEMAS, type TemaId } from '../data/temas';
import { Games, JUEGOS, type JuegoId } from '../lib/games';
import { go, useRoute } from '../lib/router';
import { Store, type ModoJuego } from '../lib/store';
import { GameHeader, GameSummary } from './games/common';
import { GameAsiento } from './games/GameAsiento';
import { GameCalcula } from './games/GameCalcula';
import { GameClasifica } from './games/GameClasifica';
import { GameDebeHaber } from './games/GameDebeHaber';
import { GameOrdena } from './games/GameOrdena';
import { GameRellena } from './games/GameRellena';
import { GameTest } from './games/GameTest';
import { Header } from './Header';
import type { MascotEstado } from './Mascot';
import { SelectorModo, SelectorTema, useUi } from './Selectors';

const CANTIDADES_PREGUNTAS = [5, 7, 10] as const;

function esTemaValido(valor: string | undefined): valor is TemaId {
  return Boolean(valor && TEMAS.some((t) => t.id === valor));
}

function esModoJuegoValido(valor: string | undefined): valor is ModoJuego {
  return valor === 'estudio' || valor === 'reto';
}

function elegirSiguienteJuego(tema: TemaId, anterior?: JuegoId): JuegoId {
  const compatibles = JUEGOS.filter((j) => Games.tieneContenido(j.id, tema));
  const pool =
    compatibles.length > 1 && anterior
      ? compatibles.filter((j) => j.id !== anterior)
      : compatibles;
  const elegido = pool[Math.floor(Math.random() * pool.length)];
  return elegido?.id ?? 'test';
}

function renderComponenteJuego(
  juegoId: JuegoId,
  props: {
    tema: TemaId;
    modo: ModoJuego;
    n: number;
    rapido?: boolean;
    onRondaRapida?: (res: { puntos: number; xp: number; acertada: boolean }) => void;
    onTerminar: () => void;
    onCambiarTema: () => void;
  }
) {
  switch (juegoId) {
    case 'debe-haber':
      return <GameDebeHaber {...props} />;
    case 'rellena':
      return <GameRellena {...props} />;
    case 'asiento':
      return <GameAsiento {...props} />;
    case 'calcula':
      return <GameCalcula {...props} />;
    case 'ordena':
      return <GameOrdena {...props} />;
    case 'test':
      return <GameTest {...props} />;
    case 'clasifica':
      return <GameClasifica {...props} />;
  }
}

function ModoRapido5({ temaInicial }: { temaInicial?: string }) {
  const [temaDebil] = useState<TemaId>(() =>
    esTemaValido(temaInicial) ? temaInicial : Games.temaMenorDominio()
  );
  const [segundosRestantes, setSegundosRestantes] = useState(300);
  const [ronda, setRonda] = useState(1);
  const [juegoActual, setJuegoActual] = useState<JuegoId>(() =>
    elegirSiguienteJuego(
      esTemaValido(temaInicial) ? temaInicial : Games.temaMenorDominio()
    )
  );
  const [rondasCompletadas, setRondasCompletadas] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [bonusPerfecto, setBonusPerfecto] = useState(0);
  const [mascotEstado, setMascotEstado] = useState<MascotEstado>('pensando');
  const [finalizado, setFinalizado] = useState(false);

  const xpGuardadoRef = useRef(false);
  const statsRef = useRef({ rondas: 0, aciertos: 0, xp: 0 });

  useEffect(() => {
    statsRef.current = {
      rondas: rondasCompletadas,
      aciertos,
      xp: xpAcumulado,
    };
  }, [rondasCompletadas, aciertos, xpAcumulado]);

  const cerrarSesionRapida = useCallback(() => {
    if (!xpGuardadoRef.current) {
      xpGuardadoRef.current = true;
      const { rondas, aciertos: okCount, xp } = statsRef.current;
      const bonus = Games.calcularBonusPerfecto(okCount, rondas);
      const totalXP = xp + bonus;
      if (totalXP > 0) {
        Store.addXP(totalXP);
      }
      setBonusPerfecto(bonus);
      setXpAcumulado(totalXP);
    }
    setFinalizado(true);
  }, []);

  useEffect(() => {
    if (finalizado) return;
    const id = window.setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          cerrarSesionRapida();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finalizado, cerrarSesionRapida]);

  const manejarRondaRapida = (res: {
    puntos: number;
    xp: number;
    acertada: boolean;
  }) => {
    const nuevasRondas = rondasCompletadas + 1;
    const nuevosAciertos = aciertos + (res.acertada ? 1 : 0);
    const nuevoXp = xpAcumulado + res.xp;

    statsRef.current = {
      rondas: nuevasRondas,
      aciertos: nuevosAciertos,
      xp: nuevoXp,
    };

    setRondasCompletadas(nuevasRondas);
    setAciertos(nuevosAciertos);
    setXpAcumulado(nuevoXp);
    setMascotEstado(res.acertada ? 'feliz' : 'triste');
    setRonda((r) => r + 1);
    setJuegoActual((prev) => elegirSiguienteJuego(temaDebil, prev));
  };

  const reiniciar = () => {
    xpGuardadoRef.current = false;
    statsRef.current = { rondas: 0, aciertos: 0, xp: 0 };
    setSegundosRestantes(300);
    setRonda(1);
    setJuegoActual(elegirSiguienteJuego(temaDebil));
    setRondasCompletadas(0);
    setAciertos(0);
    setXpAcumulado(0);
    setBonusPerfecto(0);
    setMascotEstado('pensando');
    setFinalizado(false);
  };

  if (finalizado) {
    return (
      <GameSummary
        titulo="Modo 5 minutos"
        tema={temaDebil}
        aciertos={aciertos}
        total={rondasCompletadas}
        xp={xpAcumulado}
        bonusPerfecto={bonusPerfecto}
        segundos={300 - segundosRestantes}
        onRepetir={reiniciar}
        onOtraTematica={() => go('/jugar')}
        onVolver={() => go('/dashboard')}
      />
    );
  }

  const infoJuego = Games.get(juegoActual);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GameHeader
        titulo={`Modo 5 minutos · ${infoJuego?.nombre ?? 'Ronda rápida'}`}
        tema={temaDebil}
        modo="reto"
        actual={ronda}
        total={ronda}
        segundos={segundosRestantes}
        esCuentaAtras
        mascotEstado={mascotEstado}
        onSalir={() => {
          if (rondasCompletadas > 0) {
            cerrarSesionRapida();
          } else {
            go('/jugar');
          }
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          padding: '0 4px',
        }}
      >
        <span className="tabular-nums" style={{ fontSize: 12.5, color: '#6B6B6B' }}>
          Aciertos: <strong style={{ color: '#111111' }}>{aciertos}</strong> / {rondasCompletadas} ·{' '}
          <strong style={{ color: '#111111' }}>+{xpAcumulado} XP</strong>
        </span>
        {rondasCompletadas > 0 && (
          <button
            type="button"
            className="btn-sec"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
            onClick={cerrarSesionRapida}
          >
            Terminar sesión
          </button>
        )}
      </div>

      <React.Fragment key={`${ronda}-${juegoActual}`}>
        {renderComponenteJuego(juegoActual, {
          tema: temaDebil,
          modo: 'reto',
          n: 1,
          rapido: true,
          onRondaRapida: manejarRondaRapida,
          onTerminar: cerrarSesionRapida,
          onCambiarTema: () => go('/jugar'),
        })}
      </React.Fragment>
    </div>
  );
}

export function Jugar() {
  const { subruta, query } = useRoute();
  const { tema, modo, setTema } = useUi();

  const [nSeleccionado, setNSeleccionado] = useState<number>(5);
  const [nPersonalizado, setNPersonalizado] = useState(false);

  const temaMenor = useMemo(() => Games.temaMenorDominio(), [tema]);

  if (query.rapido === '1') {
    return <ModoRapido5 temaInicial={query.tema} />;
  }

  if (subruta && Games.esJuegoId(subruta)) {
    const infoJuego = Games.get(subruta);
    const temaJuego = esTemaValido(query.tema) ? query.tema : tema;
    const modoJuego = esModoJuegoValido(query.modo) ? query.modo : modo;
    const parsedN = Number(query.n);
    const nJuego =
      Number.isFinite(parsedN) && parsedN >= 1 && parsedN <= 20
        ? Math.floor(parsedN)
        : infoJuego?.defaultN ?? 5;

    const sinContenido = !Games.tieneContenido(subruta, temaJuego);

    return renderComponenteJuego(subruta, {
      tema: temaJuego,
      modo: modoJuego,
      n: nJuego,
      onTerminar: () => go('/jugar'),
      onCambiarTema: () => {
        if (sinContenido) {
          setTema('completo');
          Games.jugar(subruta, {
            tema: 'completo',
            modo: modoJuego,
            n: nJuego,
          });
        } else {
          go('/jugar');
        }
      },
    });
  }

  const temaActual = getTema(tema);
  const temaDebilInfo = getTema(temaMenor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header
        titulo="Jugar"
        subtitulo="Juegos cortos de 2-5 minutos"
        accionTexto="Modo 5 minutos"
        onAccion={Games.rapido5}
      />

      <SelectorTema />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 280px' }}>
          <SelectorModo />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Preguntas por partida</span>
          <div className="segmented" role="tablist" aria-label="Número de preguntas">
            {CANTIDADES_PREGUNTAS.map((cant) => {
              const activo = nSeleccionado === cant;
              return (
                <button
                  key={cant}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  className={`segmented-btn tabular-nums ${activo ? 'is-active' : ''}`}
                  onClick={() => {
                    setNSeleccionado(cant);
                    setNPersonalizado(true);
                  }}
                >
                  {cant}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarjeta de acceso rápido al Modo 5 minutos */}
      <section
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 className="card-title">Modo 5 minutos</h2>
            <span className="chip-dark">5:00 · Reto mixto</span>
          </div>
          <p className="card-subtitle" style={{ margin: 0 }}>
            Combina juegos cortos aleatorios sobre tu temática más floja actual:{' '}
            <strong style={{ color: '#111111' }}>{temaDebilInfo.nombre}</strong>.
          </p>
        </div>

        <button type="button" className="btn" onClick={Games.rapido5}>
          Empezar 5 min →
        </button>
      </section>

      {/* Grid de los 7 minijuegos */}
      <div className="cards-grid">
        {JUEGOS.map((j) => {
          const disponible = Games.tieneContenido(j.id, tema);
          const nPartida =
            j.id === 'debe-haber' && !nPersonalizado ? j.defaultN : nSeleccionado;
          const etiquetaCantidad =
            j.id === 'debe-haber' && !nPersonalizado
              ? j.etiquetaN
              : `${nPartida} ${j.id === 'ordena' ? 'secuencias' : 'preguntas'}`;

          return (
            <article
              key={j.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
              }}
            >
              <div>
                <div className="card-head" style={{ marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 className="card-title">{j.nombre}</h2>
                    <p className="card-subtitle">{j.descripcion}</p>
                  </div>
                  <span className="chip tabular-nums">{j.duracion}</span>
                </div>

                {!disponible && (
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 12,
                      color: '#6B6B6B',
                      background: '#EDEBE6',
                      borderRadius: 12,
                      padding: '8px 10px',
                      lineHeight: 1.4,
                    }}
                  >
                    «{temaActual.nombre}» no tiene secuencias propias. Puedes probarlo con Examen completo.
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span className="chip tabular-nums" style={{ fontSize: 11.5 }}>
                  {etiquetaCantidad}
                </span>

                {disponible ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      Games.jugar(j.id, {
                        tema,
                        modo,
                        n: nPartida,
                      })
                    }
                  >
                    Jugar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-sec"
                    onClick={() => {
                      setTema('completo');
                      Games.jugar(j.id, {
                        tema: 'completo',
                        modo,
                        n: nPartida,
                      });
                    }}
                  >
                    Usar Examen completo
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
