import React, { useEffect } from 'react';
import { PGC } from '../../data/pgc';
import { getTema, type TemaId } from '../../data/temas';
import { Engine, type ResultadoCorreccion } from '../../lib/engine';
import { Fmt } from '../../lib/fmt';
import type { ModoJuego } from '../../lib/store';
import type { Asiento, Ejercicio } from '../../lib/types';
import { Mascot, type MascotEstado } from '../Mascot';

export function formatCrono(seg: number): string {
  const limpio = Math.max(0, Math.floor(seg));
  const min = Math.floor(limpio / 60);
  const s = limpio % 60;
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface GameHeaderProps {
  titulo: string;
  tema: TemaId;
  modo: ModoJuego;
  actual: number;
  total: number;
  segundos: number;
  esCuentaAtras?: boolean;
  mascotEstado: MascotEstado;
  enAhoraTu?: boolean;
  onSalir: () => void;
}

export function GameHeader({
  titulo,
  tema,
  modo,
  actual,
  total,
  segundos,
  esCuentaAtras = false,
  mascotEstado,
  enAhoraTu = false,
  onSalir,
}: GameHeaderProps) {
  const temaInfo = getTema(tema);
  const progresoPct = esCuentaAtras
    ? Math.max(0, Math.min(100, (segundos / 300) * 100))
    : total > 0
      ? Math.max(0, Math.min(100, (Math.min(actual, total) / total) * 100))
      : 0;

  return (
    <header className="card" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            type="button"
            className="btn-sec"
            style={{ minHeight: 36, padding: '0 12px', fontSize: 12.5 }}
            onClick={onSalir}
            aria-label="Salir del juego"
          >
            ← Salir
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111111', lineHeight: 1.25 }}>
              {titulo}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span className="chip" style={{ fontSize: 11, padding: '3px 9px' }}>
                {temaInfo.nombre}
              </span>
              <span
                className={modo === 'reto' || enAhoraTu ? 'chip-dark' : 'chip'}
                style={{ fontSize: 11, padding: '3px 9px' }}
              >
                {esCuentaAtras
                  ? 'Modo 5 min'
                  : enAhoraTu
                    ? 'Ahora tú (Reto)'
                    : modo === 'estudio'
                      ? 'Estudio'
                      : 'Reto'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ fontSize: 10 }}>
              {esCuentaAtras ? 'Restante' : 'Tiempo'}
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: esCuentaAtras && segundos <= 30 ? '#991B1B' : '#111111',
              }}
            >
              {formatCrono(segundos)}
            </div>
          </div>

          <Mascot color={temaInfo.color} estado={mascotEstado} size={46} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: '#6B6B6B',
          }}
          className="tabular-nums"
        >
          <span>
            {esCuentaAtras
              ? `Ronda ${actual}`
              : `Pregunta ${Math.min(actual, total)} de ${total}`}
          </span>
          <span>{Math.round(progresoPct)} %</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progresoPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            background: '#EDEBE6',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progresoPct}%`,
              height: '100%',
              borderRadius: 999,
              background: '#111111',
              transition: 'width 200ms ease',
            }}
          />
        </div>
      </div>
    </header>
  );
}

export function TablaAsientoResuelto({
  asiento,
  numero,
}: {
  asiento: Asiento;
  numero?: number;
}) {
  const explicaciones = Engine.explicarLineas(asiento);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderRadius: 16,
        padding: 14,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111111' }}>
          {numero ? `Asiento ${numero} · ` : ''}
          {asiento.concepto}
        </span>
        <span className="chip tabular-nums" style={{ fontSize: 11, padding: '3px 9px' }}>
          {asiento.fecha}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B6B6B', fontSize: 11 }}>
              <th style={{ textAlign: 'left', padding: '6px 6px' }}>Cuenta</th>
              <th style={{ textAlign: 'right', padding: '6px 6px' }}>Debe</th>
              <th style={{ textAlign: 'right', padding: '6px 6px' }}>Haber</th>
            </tr>
          </thead>
          <tbody>
            {asiento.lineas.map((l, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '7px 6px' }}>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>
                    {l.c}
                  </span>{' '}
                  <span style={{ color: '#6B6B6B' }}>{PGC.nombre(l.c)}</span>
                </td>
                <td className="tabular-nums" style={{ textAlign: 'right', padding: '7px 6px', fontWeight: l.d > 0 ? 600 : 400 }}>
                  {l.d > 0 ? Fmt.eur(l.d) : '—'}
                </td>
                <td className="tabular-nums" style={{ textAlign: 'right', padding: '7px 6px', fontWeight: l.h > 0 ? 600 : 400 }}>
                  {l.h > 0 ? Fmt.eur(l.h) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#6B6B6B', lineHeight: 1.45 }}>
        {explicaciones.map((txt, idx) => (
          <div key={idx}>· {txt}</div>
        ))}
      </div>
    </div>
  );
}

export interface EstudioViewProps {
  ejercicio: Ejercicio;
  indiceAsiento?: number;
  soloCalculos?: boolean;
  onAhoraTu: () => void;
  onSaltar?: () => void;
}

export function EstudioView({
  ejercicio,
  indiceAsiento,
  soloCalculos = false,
  onAhoraTu,
  onSaltar,
}: EstudioViewProps) {
  const asientosMostrar =
    typeof indiceAsiento === 'number' && ejercicio.asientos[indiceAsiento]
      ? [ejercicio.asientos[indiceAsiento]]
      : ejercicio.asientos;

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="label">Modo Estudio · Ejemplo resuelto</span>
          <h2 className="card-title" style={{ marginTop: 4 }}>
            {ejercicio.titulo}
          </h2>
        </div>
        <span className="chip">Nivel {ejercicio.nivel}</span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#111111' }}>
        {ejercicio.enunciado}
      </p>

      {ejercicio.inicial && ejercicio.inicial.length > 0 && (
        <div
          style={{
            background: '#EDEBE6',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 12.5,
            color: '#111111',
          }}
        >
          <span className="label" style={{ display: 'block', marginBottom: 6 }}>
            Saldos iniciales
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
            {ejercicio.inicial.map((s, idx) => (
              <span key={idx} className="tabular-nums">
                <strong>{s.c}</strong> {PGC.nombre(s.c)}:{' '}
                {s.d > 0 ? `${Fmt.eur(s.d)} (D)` : `${Fmt.eur(s.h)} (H)`}
              </span>
            ))}
          </div>
        </div>
      )}

      {!soloCalculos && asientosMostrar.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {asientosMostrar.map((a, idx) => (
            <TablaAsientoResuelto
              key={idx}
              asiento={a}
              numero={asientosMostrar.length > 1 ? idx + 1 : undefined}
            />
          ))}
        </div>
      )}

      {ejercicio.calc.length > 0 && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            borderRadius: 16,
            padding: 14,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span className="label">Cálculos clave</span>
          {ejercicio.calc.map((c, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                fontSize: 13.5,
                borderBottom:
                  idx < ejercicio.calc.length - 1
                    ? '1px solid rgba(0,0,0,0.05)'
                    : 'none',
                paddingBottom: idx < ejercicio.calc.length - 1 ? 6 : 0,
              }}
            >
              <span style={{ color: '#6B6B6B' }}>{c.etiqueta}</span>
              <span className="tabular-nums" style={{ fontWeight: 600, color: '#111111' }}>
                {typeof c.valor === 'number' ? Fmt.eur(c.valor) : c.valor}
              </span>
            </div>
          ))}
        </div>
      )}

      {ejercicio.nota && (
        <div
          style={{
            background: '#EDEBE6',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#111111',
          }}
        >
          <strong>Nota contable:</strong> {ejercicio.nota}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {onSaltar && (
          <button type="button" className="btn-sec" onClick={onSaltar}>
            Siguiente (+2 XP)
          </button>
        )}
        <button type="button" className="btn" onClick={onAhoraTu}>
          Entendido, ahora tú →
        </button>
      </div>
    </section>
  );
}

export interface ItemComparacion {
  etiqueta: string;
  dada: string;
  correcta: string;
  ok: boolean;
}

export interface FeedbackPanelProps {
  ok: boolean;
  puntos: number;
  titulo?: string;
  correccionAsiento?: ResultadoCorreccion;
  comparaciones?: ItemComparacion[];
  explicaciones?: string[];
  nota?: string;
  esUltimo: boolean;
  onSiguiente: () => void;
}

export function FeedbackPanel({
  ok,
  puntos,
  titulo,
  correccionAsiento,
  comparaciones,
  explicaciones,
  nota,
  esUltimo,
  onSiguiente,
}: FeedbackPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) {
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onSiguiente();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSiguiente]);

  const pct = Math.round(puntos * 100);
  const bg = ok
    ? 'rgba(16, 185, 129, 0.12)'
    : puntos >= 0.5
      ? 'rgba(245, 158, 11, 0.13)'
      : 'rgba(239, 68, 68, 0.11)';
  const fg = ok ? '#065F46' : puntos >= 0.5 ? '#92400E' : '#991B1B';

  return (
    <section
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        border: `1px solid ${ok ? 'rgba(16,185,129,0.28)' : 'rgba(0,0,0,0.08)'}`,
      }}
      aria-live="polite"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 14,
          background: bg,
          color: fg,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {titulo ?? (ok ? '✓ Respuesta correcta' : 'Revisa la solución')}
        </span>
        <span className="chip tabular-nums" style={{ background: '#FFFFFF', color: fg }}>
          {pct} %
        </span>
      </div>

      {correccionAsiento && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {correccionAsiento.lineas.map((l, idx) => {
            const colorEstado =
              l.estado === 'ok'
                ? '#065F46'
                : l.estado === 'importe'
                  ? '#92400E'
                  : '#991B1B';
            const cuenta = l.esperada?.c || l.dada?.c || '—';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  fontSize: 13,
                  padding: '8px 10px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.72)',
                  color: colorEstado,
                }}
              >
                <span>
                  <strong className="tabular-nums">{cuenta}</strong> {PGC.nombre(cuenta)}
                </span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{l.mensaje}</span>
              </div>
            );
          })}
        </div>
      )}

      {comparaciones && comparaciones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comparaciones.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                padding: '8px 12px',
                borderRadius: 12,
                background: item.ok
                  ? 'rgba(16, 185, 129, 0.09)'
                  : 'rgba(239, 68, 68, 0.09)',
                color: item.ok ? '#065F46' : '#991B1B',
              }}
            >
              <span>{item.etiqueta}</span>
              <span className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
                {item.ok ? `✓ ${item.correcta}` : `${item.dada || '—'} → ${item.correcta}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {explicaciones && explicaciones.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: 13,
            color: '#6B6B6B',
            lineHeight: 1.45,
          }}
        >
          {explicaciones.map((txt, idx) => (
            <div key={idx}>· {txt}</div>
          ))}
        </div>
      )}

      {nota && (
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
          <strong>Nota:</strong> {nota}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onSiguiente} autoFocus>
          {esUltimo ? 'Ver resumen' : 'Siguiente →'}
        </button>
      </div>
    </section>
  );
}

export interface GameSummaryProps {
  titulo: string;
  tema: TemaId;
  aciertos: number;
  total: number;
  xp: number;
  bonusPerfecto?: number;
  segundos: number;
  onRepetir: () => void;
  onOtraTematica: () => void;
  onVolver: () => void;
}

export function GameSummary({
  titulo,
  tema,
  aciertos,
  total,
  xp,
  bonusPerfecto = 0,
  segundos,
  onRepetir,
  onOtraTematica,
  onVolver,
}: GameSummaryProps) {
  const temaInfo = getTema(tema);
  const ratio = total > 0 ? aciertos / total : 0;
  const estado: MascotEstado = ratio >= 0.7 ? 'feliz' : ratio >= 0.4 ? 'pensando' : 'triste';

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span className="label">Partida completada</span>
          <h2 className="card-title" style={{ fontSize: 18, marginTop: 4 }}>
            {titulo}
          </h2>
          <p className="card-subtitle">{temaInfo.nombre}</p>
        </div>

        <Mascot color={temaInfo.color} estado={estado} size={64} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.68)',
            borderRadius: 16,
            padding: '14px 14px',
          }}
        >
          <div className="label">Aciertos</div>
          <div className="big-num" style={{ fontSize: 'clamp(28px, 7.5vw, 42px)', marginTop: 4 }}>
            {aciertos}/{total}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.68)',
            borderRadius: 16,
            padding: '14px 14px',
          }}
        >
          <div className="label">XP ganados</div>
          <div className="big-num" style={{ fontSize: 'clamp(28px, 7.5vw, 42px)', marginTop: 4 }}>
            +{xp}
          </div>
          {bonusPerfecto > 0 && (
            <span className="chip-dark" style={{ marginTop: 6, fontSize: 11 }}>
              +{bonusPerfecto} XP perfecta
            </span>
          )}
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.68)',
            borderRadius: 16,
            padding: '14px 14px',
          }}
        >
          <div className="label">Tiempo</div>
          <div className="big-num" style={{ fontSize: 'clamp(28px, 7.5vw, 42px)', marginTop: 4 }}>
            {formatCrono(segundos)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="btn" onClick={onRepetir}>
          Repetir
        </button>
        <button type="button" className="btn-sec" onClick={onOtraTematica}>
          Otra temática
        </button>
        <button type="button" className="btn-sec" onClick={onVolver}>
          Volver
        </button>
      </div>
    </section>
  );
}

export function SinContenidoCard({
  juegoNombre,
  temaNombre,
  onCambiarCompleto,
  onVolver,
}: {
  juegoNombre: string;
  temaNombre: string;
  onCambiarCompleto: () => void;
  onVolver: () => void;
}) {
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="card-title">{juegoNombre}</h2>
          <p className="card-subtitle">
            La temática «{temaNombre}» no tiene secuencias específicas para este juego.
          </p>
        </div>
        <span className="chip">Sin contenido</span>
      </div>

      <p style={{ margin: 0, fontSize: 13.5, color: '#6B6B6B', lineHeight: 1.5 }}>
        Cambia a «Examen completo» para practicar todas las secuencias disponibles o elige otro minijuego.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={onCambiarCompleto}>
          Usar Examen completo
        </button>
        <button type="button" className="btn-sec" onClick={onVolver}>
          Volver al menú
        </button>
      </div>
    </section>
  );
}
