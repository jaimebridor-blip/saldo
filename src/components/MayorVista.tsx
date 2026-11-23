import React from 'react';
import { PGC } from '../data/pgc';
import { Fmt } from '../lib/fmt';
import type { Asiento, SaldoInicial } from '../lib/types';

export interface MayorVistaProps {
  asientos: Asiento[];
  inicial?: SaldoInicial[] | null;
}

interface CuentaMayor {
  c: string;
  nombre: string;
  debe: number[];
  haber: number[];
  totalD: number;
  totalH: number;
  saldo: number;
}

export function MayorVista({ asientos, inicial }: MayorVistaProps) {
  const mapa = new Map<string, CuentaMayor>();

  const obtener = (cRaw: string): CuentaMayor => {
    const c = String(cRaw).trim();
    const existente = mapa.get(c);
    if (existente) {
      return existente;
    }
    const nueva: CuentaMayor = {
      c,
      nombre: PGC.nombre(c) || `Cuenta ${c}`,
      debe: [],
      haber: [],
      totalD: 0,
      totalH: 0,
      saldo: 0,
    };
    mapa.set(c, nueva);
    return nueva;
  };

  if (inicial) {
    for (const item of inicial) {
      const c = String(item.c).trim();
      if (!c) {
        continue;
      }
      const cuenta = obtener(c);
      if (item.d > 0) {
        cuenta.debe.push(item.d);
        cuenta.totalD += item.d;
      }
      if (item.h > 0) {
        cuenta.haber.push(item.h);
        cuenta.totalH += item.h;
      }
    }
  }

  for (const asiento of asientos) {
    for (const l of asiento.lineas) {
      const c = String(l.c).trim();
      if (!c) {
        continue;
      }
      const cuenta = obtener(c);
      if (l.d > 0) {
        cuenta.debe.push(l.d);
        cuenta.totalD += l.d;
      }
      if (l.h > 0) {
        cuenta.haber.push(l.h);
        cuenta.totalH += l.h;
      }
    }
  }

  const cuentas = Array.from(mapa.values())
    .map((m) => ({
      ...m,
      totalD: Math.round(m.totalD * 100) / 100,
      totalH: Math.round(m.totalH * 100) / 100,
      saldo: Math.round((m.totalD - m.totalH) * 100) / 100,
    }))
    .sort((a, b) => a.c.localeCompare(b.c));

  if (cuentas.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: '#6B6B6B' }}>
        Sin movimientos en el libro mayor.
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 14,
      }}
    >
      {cuentas.map((m) => {
        const esSaldada = Math.abs(m.saldo) <= 0.01;
        const saldoTexto = esSaldada
          ? 'Saldada'
          : m.saldo > 0
          ? `Sd: ${Fmt.eur(m.saldo)}`
          : `Sa: ${Fmt.eur(Math.abs(m.saldo))}`;

        return (
          <div
            key={m.c}
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
            {/* Cabecera de la T */}
            <div
              style={{
                borderBottom: '1.5px solid #111111',
                paddingBottom: 6,
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
              }}
            >
              <span
                className="tabular-nums"
                style={{ fontSize: 13.5, fontWeight: 700, color: '#111111' }}
              >
                {m.c}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: '#6B6B6B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={m.nombre}
              >
                {m.nombre}
              </span>
            </div>

            {/* Brazos Debe / Haber */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                fontSize: 12.5,
                minHeight: 54,
              }}
            >
              <div
                style={{
                  borderRight: '1.5px solid #111111',
                  paddingRight: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <span className="label" style={{ fontSize: 10 }}>
                  Debe
                </span>
                {m.debe.length === 0 ? (
                  <span style={{ color: '#595959' }}>—</span>
                ) : (
                  m.debe.map((val, idx) => (
                    <span
                      key={idx}
                      className="tabular-nums"
                      style={{ color: '#111111' }}
                    >
                      {Fmt.num(val)}
                    </span>
                  ))
                )}
              </div>

              <div
                style={{
                  paddingLeft: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 3,
                }}
              >
                <span className="label" style={{ fontSize: 10 }}>
                  Haber
                </span>
                {m.haber.length === 0 ? (
                  <span style={{ color: '#595959' }}>—</span>
                ) : (
                  m.haber.map((val, idx) => (
                    <span
                      key={idx}
                      className="tabular-nums"
                      style={{ color: '#111111' }}
                    >
                      {Fmt.num(val)}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Sumas y saldo */}
            <div
              style={{
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                paddingTop: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 11.5,
                color: '#6B6B6B',
              }}
            >
              <span className="tabular-nums">
                D {Fmt.num(m.totalD)} · H {Fmt.num(m.totalH)}
              </span>
              <span
                className={`${esSaldada ? 'chip' : 'chip-dark'} tabular-nums`}
                style={{ padding: '3px 9px', fontSize: 11 }}
              >
                {saldoTexto}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
