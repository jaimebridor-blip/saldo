import React from 'react';
import { getTema } from '../../data/temas';
import { Bank } from '../../lib/bank';
import { Fmt } from '../../lib/fmt';
import type { HistorialSupuestoItem } from '../../lib/store';
import { SelectorModo, SelectorTema, useUi } from '../Selectors';

export type OrigenSupuesto = 'banco' | 'gen' | 'ia';

export interface ConfigSupuestoProps {
  origen: OrigenSupuesto;
  onOrigen: (origen: OrigenSupuesto) => void;
  numOps: number;
  onNumOps: (n: number) => void;
  conCrono: boolean;
  onConCrono: (activo: boolean) => void;
  minutos: number;
  onMinutos: (min: number) => void;
  esExamenGlobal: boolean;
  tieneClaveIA: boolean;
  cargandoIA: boolean;
  aviso: string | null;
  ultimaNota: HistorialSupuestoItem | null;
  onEmpezar: () => void;
}

const OPCIONES_OPS = [4, 5, 6, 7, 8] as const;

export function ConfigSupuesto({
  origen,
  onOrigen,
  numOps,
  onNumOps,
  conCrono,
  onConCrono,
  minutos,
  onMinutos,
  esExamenGlobal,
  tieneClaveIA,
  cargandoIA,
  aviso,
  ultimaNota,
  onEmpezar,
}: ConfigSupuestoProps) {
  const { tema } = useUi();
  const temaInfo = getTema(tema);

  const hayBancoSupuesto =
    Bank.elegir(tema, { soloSupuestos: true }) !== null;

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="card-title">Configurar supuesto</h2>
          <p className="card-subtitle">
            Problema completo de empresa con asientos, PyG y Balance (nota sobre 5).
          </p>
        </div>

        {ultimaNota && (
          <span className="chip-dark tabular-nums">
            Última nota: {Fmt.num(ultimaNota.nota)} / 5
          </span>
        )}
      </div>

      {/* Selector de temática */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="label">Temática</span>
        <SelectorTema />
      </div>

      {/* Selector de modo o aviso si el modo global es Examen */}
      {esExamenGlobal ? (
        <div
          style={{
            background: '#EDEBE6',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 12.5,
            color: '#111111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span>
            <strong>Modo Examen activo:</strong> abre en Reto, con cronómetro obligatorio y sin ver soluciones hasta entregar.
          </span>
          <span className="chip-dark">Reto</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Modo</span>
          <SelectorModo />
        </div>
      )}

      {/* Número de operaciones y Origen */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Número de operaciones</span>
          <div className="segmented" role="tablist" aria-label="Número de operaciones">
            {OPCIONES_OPS.map((n) => {
              const activo = numOps === n;
              return (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  className={`segmented-btn tabular-nums ${activo ? 'is-active' : ''}`}
                  onClick={() => onNumOps(n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {origen === 'banco' && (
            <span style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.4 }}>
              {hayBancoSupuesto
                ? 'Los supuestos del banco fijo usan su número original de asientos (≥ 3).'
                : `El banco fijo no tiene un supuesto largo específico de «${temaInfo.nombre}»; se generará uno paramétrico de ${numOps} bloques.`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Origen del supuesto</span>
          <div className="segmented" role="tablist" aria-label="Origen del supuesto">
            <button
              type="button"
              role="tab"
              aria-selected={origen === 'banco'}
              className={`segmented-btn ${origen === 'banco' ? 'is-active' : ''}`}
              onClick={() => onOrigen('banco')}
            >
              Banco
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={origen === 'gen'}
              className={`segmented-btn ${origen === 'gen' ? 'is-active' : ''}`}
              onClick={() => onOrigen('gen')}
            >
              Generado
            </button>
            {tieneClaveIA && (
              <button
                type="button"
                role="tab"
                aria-selected={origen === 'ia'}
                className={`segmented-btn ${origen === 'ia' ? 'is-active' : ''}`}
                onClick={() => onOrigen('ia')}
              >
                IA nueva
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.4 }}>
            {origen === 'banco'
              ? tema === 'completo'
                ? 'Ejercicios integrales E23 o E24 del banco verificado.'
                : 'Ejercicios de Bank con 3 o más asientos.'
              : origen === 'gen'
                ? 'Generador paramétrico con empresa, fechas e importes infinitos.'
                : 'Genera un supuesto nuevo con tu clave gratuita (validado por el motor).'}
          </span>
        </div>
      </div>

      {/* Cronómetro */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          borderRadius: 16,
          padding: '12px 14px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label">Cronómetro (cuenta atrás)</span>
          <span style={{ fontSize: 13, color: '#6B6B6B' }}>
            {esExamenGlobal
              ? 'Obligatorio en modo Examen. Corrige automáticamente al terminar el tiempo.'
              : conCrono
                ? 'Cuenta atrás activa; al llegar a 00:00 se corrige lo contestado.'
                : 'Sin límite de tiempo (cronómetro de referencia en pausa).'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="segmented" role="tablist" aria-label="Activar cronómetro">
            <button
              type="button"
              role="tab"
              aria-selected={conCrono}
              className={`segmented-btn ${conCrono ? 'is-active' : ''}`}
              onClick={() => onConCrono(true)}
            >
              Activado
            </button>
            {!esExamenGlobal && (
              <button
                type="button"
                role="tab"
                aria-selected={!conCrono}
                className={`segmented-btn ${!conCrono ? 'is-active' : ''}`}
                onClick={() => onConCrono(false)}
              >
                Desactivado
              </button>
            )}
          </div>

          {(conCrono || esExamenGlobal) && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: '#111111',
              }}
            >
              <input
                type="number"
                min={5}
                max={180}
                className="field tabular-nums"
                style={{ width: 82, minHeight: 38, padding: '6px 10px', textAlign: 'right' }}
                value={minutos}
                aria-label="Duración en minutos"
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value) || 45);
                  onMinutos(Math.max(5, Math.min(180, v)));
                }}
              />
              <span style={{ color: '#6B6B6B', fontSize: 12.5 }}>min</span>
            </label>
          )}
        </div>
      </div>

      {aviso && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(245, 158, 11, 0.14)',
            color: '#92400E',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          {aviso}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn"
          disabled={cargandoIA}
          onClick={onEmpezar}
        >
          {cargandoIA
            ? 'Generando supuesto con IA...'
            : esExamenGlobal
              ? 'Iniciar Examen →'
              : 'Empezar →'}
        </button>
      </div>
    </section>
  );
}
