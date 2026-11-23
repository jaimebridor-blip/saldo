import React, { useEffect, useMemo, useState } from 'react';
import { TEMAS, type Tema } from '../data/temas';
import { Fmt } from '../lib/fmt';
import { go } from '../lib/router';
import { hoyLocal, Store, useStore } from '../lib/store';
import { Vault } from '../lib/vault';
import { Header } from './Header';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function formatearFechaCorta(fechaIso: string): string {
  if (!fechaIso) {
    return 'sin fecha';
  }
  const f = Fmt.fecha(fechaIso);
  return f === '—' ? 'sin fecha' : f;
}

function isoDeDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcularRachaConsecutiva(fechas: string[]): number {
  if (fechas.length === 0) {
    return 0;
  }
  const set = new Set(fechas);
  const ahora = new Date();
  const cursor = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  if (!set.has(isoDeDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(isoDeDate(cursor))) {
      return 0;
    }
  }

  let cuenta = 0;
  while (set.has(isoDeDate(cursor))) {
    cuenta += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return cuenta;
}

function obtenerSemanaActual(fechasPracticadas: string[]) {
  const set = new Set(fechasPracticadas);
  const ahora = new Date();
  const hoyIso = hoyLocal();
  const jsDay = ahora.getDay(); // 0=Dom..6=Sáb
  const offsetLunes = jsDay === 0 ? -6 : 1 - jsDay;
  const lunes = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + offsetLunes
  );

  return DIAS_SEMANA.map((letra, idx) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + idx);
    const iso = isoDeDate(d);
    return {
      letra,
      iso,
      esHoy: iso === hoyIso,
      practicado: set.has(iso),
    };
  });
}

function calcularCuentaAtras(fechaIso: string, ahoraMs: number) {
  if (!fechaIso) {
    return null;
  }
  const [y, m, d] = fechaIso.split('-').map(Number);
  if (!y || !m || !d) {
    return null;
  }
  const objetivo = new Date(y, m - 1, d, 9, 0, 0, 0).getTime();
  const diff = Math.max(0, objetivo - ahoraMs);
  const totalSeg = Math.floor(diff / 1000);
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  return { dias, horas, minutos, segundos, finalizado: diff === 0 };
}

export function Dashboard() {
  const store = useStore();
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  useEffect(() => {
    if (!store.fechaExamen) {
      return;
    }
    const id = window.setInterval(() => {
      setAhoraMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [store.fechaExamen]);

  const countdown = useMemo(
    () => calcularCuentaAtras(store.fechaExamen, ahoraMs),
    [store.fechaExamen, ahoraMs]
  );

  const racha = useMemo(
    () => calcularRachaConsecutiva(store.racha.fechas),
    [store.racha.fechas]
  );

  const semana = useMemo(
    () => obtenerSemanaActual(store.racha.fechas),
    [store.racha.fechas]
  );

  const nivel = Store.nivel(store.xp);
  const xpInicio = 50 * (nivel - 1) * (nivel - 1);
  const xpSiguiente = 50 * nivel * nivel;
  const xpProgreso = Math.min(
    100,
    Math.max(0, ((store.xp - xpInicio) / (xpSiguiente - xpInicio)) * 100)
  );

  const temasDominio = useMemo(() => {
    return TEMAS.filter((t) => t.id !== 'completo').map((t) => {
      const reg = store.dominio[t.id];
      const recientes = reg?.recientes ?? [];
      const sinDatos = recientes.length === 0;
      const pct = sinDatos
        ? 0
        : Math.round(
            (recientes.filter(Boolean).length / recientes.length) * 100
          );
      return { tema: t, pct, sinDatos };
    });
  }, [store.dominio]);

  const temaMenorDominio: Tema = useMemo(() => {
    const ordenado = [...temasDominio].sort((a, b) => {
      if (a.sinDatos !== b.sinDatos) {
        return a.sinDatos ? -1 : 1;
      }
      return a.pct - b.pct;
    });
    return ordenado[0]?.tema ?? TEMAS[1];
  }, [temasDominio]);

  const pendientesVault = Vault.pendientes(store.errores).length;
  const ultimaNota = Store.ultimaNota(store);

  const abrirTemaEnJugar = (temaId: Tema['id']) => {
    Store.update((prev) => ({
      ...prev,
      ui: { ...prev.ui, tema: temaId },
    }));
    go('/jugar');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header
        titulo="Resumen"
        subtitulo={`Contabilidad Financiera · Examen: ${formatearFechaCorta(
          store.fechaExamen
        )}${ultimaNota ? ` · Última nota: ${Fmt.num(ultimaNota.nota)} / 5` : ''}`}
        accionTexto="Modo 5 minutos"
        accionRuta="/jugar?rapido=1"
      />

      <div className="cards-grid">
        {/* 1) Cuenta atrás del examen */}
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-head">
            <div>
              <h2 className="card-title">Cuenta atrás del examen</h2>
              <p className="card-subtitle">
                {store.fechaExamen
                  ? 'Tiempo restante hasta la convocatoria.'
                  : 'Elige la fecha de tu examen para activar la cuenta atrás.'}
              </p>
            </div>
            <span className={store.fechaExamen ? 'chip-dark' : 'chip'}>
              {store.fechaExamen
                ? countdown?.finalizado
                  ? 'Fecha alcanzada'
                  : 'Preparación activa'
                : 'Sin fecha'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: countdown ? 18 : 0,
            }}
          >
            <div style={{ minWidth: 200, flex: '0 1 240px' }}>
              <label
                htmlFor="dashboard-fecha-examen"
                className="label"
                style={{ display: 'block', marginBottom: 6 }}
              >
                Fecha del examen
              </label>
              <input
                id="dashboard-fecha-examen"
                type="date"
                className="field tabular-nums"
                value={store.fechaExamen}
                onChange={(e) => Store.update({ fechaExamen: e.target.value })}
              />
            </div>

            {!countdown && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: '#6B6B6B',
                  flex: '1 1 220px',
                }}
              >
                Pon la fecha arriba para ver los días, horas, minutos y segundos restantes.
              </p>
            )}
          </div>

          {countdown && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { etiqueta: 'DÍAS', valor: String(countdown.dias) },
                {
                  etiqueta: 'HORAS',
                  valor: String(countdown.horas).padStart(2, '0'),
                },
                {
                  etiqueta: 'MINUTOS',
                  valor: String(countdown.minutos).padStart(2, '0'),
                },
                {
                  etiqueta: 'SEGUNDOS',
                  valor: String(countdown.segundos).padStart(2, '0'),
                },
              ].map((bloque) => (
                <div
                  key={bloque.etiqueta}
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 16,
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span
                    className="big-num"
                    style={{ fontSize: 'clamp(30px, 8vw, 56px)', fontWeight: 300 }}
                  >
                    {bloque.valor}
                  </span>
                  <span className="label">{bloque.etiqueta}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2) Racha diaria */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Racha diaria</h2>
              <p className="card-subtitle">Constancia semanal de práctica.</p>
            </div>
            <span className="chip-dark tabular-nums">
              {racha} {racha === 1 ? 'día consecutivo' : 'días consecutivos'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <span className="big-num">{racha}</span>
            <span className="label">DÍAS</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
            aria-label="Días practicados esta semana"
          >
            {semana.map((dia) => (
              <div
                key={dia.iso}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: dia.esHoy ? 700 : 500,
                  backgroundColor: dia.practicado ? '#111111' : '#EDEBE6',
                  color: dia.practicado ? '#FFFFFF' : '#111111',
                  boxShadow: dia.esHoy
                    ? '0 0 0 2px #F4F2ED, 0 0 0 3.5px #111111'
                    : 'none',
                }}
                title={`${dia.letra} (${Fmt.fecha(dia.iso)})${
                  dia.practicado ? ' · Practicado' : ''
                }`}
              >
                {dia.letra}
              </div>
            ))}
          </div>
        </section>

        {/* 3) XP y nivel */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">XP y nivel</h2>
              <p className="card-subtitle">
                Progreso acumulado en ejercicios y repaso.
              </p>
            </div>
            <span className="chip-dark tabular-nums">Nivel {nivel}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="big-num">{Fmt.num(store.xp)}</span>
              <span className="label">XP</span>
            </div>
            {ultimaNota && (
              <span className="chip tabular-nums">
                Último supuesto: {Fmt.num(ultimaNota.nota)} / 5
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 999,
                backgroundColor: '#EDEBE6',
                overflow: 'hidden',
              }}
              role="progressbar"
              aria-valuenow={Math.round(xpProgreso)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso hacia el siguiente nivel"
            >
              <div
                style={{
                  width: `${xpProgreso}%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: '#111111',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            <div
              className="tabular-nums"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#6B6B6B',
              }}
            >
              <span>Nivel {nivel}</span>
              <span>
                {Fmt.num(store.xp)} / {Fmt.num(xpSiguiente)} XP
              </span>
            </div>
          </div>
        </section>

        {/* 4) Dominio por temática */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Dominio por temática</h2>
              <p className="card-subtitle">
                Toca una temática para practicarla en Jugar.
              </p>
            </div>
            <span className="chip">11 temas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {temasDominio.map(({ tema, pct, sinDatos }) => (
              <button
                key={tema.id}
                type="button"
                onClick={() => abrirTemaEnJugar(tema.id)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.55)',
                  borderRadius: 12,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: tema.color,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#111111',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tema.nombre}
                    </span>
                  </div>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: sinDatos ? '#595959' : '#111111',
                      flexShrink: 0,
                    }}
                  >
                    {sinDatos ? '—' : `${pct} %`}
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: '#EDEBE6',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${sinDatos ? 0 : pct}%`,
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: tema.color,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 5) Plan de hoy */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Plan de hoy</h2>
              <p className="card-subtitle">
                Tres pasos cortos para mantener el ritmo diario.
              </p>
            </div>
            <span className="chip tabular-nums">
              {[
                store.dia.juegos > 0,
                store.dia.tarjetas > 0,
                store.dia.vault > 0,
              ].filter(Boolean).length}
              /3
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                id: 'juegos',
                titulo: `Practicar «${temaMenorDominio.nombre}»`,
                detalle: 'Temática con menor dominio actual',
                completado: store.dia.juegos > 0,
                boton: 'Practicar',
                accion: () => abrirTemaEnJugar(temaMenorDominio.id),
              },
              {
                id: 'tarjetas',
                titulo: 'Repasar flashcards pendientes',
                detalle: 'Cuentas clave y fórmulas del PGC',
                completado: store.dia.tarjetas > 0,
                boton: 'Repasar',
                accion: () => go('/flashcards'),
              },
              {
                id: 'vault',
                titulo:
                  pendientesVault > 0
                    ? `Resolver ${pendientesVault} ${
                        pendientesVault === 1 ? 'fallo' : 'fallos'
                      } del Error Vault`
                    : 'Revisar el Error Vault',
                detalle:
                  pendientesVault > 0
                    ? 'Errores pendientes de dominar'
                    : 'Sin fallos pendientes ahora mismo',
                completado: store.dia.vault > 0,
                boton: 'Abrir Vault',
                accion: () => go('/vault'),
              },
            ].map((tarea) => (
              <div
                key={tarea.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      backgroundColor: tarea.completado ? '#111111' : '#EDEBE6',
                      color: tarea.completado ? '#FFFFFF' : '#6B6B6B',
                    }}
                    aria-hidden="true"
                  >
                    {tarea.completado ? '✓' : '·'}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: '#111111',
                        textDecoration: tarea.completado
                          ? 'line-through'
                          : 'none',
                        opacity: tarea.completado ? 0.65 : 1,
                      }}
                    >
                      {tarea.titulo}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B6B6B' }}>
                      {tarea.detalle}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={tarea.completado ? 'btn-sec' : 'btn'}
                  style={{ minHeight: 38, padding: '0 14px', flexShrink: 0 }}
                  onClick={tarea.accion}
                >
                  {tarea.boton}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
