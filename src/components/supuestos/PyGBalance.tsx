import React, { useState } from 'react';
import {
  calcularSubtotalesPyG,
  CAMPOS_BALANCE,
  type RespuestaBalance,
  type RespuestaPyG,
} from '../../lib/correccion';
import { Fmt } from '../../lib/fmt';
import {
  MODELO_PYG_PYMES,
  type ResumenBalance,
  type ResumenPyG,
} from '../../lib/masas';

export function MiniPyGForm({
  valor,
  bloqueado = false,
  onChange,
}: {
  valor: RespuestaPyG;
  bloqueado?: boolean;
  onChange: (next: RespuestaPyG) => void;
}) {
  const [textos, setTextos] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (let i = 1; i <= 17; i++) {
      const n = valor[i] ?? 0;
      init[i] = n !== 0 ? Fmt.num(n) : '';
    }
    return init;
  });

  const subtotales = calcularSubtotalesPyG(valor);

  const actualizarLinea = (num: number, raw: string) => {
    setTextos((prev) => ({ ...prev, [num]: raw }));
    const parsed = Fmt.parse(raw);
    const numVal = Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
    onChange({
      ...valor,
      [num]: numVal,
    });
  };

  const alternarSigno = (num: number) => {
    const rawActual = textos[num] ?? '';
    const parsed = Fmt.parse(rawActual);
    if (Number.isFinite(parsed) && parsed !== 0) {
      const flipped = Math.round(-parsed * 100) / 100;
      setTextos((prev) => ({ ...prev, [num]: Fmt.num(flipped) }));
      onChange({
        ...valor,
        [num]: flipped,
      });
      return;
    }
    const limpio = rawActual.trim();
    const nuevoTexto = limpio.startsWith('-')
      ? limpio.slice(1)
      : `-${limpio}`;
    setTextos((prev) => ({ ...prev, [num]: nuevoTexto }));
  };

  const limpiar = () => {
    const emptyText: Record<number, string> = {};
    const emptyVal: RespuestaPyG = {};
    for (let i = 1; i <= 17; i++) {
      emptyText[i] = '';
      emptyVal[i] = 0;
    }
    setTextos(emptyText);
    onChange(emptyVal);
  };

  const valorSubtotal = (clave: string): number => {
    if (clave === 'A') return subtotales.A;
    if (clave === 'B') return subtotales.B;
    if (clave === 'C') return subtotales.C;
    return subtotales.D;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: '#6B6B6B', lineHeight: 1.45 }}>
          Modelo PYMES: introduce los <strong>ingresos en positivo</strong> y los{' '}
          <strong>gastos en negativo</strong> (ej. -12000). Las líneas que no apliquen quedan en 0.
        </p>

        <button
          type="button"
          className="btn-sec"
          disabled={bloqueado}
          style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
          onClick={limpiar}
        >
          Dejar todo en 0
        </button>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          borderRadius: 16,
          padding: '8px 12px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {MODELO_PYG_PYMES.map((fila) => {
          if (fila.tipo === 'subtotal') {
            const val = valorSubtotal(fila.clave);
            const esFinal = fila.clave === 'D';
            return (
              <div
                key={fila.clave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 12px',
                  margin: '4px 0',
                  borderRadius: 12,
                  background: esFinal ? '#111111' : '#EDEBE6',
                  color: esFinal ? '#FFFFFF' : '#111111',
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
              >
                <span>{fila.etiqueta}</span>
                <span className="tabular-nums">{Fmt.eur(val)}</span>
              </div>
            );
          }

          const num = fila.numLinea!;
          return (
            <div
              key={fila.clave}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '6px 4px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                flexWrap: 'wrap',
              }}
            >
              <label
                htmlFor={`pyg-linea-${num}`}
                style={{
                  flex: '1 1 220px',
                  fontSize: 13,
                  color: '#111111',
                  lineHeight: 1.35,
                }}
              >
                {fila.etiqueta}
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn-sec"
                  disabled={bloqueado}
                  onClick={() => alternarSigno(num)}
                  aria-label={`Cambiar signo de ${fila.etiqueta}`}
                  title="Cambiar signo (+/-)"
                  style={{
                    width: 44,
                    minWidth: 44,
                    minHeight: 44,
                    padding: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ±
                </button>
                <input
                  id={`pyg-linea-${num}`}
                  type="text"
                  inputMode="decimal"
                  className="field tabular-nums"
                  disabled={bloqueado}
                  placeholder="0"
                  value={textos[num] ?? ''}
                  aria-label={fila.etiqueta}
                  onFocus={(e) =>
                    e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
                  }
                  onChange={(e) => actualizarLinea(num, e.target.value)}
                  onBlur={() => {
                    const v = valor[num] ?? 0;
                    setTextos((prev) => ({
                      ...prev,
                      [num]: v !== 0 ? Fmt.num(v) : '',
                    }));
                  }}
                  style={{
                    width: 140,
                    minHeight: 44,
                    padding: '6px 12px',
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniBalanceForm({
  valor,
  bloqueado = false,
  onChange,
}: {
  valor: RespuestaBalance;
  bloqueado?: boolean;
  onChange: (next: RespuestaBalance) => void;
}) {
  const [textos, setTextos] = useState<Record<keyof RespuestaBalance, string>>(() => ({
    anc: valor.anc !== 0 ? Fmt.num(valor.anc) : '',
    ac: valor.ac !== 0 ? Fmt.num(valor.ac) : '',
    activo: valor.activo !== 0 ? Fmt.num(valor.activo) : '',
    pn: valor.pn !== 0 ? Fmt.num(valor.pn) : '',
    pnc: valor.pnc !== 0 ? Fmt.num(valor.pnc) : '',
    pc: valor.pc !== 0 ? Fmt.num(valor.pc) : '',
    pnYPasivo: valor.pnYPasivo !== 0 ? Fmt.num(valor.pnYPasivo) : '',
  }));

  const actualizarCampo = (clave: keyof RespuestaBalance, raw: string) => {
    setTextos((prev) => ({ ...prev, [clave]: raw }));
    const parsed = Fmt.parse(raw);
    const numVal = Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
    onChange({
      ...valor,
      [clave]: numVal,
    });
  };

  const camposActivo = CAMPOS_BALANCE.filter((c) => c.grupo === 'activo');
  const camposPasivo = CAMPOS_BALANCE.filter((c) => c.grupo === 'pasivo');

  const diffTotales = Math.abs((valor.activo || 0) - (valor.pnYPasivo || 0));
  const totalesCuadran = (valor.activo || 0) > 0 && diffTotales <= 0.01;

  const renderBloque = (
    titulo: string,
    campos: typeof CAMPOS_BALANCE
  ) => (
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
      <span className="label">{titulo}</span>
      {campos.map((campo) => (
        <div
          key={campo.clave}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: campo.esTotal ? '8px 10px' : '4px 0',
            borderRadius: campo.esTotal ? 12 : 0,
            background: campo.esTotal ? '#EDEBE6' : 'transparent',
            flexWrap: 'wrap',
          }}
        >
          <label
            htmlFor={`bal-${campo.clave}`}
            style={{
              flex: '1 1 170px',
              fontSize: 13.5,
              fontWeight: campo.esTotal ? 600 : 500,
              color: '#111111',
            }}
          >
            {campo.etiqueta}
          </label>
          <input
            id={`bal-${campo.clave}`}
            type="text"
            inputMode="decimal"
            className="field tabular-nums"
            disabled={bloqueado}
            placeholder="0"
            value={textos[campo.clave]}
            aria-label={campo.etiqueta}
            onFocus={(e) =>
              e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
            }
            onChange={(e) => actualizarCampo(campo.clave, e.target.value)}
            onBlur={() => {
              const v = valor[campo.clave] ?? 0;
              setTextos((prev) => ({
                ...prev,
                [campo.clave]: v !== 0 ? Fmt.num(v) : '',
              }));
            }}
            style={{
              width: 145,
              minHeight: 44,
              padding: '6px 12px',
              textAlign: 'right',
              background: campo.esTotal ? '#FFFFFF' : undefined,
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: '#6B6B6B', lineHeight: 1.45 }}>
          Completa las masas del Balance (el Patrimonio neto incluye el resultado del ejercicio).
        </p>

        <span className={totalesCuadran ? 'chip-dark tabular-nums' : 'chip tabular-nums'}>
          {totalesCuadran
            ? 'Activo = PN + Pasivo ✓'
            : `Diferencia totales: ${Fmt.eur(diffTotales)}`}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {renderBloque('Activo', camposActivo)}
        {renderBloque('Patrimonio neto y Pasivo', camposPasivo)}
      </div>
    </div>
  );
}

export function TablaPyGResuelta({
  pyg,
  soloNoCero = true,
}: {
  pyg: ResumenPyG;
  soloNoCero?: boolean;
}) {
  const filas = MODELO_PYG_PYMES.filter((fila) => {
    if (fila.tipo === 'subtotal') {
      return true;
    }
    if (!soloNoCero) {
      return true;
    }
    return Math.abs(pyg.lineas[fila.numLinea!] ?? 0) > 0.01;
  });

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderRadius: 16,
        padding: 14,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span className="label" style={{ marginBottom: 4 }}>
        Cuenta de Pérdidas y Ganancias (PYMES)
      </span>

      {filas.map((fila) => {
        if (fila.tipo === 'subtotal') {
          const val =
            fila.clave === 'A'
              ? pyg.A
              : fila.clave === 'B'
                ? pyg.B
                : fila.clave === 'C'
                  ? pyg.C
                  : pyg.D;
          const esFinal = fila.clave === 'D';
          return (
            <div
              key={fila.clave}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: esFinal ? '#111111' : '#EDEBE6',
                color: esFinal ? '#FFFFFF' : '#111111',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>{fila.etiqueta}</span>
              <span className="tabular-nums">{Fmt.eur(val)}</span>
            </div>
          );
        }

        const val = pyg.lineas[fila.numLinea!] ?? 0;
        return (
          <div
            key={fila.clave}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              padding: '5px 4px',
              fontSize: 13,
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ color: '#6B6B6B' }}>{fila.etiqueta}</span>
            <span className="tabular-nums" style={{ fontWeight: 600, color: '#111111' }}>
              {Fmt.eur(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TablaBalanceResuelto({ balance }: { balance: ResumenBalance }) {
  const filas: Array<{ etiqueta: string; valor: number; total?: boolean }> = [
    { etiqueta: 'Activo no corriente', valor: balance.anc },
    { etiqueta: 'Activo corriente', valor: balance.ac },
    { etiqueta: 'Total Activo', valor: balance.activo, total: true },
    { etiqueta: 'Patrimonio neto (incluye resultado)', valor: balance.pn },
    { etiqueta: 'Pasivo no corriente', valor: balance.pnc },
    { etiqueta: 'Pasivo corriente', valor: balance.pc },
    { etiqueta: 'Total PN y Pasivo', valor: balance.pnYPasivo, total: true },
  ];

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderRadius: 16,
        padding: 14,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span className="label" style={{ marginBottom: 4 }}>
        Balance de situación (masas patrimoniales)
      </span>

      {filas.map((f) => (
        <div
          key={f.etiqueta}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            padding: f.total ? '8px 10px' : '5px 4px',
            borderRadius: f.total ? 10 : 0,
            background: f.total ? '#EDEBE6' : 'transparent',
            borderBottom: f.total ? 'none' : '1px solid rgba(0,0,0,0.05)',
            fontSize: 13,
            fontWeight: f.total ? 600 : 500,
          }}
        >
          <span style={{ color: f.total ? '#111111' : '#6B6B6B' }}>{f.etiqueta}</span>
          <span className="tabular-nums" style={{ fontWeight: 600, color: '#111111' }}>
            {Fmt.eur(f.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}
