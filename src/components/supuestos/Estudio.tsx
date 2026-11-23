import React, { useMemo } from 'react';
import { PGC } from '../../data/pgc';
import { getTema } from '../../data/temas';
import { calcularSolucionReferencia } from '../../lib/correccion';
import { Engine } from '../../lib/engine';
import { Fmt } from '../../lib/fmt';
import type { Ejercicio } from '../../lib/types';
import { MayorVista } from '../MayorVista';
import { TablaBalanceResuelto, TablaPyGResuelta } from './PyGBalance';

export interface EstudioSupuestoProps {
  ejercicio: Ejercicio;
  onAhoraTu: () => void;
  onVolver: () => void;
}

export function EstudioSupuesto({
  ejercicio,
  onAhoraTu,
  onVolver,
}: EstudioSupuestoProps) {
  const temaInfo = getTema(ejercicio.tema);

  const { pyg, balance } = useMemo(
    () => calcularSolucionReferencia(ejercicio),
    [ejercicio]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabecera del modo estudio */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="label">Modo Estudio · Supuesto resuelto</span>
            <h2 className="card-title" style={{ fontSize: 17, marginTop: 4 }}>
              {ejercicio.titulo}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="chip">{temaInfo.nombre}</span>
            <button type="button" className="btn-sec" onClick={onVolver}>
              ← Configuración
            </button>
            <button type="button" className="btn" onClick={onAhoraTu}>
              Ahora tú →
            </button>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#111111' }}>
          {ejercicio.enunciado}
        </p>

        {ejercicio.inicial && ejercicio.inicial.length > 0 && (
          <div
            style={{
              background: '#EDEBE6',
              borderRadius: 16,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span className="label">Saldos iniciales</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B6B6B', fontSize: 11 }}>
                    <th style={{ textAlign: 'left', padding: '5px 6px' }}>Cuenta</th>
                    <th style={{ textAlign: 'right', padding: '5px 6px' }}>Debe</th>
                    <th style={{ textAlign: 'right', padding: '5px 6px' }}>Haber</th>
                  </tr>
                </thead>
                <tbody>
                  {ejercicio.inicial.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '6px 6px' }}>
                        <strong className="tabular-nums">{s.c}</strong>{' '}
                        <span style={{ color: '#6B6B6B' }}>{PGC.nombre(s.c)}</span>
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', padding: '6px 6px' }}>
                        {s.d > 0 ? Fmt.eur(s.d) : '—'}
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', padding: '6px 6px' }}>
                        {s.h > 0 ? Fmt.eur(s.h) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {ejercicio.nota && (
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <strong>Criterio del supuesto:</strong> {ejercicio.nota}
          </div>
        )}
      </section>

      {/* Operaciones y asientos explicados */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="card-title">Asientos del Libro Diario</h3>
            <p className="card-subtitle">
              Cada operación resuelta y razonada cuenta a cuenta.
            </p>
          </div>
          <span className="chip-dark tabular-nums">
            {ejercicio.asientos.length} {ejercicio.asientos.length === 1 ? 'asiento' : 'asientos'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ejercicio.asientos.map((asiento, idx) => {
            const explicacion = Engine.explicar(asiento).split('\n').filter(Boolean);
            return (
              <div
                key={idx}
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
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>
                    Operación {idx + 1} · {asiento.concepto}
                  </span>
                  <span className="chip tabular-nums" style={{ fontSize: 11.5 }}>
                    {asiento.fecha}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B6B6B', fontSize: 11 }}>
                        <th style={{ textAlign: 'left', padding: '6px 6px' }}>Cuenta</th>
                        <th style={{ textAlign: 'right', padding: '6px 6px' }}>Debe</th>
                        <th style={{ textAlign: 'right', padding: '6px 6px' }}>Haber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asiento.lineas.map((l, lIdx) => (
                        <tr key={lIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '7px 6px' }}>
                            <strong className="tabular-nums">{l.c}</strong>{' '}
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

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontSize: 12.5,
                    color: '#6B6B6B',
                    lineHeight: 1.45,
                  }}
                >
                  {explicacion.map((lineaTxt, eIdx) => (
                    <div key={eIdx}>· {lineaTxt}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Libro Mayor */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="card-title">Libro Mayor de las cuentas implicadas</h3>
            <p className="card-subtitle">Saldos finales acumulados tras todas las operaciones.</p>
          </div>
          <span className="chip">Mayor</span>
        </div>

        <MayorVista asientos={ejercicio.asientos} inicial={ejercicio.inicial} />
      </section>

      {/* PyG y Balance */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="card-title">Cuentas anuales de cierre</h3>
            <p className="card-subtitle">
              Calculadas desde el Libro Mayor según el mapa PyG y masas del Balance.
            </p>
          </div>
          <span className="chip-dark">PyG + Balance</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          <TablaPyGResuelta pyg={pyg} soloNoCero />
          <TablaBalanceResuelto balance={balance} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
          <button type="button" className="btn-sec" onClick={onVolver}>
            ← Volver a configuración
          </button>
          <button type="button" className="btn" onClick={onAhoraTu}>
            Ahora tú (otro supuesto) →
          </button>
        </div>
      </section>
    </div>
  );
}
