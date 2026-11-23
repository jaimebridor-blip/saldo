export type MasaBalance =
  | 'ANC'
  | 'Existencias y deudores'
  | 'Inversiones y efectivo'
  | 'PN'
  | 'Pasivo no corriente'
  | 'Pasivo corriente'
  | 'Gasto'
  | 'Ingreso';

export const MAPA_PYG: Record<string, number> = {
  '700': 1,
  '706': 1,
  '708': 1,
  '709': 1,
  '600': 4,
  '606': 4,
  '608': 4,
  '609': 4,
  '610': 4,
  '693': 4,
  '793': 4,
  '752': 5,
  '640': 6,
  '642': 6,
  '621': 7,
  '622': 7,
  '623': 7,
  '624': 7,
  '625': 7,
  '626': 7,
  '627': 7,
  '628': 7,
  '629': 7,
  '631': 7,
  '650': 7,
  '694': 7,
  '794': 7,
  '678': 7,
  '681': 8,
  '795': 10,
  '671': 11,
  '771': 11,
  '691': 11,
  '791': 11,
  '760': 12,
  '761': 12,
  '662': 13,
  '630': 17,
};

export interface FilaModeloPyG {
  tipo: 'linea' | 'subtotal';
  clave: string;
  numLinea?: number;
  etiqueta: string;
}

export const MODELO_PYG_PYMES: FilaModeloPyG[] = [
  { tipo: 'linea', clave: '1', numLinea: 1, etiqueta: '1. Importe neto de la cifra de negocios' },
  { tipo: 'linea', clave: '2', numLinea: 2, etiqueta: '2. Variación de existencias de prod. terminados y en curso' },
  { tipo: 'linea', clave: '3', numLinea: 3, etiqueta: '3. Trabajos realizados por la empresa para su activo' },
  { tipo: 'linea', clave: '4', numLinea: 4, etiqueta: '4. Aprovisionamientos' },
  { tipo: 'linea', clave: '5', numLinea: 5, etiqueta: '5. Otros ingresos de explotación' },
  { tipo: 'linea', clave: '6', numLinea: 6, etiqueta: '6. Gastos de personal' },
  { tipo: 'linea', clave: '7', numLinea: 7, etiqueta: '7. Otros gastos de explotación' },
  { tipo: 'linea', clave: '8', numLinea: 8, etiqueta: '8. Amortización del inmovilizado' },
  { tipo: 'linea', clave: '9', numLinea: 9, etiqueta: '9. Imputación de subvenciones de inmovilizado no financiero' },
  { tipo: 'linea', clave: '10', numLinea: 10, etiqueta: '10. Excesos de provisiones' },
  { tipo: 'linea', clave: '11', numLinea: 11, etiqueta: '11. Deterioro y resultado por enajenaciones del inmovilizado' },
  { tipo: 'subtotal', clave: 'A', etiqueta: 'A) Resultado de explotación (1 a 11)' },
  { tipo: 'linea', clave: '12', numLinea: 12, etiqueta: '12. Ingresos financieros' },
  { tipo: 'linea', clave: '13', numLinea: 13, etiqueta: '13. Gastos financieros' },
  { tipo: 'linea', clave: '14', numLinea: 14, etiqueta: '14. Variación de valor razonable en instrumentos financieros' },
  { tipo: 'linea', clave: '15', numLinea: 15, etiqueta: '15. Diferencias de cambio' },
  { tipo: 'linea', clave: '16', numLinea: 16, etiqueta: '16. Deterioro y resultado por enajenaciones de instr. financieros' },
  { tipo: 'subtotal', clave: 'B', etiqueta: 'B) Resultado financiero (12 a 16)' },
  { tipo: 'subtotal', clave: 'C', etiqueta: 'C) Resultado antes de impuestos (A + B)' },
  { tipo: 'linea', clave: '17', numLinea: 17, etiqueta: '17. Impuestos sobre beneficios' },
  { tipo: 'subtotal', clave: 'D', etiqueta: 'D) Resultado del ejercicio (C + 17)' },
];

const CUENTAS_ANC = new Set([
  '210',
  '211',
  '213',
  '216',
  '218',
  '260',
  '281',
  '291',
]);

const CUENTAS_EXIST_DEUD = new Set([
  '300',
  '390',
  '430',
  '436',
  '473',
  '480',
  '4700',
  '472',
  '490',
]);

const CUENTAS_INV_EFEC = new Set(['540', '541', '565', '570', '572']);

const CUENTAS_PN = new Set(['100', '110', '113', '120', '121', '129']);

const CUENTAS_PNC = new Set(['141', '142', '170', '180']);

const CUENTAS_PC = new Set([
  '400',
  '410',
  '465',
  '476',
  '477',
  '4750',
  '4751',
  '4752',
  '485',
  '520',
  '529',
]);

function r2(x: number): number {
  return Math.round(x * 100) / 100;
}

export interface ResumenPyG {
  lineas: Record<number, number>;
  A: number;
  B: number;
  C: number;
  impuesto: number;
  D: number;
}

export interface ResumenBalance {
  anc: number;
  ac: number;
  activo: number;
  pn: number;
  pnc: number;
  pc: number;
  pasivo: number;
  pnYPasivo: number;
  resultado: number;
  ivaNeto: number;
}

export const Masas = {
  pygLinea(n: string): number | null {
    const c = String(n).trim();
    return MAPA_PYG[c] ?? null;
  },

  de(n: string): MasaBalance {
    const c = String(n).trim();
    if (
      CUENTAS_ANC.has(c) ||
      c.startsWith('20') ||
      c.startsWith('21') ||
      c.startsWith('22') ||
      c.startsWith('25') ||
      c.startsWith('26') ||
      c.startsWith('28') ||
      c.startsWith('29')
    ) {
      return 'ANC';
    }
    if (
      CUENTAS_EXIST_DEUD.has(c) ||
      /^3[0-9]/.test(c) ||
      c.startsWith('43') ||
      c.startsWith('44') ||
      c.startsWith('470') ||
      c.startsWith('472') ||
      c.startsWith('473') ||
      c.startsWith('480') ||
      c.startsWith('49')
    ) {
      return 'Existencias y deudores';
    }
    if (
      CUENTAS_INV_EFEC.has(c) ||
      c.startsWith('54') ||
      c.startsWith('565') ||
      c.startsWith('57')
    ) {
      return 'Inversiones y efectivo';
    }
    if (CUENTAS_PN.has(c) || /^1[0-3][0-9]$/.test(c)) {
      return 'PN';
    }
    if (CUENTAS_PNC.has(c) || c.startsWith('14') || c.startsWith('17') || c.startsWith('18')) {
      return 'Pasivo no corriente';
    }
    if (
      CUENTAS_PC.has(c) ||
      c.startsWith('40') ||
      c.startsWith('41') ||
      c.startsWith('46') ||
      c.startsWith('475') ||
      c.startsWith('476') ||
      c.startsWith('477') ||
      c.startsWith('485') ||
      c.startsWith('52')
    ) {
      return 'Pasivo corriente';
    }
    if (c.startsWith('6')) {
      return 'Gasto';
    }
    if (c.startsWith('7')) {
      return 'Ingreso';
    }
    return 'Existencias y deudores';
  },

  pyg(saldos: Record<string, number>): ResumenPyG {
    const lineas: Record<number, number> = {};
    for (let i = 1; i <= 17; i++) {
      lineas[i] = 0;
    }

    for (const [c, saldoDebeMenosHaber] of Object.entries(saldos)) {
      const linea = MAPA_PYG[c];
      if (!linea) {
        continue;
      }
      lineas[linea] = r2((lineas[linea] ?? 0) - saldoDebeMenosHaber);
    }

    let A = 0;
    for (let i = 1; i <= 11; i++) {
      A = r2(A + (lineas[i] ?? 0));
    }

    let B = 0;
    for (let i = 12; i <= 16; i++) {
      B = r2(B + (lineas[i] ?? 0));
    }

    const C = r2(A + B);
    const impuesto = lineas[17] ?? 0;
    const D = r2(C + impuesto);

    return { lineas, A, B, C, impuesto, D };
  },

  balance(saldos: Record<string, number>): ResumenBalance {
    let anc = 0;
    let ac = 0;
    let pn = 0;
    let pnc = 0;
    let pc = 0;
    let resultadoAbierto = 0;

    const s472 = saldos['472'] ?? 0;
    const s477 = saldos['477'] ?? 0;
    const ivaNeto = r2(s472 + s477);

    for (const [c, saldo] of Object.entries(saldos)) {
      if (c === '472' || c === '477') {
        continue;
      }
      const masa = Masas.de(c);
      if (masa === 'ANC') {
        anc = r2(anc + saldo);
      } else if (masa === 'Existencias y deudores' || masa === 'Inversiones y efectivo') {
        ac = r2(ac + saldo);
      } else if (masa === 'PN') {
        pn = r2(pn - saldo);
      } else if (masa === 'Pasivo no corriente') {
        pnc = r2(pnc - saldo);
      } else if (masa === 'Pasivo corriente') {
        pc = r2(pc - saldo);
      } else if (masa === 'Gasto' || masa === 'Ingreso') {
        resultadoAbierto = r2(resultadoAbierto - saldo);
      }
    }

    if (ivaNeto > 0) {
      ac = r2(ac + ivaNeto);
    } else if (ivaNeto < 0) {
      pc = r2(pc - ivaNeto);
    }

    pn = r2(pn + resultadoAbierto);
    const activo = r2(anc + ac);
    const pasivo = r2(pnc + pc);
    const pnYPasivo = r2(pn + pasivo);

    return {
      anc,
      ac,
      activo,
      pn,
      pnc,
      pc,
      pasivo,
      pnYPasivo,
      resultado: resultadoAbierto,
      ivaNeto,
    };
  },
};
