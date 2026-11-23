import { NATURALEZA_LABEL, PGC, type CuentaPGC } from '../data/pgc';
import { Fmt } from './fmt';
import type { Asiento, Linea, SaldoInicial } from './types';

const TOL = 0.01;

function diffDentroTolerancia(a: number, b: number): boolean {
  return Math.round(Math.abs(a - b) * 10000) / 10000 <= TOL;
}

export interface ValidacionResultado {
  ok: boolean;
  errores: string[];
}

export type EstadoLineaCorreccion =
  | 'ok'
  | 'importe'
  | 'lado'
  | 'falta'
  | 'sobra';

export interface LineaDadaCorreccion extends Linea {
  indices?: number[];
}

export interface LineaCorreccion {
  estado: EstadoLineaCorreccion;
  esperada: Linea | null;
  dada: LineaDadaCorreccion | null;
  mensaje: string;
}

export interface ResultadoCorreccion {
  puntos: number;
  ok: boolean;
  cuadra: boolean;
  lineas: LineaCorreccion[];
}

export interface FilaSumasYSaldos {
  c: string;
  nombre: string;
  sumasDebe: number;
  sumasHaber: number;
  saldoDeudor: number;
  saldoAcreedor: number;
  saldo: number;
}

function extraerLineas(entrada: Asiento | Linea[]): Linea[] {
  return Array.isArray(entrada) ? entrada : entrada.lineas;
}

function descripcionCortaLado(cuenta: CuentaPGC | undefined, ladoEsperado: 'D' | 'H'): string {
  if (!cuenta) {
    return ladoEsperado === 'D' ? 'corresponde al Debe' : 'corresponde al Haber';
  }
  const nom = cuenta.nombre.toLowerCase();
  if (cuenta.n === '472') {
    return 'el IVA soportado es un activo';
  }
  if (cuenta.n === '477') {
    return 'el IVA repercutido es un pasivo';
  }
  if (cuenta.n === '400') {
    return 'los proveedores son un pasivo que aumenta en el Haber';
  }
  if (cuenta.n === '430') {
    return 'los clientes son un activo que aumenta en el Debe';
  }

  switch (cuenta.nat) {
    case 'A':
      if (cuenta.inv) {
        return ladoEsperado === 'H'
          ? `${nom} tiene sentido inverso y aumenta en el Haber`
          : `${nom} tiene sentido inverso y se reduce en el Debe`;
      }
      return ladoEsperado === 'D'
        ? `${nom} es un activo y aumenta en el Debe`
        : `${nom} es un activo y disminuye en el Haber`;
    case 'P':
      return ladoEsperado === 'H'
        ? `${nom} es un pasivo y aumenta en el Haber`
        : `${nom} es un pasivo y disminuye en el Debe`;
    case 'PN':
      if (cuenta.inv) {
        return ladoEsperado === 'D'
          ? `${nom} es patrimonio neto negativo y aumenta en el Debe`
          : `${nom} es patrimonio neto negativo y se reduce en el Haber`;
      }
      return ladoEsperado === 'H'
        ? `${nom} es patrimonio neto y aumenta en el Haber`
        : `${nom} es patrimonio neto y disminuye en el Debe`;
    case 'G':
      if (cuenta.inv) {
        return ladoEsperado === 'H'
          ? `${nom} reduce un gasto (sentido inverso) y va al Haber`
          : `${nom} es un gasto de sentido inverso y se regulariza en el Debe`;
      }
      return ladoEsperado === 'D'
        ? `${nom} es un gasto y los gastos aumentan en el Debe`
        : `${nom} es un gasto y se regulariza en el Haber`;
    case 'I':
      if (cuenta.inv) {
        return ladoEsperado === 'D'
          ? `${nom} reduce un ingreso (sentido inverso) y va al Debe`
          : `${nom} es un ingreso de sentido inverso y se regulariza en el Haber`;
      }
      return ladoEsperado === 'H'
        ? `${nom} es un ingreso y los ingresos aumentan en el Haber`
        : `${nom} es un ingreso y se regulariza en el Debe`;
    case 'M':
    default:
      return ladoEsperado === 'D'
        ? `${nom} recoge aquí un saldo deudor en el Debe`
        : `${nom} recoge aquí un saldo acreedor en el Haber`;
  }
}

function explicarAutomatica(linea: Linea): string {
  const c = linea.c.trim();
  const cuenta = PGC.get(c);
  const esDebe = linea.d > 0 && linea.h === 0;
  const esHaber = linea.h > 0 && linea.d === 0;
  const accion = esDebe ? `Se carga la ${c}` : esHaber ? `Se abona la ${c}` : `Cuenta ${c}`;

  if (linea.por && linea.por.trim()) {
    return `${accion}: ${linea.por.trim()}`;
  }

  if (!cuenta) {
    return `${accion}: movimiento contable de ${Fmt.eur(esDebe ? linea.d : linea.h)}.`;
  }

  if (cuenta.nat === 'M') {
    return esDebe
      ? `${accion}: variación de existencias con saldo deudor (disminuyen las existencias finales frente a las iniciales).`
      : `${accion}: variación de existencias con saldo acreedor (aumentan las existencias finales frente a las iniciales).`;
  }

  if (cuenta.nat === 'G' && !cuenta.inv) {
    return esDebe
      ? `${accion}: ${cuenta.nombre.toLowerCase()} es un gasto y los gastos aumentan en el Debe.`
      : `${accion}: ${cuenta.nombre.toLowerCase()} es un gasto y se abona al regularizar o corregir.`;
  }

  if (cuenta.nat === 'G' && cuenta.inv) {
    return esHaber
      ? `${accion}: ${cuenta.nombre.toLowerCase()} reduce el gasto de compras (sentido inverso, va al Haber).`
      : `${accion}: ${cuenta.nombre.toLowerCase()} es una cuenta de gasto de sentido inverso y se carga en el Debe al regularizar.`;
  }

  if (cuenta.nat === 'I' && !cuenta.inv) {
    return esHaber
      ? `${accion}: ${cuenta.nombre.toLowerCase()} es un ingreso y los ingresos aumentan en el Haber.`
      : `${accion}: ${cuenta.nombre.toLowerCase()} es un ingreso y se carga al regularizar o corregir.`;
  }

  if (cuenta.nat === 'I' && cuenta.inv) {
    return esDebe
      ? `${accion}: ${cuenta.nombre.toLowerCase()} reduce el ingreso por ventas (sentido inverso, va al Debe).`
      : `${accion}: ${cuenta.nombre.toLowerCase()} es una cuenta de ingreso de sentido inverso y se abona al regularizar.`;
  }

  const natLabel = NATURALEZA_LABEL[cuenta.nat].toLowerCase();
  if (cuenta.inv) {
    return esHaber
      ? `${accion}: es una cuenta de ${natLabel} con sentido inverso y aumenta en el Haber.`
      : `${accion}: es una cuenta de ${natLabel} con sentido inverso y disminuye en el Debe.`;
  }

  const lado = esDebe ? 'Debe' : 'Haber';
  const verbo =
    (cuenta.nat === 'A' && esDebe) ||
    ((cuenta.nat === 'P' || cuenta.nat === 'PN') && esHaber)
      ? 'aumenta'
      : 'disminuye';

  return `${accion}: es una cuenta de ${natLabel} y ${verbo} en el ${lado}.`;
}

interface LineaNormalizada {
  c: string;
  lado: 'D' | 'H';
  importe: number;
  linea: Linea;
  indices: number[];
}

function fusionarLineasRespuesta(lineas: Linea[]): LineaNormalizada[] {
  const mapa = new Map<string, LineaNormalizada>();

  lineas.forEach((raw, idx) => {
    const c = String(raw.c ?? '').trim();
    const d = Number(raw.d) || 0;
    const h = Number(raw.h) || 0;
    if (!c && d === 0 && h === 0) {
      return;
    }

    const agregar = (lado: 'D' | 'H', importe: number) => {
      const key = `${c}__${lado}`;
      const prev = mapa.get(key);
      if (prev) {
        prev.importe = Math.round((prev.importe + importe) * 100) / 100;
        prev.linea = {
          c,
          d: lado === 'D' ? prev.importe : 0,
          h: lado === 'H' ? prev.importe : 0,
        };
        prev.indices.push(idx);
      } else {
        mapa.set(key, {
          c,
          lado,
          importe: Math.round(importe * 100) / 100,
          linea: {
            c,
            d: lado === 'D' ? importe : 0,
            h: lado === 'H' ? importe : 0,
          },
          indices: [idx],
        });
      }
    };

    if (d > 0) {
      agregar('D', d);
    }
    if (h > 0) {
      agregar('H', h);
    }
    if (d === 0 && h === 0 && c) {
      agregar('D', 0);
    }
  });

  return Array.from(mapa.values());
}

function normalizarSolucion(lineas: Linea[]): LineaNormalizada[] {
  const out: LineaNormalizada[] = [];
  lineas.forEach((l, idx) => {
    const c = String(l.c ?? '').trim();
    const d = Number(l.d) || 0;
    const h = Number(l.h) || 0;
    if (d > 0) {
      out.push({
        c,
        lado: 'D',
        importe: Math.round(d * 100) / 100,
        linea: { ...l, c, d, h: 0 },
        indices: [idx],
      });
    } else if (h > 0) {
      out.push({
        c,
        lado: 'H',
        importe: Math.round(h * 100) / 100,
        linea: { ...l, c, d: 0, h },
        indices: [idx],
      });
    }
  });
  return out;
}

export const Engine = {
  validar(entrada: Asiento | Linea[]): ValidacionResultado {
    const lineas = extraerLineas(entrada);
    const errores: string[] = [];

    if (lineas.length === 0) {
      errores.push('El asiento no tiene líneas.');
      return { ok: false, errores };
    }

    let totalD = 0;
    let totalH = 0;

    lineas.forEach((l, i) => {
      const numLinea = i + 1;
      const cuenta = String(l.c ?? '').trim();
      const d = Number(l.d);
      const h = Number(l.h);

      if (!cuenta) {
        errores.push(`Línea ${numLinea}: falta el código de cuenta.`);
      } else if (!PGC.get(cuenta)) {
        errores.push(`Línea ${numLinea}: la cuenta ${cuenta} no existe en el PGC.`);
      }

      if (!Number.isFinite(d) || !Number.isFinite(h)) {
        errores.push(`Línea ${numLinea}: importe no válido.`);
        return;
      }

      if (d < 0 || h < 0) {
        errores.push(`Línea ${numLinea}: no se permiten importes negativos.`);
      }

      if (d > 0 && h > 0) {
        errores.push(
          `Línea ${numLinea}: una línea no puede tener Debe y Haber a la vez.`
        );
      }

      if (d === 0 && h === 0) {
        errores.push(`Línea ${numLinea}: indica un importe en Debe o en Haber.`);
      }

      totalD += Math.max(0, d);
      totalH += Math.max(0, h);
    });

    if (!diffDentroTolerancia(totalD, totalH)) {
      errores.push(
        `El asiento no cuadra: Debe ${Fmt.eur(totalD)} frente a Haber ${Fmt.eur(totalH)}.`
      );
    }

    return { ok: errores.length === 0, errores };
  },

  corregir(
    solucion: Asiento | Linea[],
    respuesta: Asiento | Linea[]
  ): ResultadoCorreccion {
    const solRaw = extraerLineas(solucion);
    const respRaw = extraerLineas(respuesta);

    const solNorm = normalizarSolucion(solRaw);
    const respFusionada = fusionarLineasRespuesta(respRaw);

    let totalRespD = 0;
    let totalRespH = 0;
    for (const l of respRaw) {
      totalRespD += Math.max(0, Number(l.d) || 0);
      totalRespH += Math.max(0, Number(l.h) || 0);
    }
    const cuadra =
      totalRespD > 0 && diffDentroTolerancia(totalRespD, totalRespH);

    const solEmparejada = new Set<number>();
    const respEmparejada = new Set<number>();
    const resultadoLineas: LineaCorreccion[] = [];

    // 1) Emparejar por misma cuenta y mismo lado
    solNorm.forEach((s, si) => {
      const ri = respFusionada.findIndex(
        (r, idx) => !respEmparejada.has(idx) && r.c === s.c && r.lado === s.lado
      );
      if (ri >= 0) {
        solEmparejada.add(si);
        respEmparejada.add(ri);
        const r = respFusionada[ri];
        const dada: LineaDadaCorreccion = { ...r.linea, indices: r.indices };
        if (diffDentroTolerancia(s.importe, r.importe)) {
          resultadoLineas.push({
            estado: 'ok',
            esperada: s.linea,
            dada,
            mensaje: '✓ Correcta',
          });
        } else {
          resultadoLineas.push({
            estado: 'importe',
            esperada: s.linea,
            dada,
            mensaje: `Importe: esperabas ${Fmt.eur(s.importe)}`,
          });
        }
      }
    });

    // 2) Emparejar por misma cuenta en el lado contrario
    solNorm.forEach((s, si) => {
      if (solEmparejada.has(si)) {
        return;
      }
      const ri = respFusionada.findIndex(
        (r, idx) => !respEmparejada.has(idx) && r.c === s.c
      );
      if (ri >= 0) {
        solEmparejada.add(si);
        respEmparejada.add(ri);
        const r = respFusionada[ri];
        const dada: LineaDadaCorreccion = { ...r.linea, indices: r.indices };
        const nombreLado = s.lado === 'D' ? 'Debe' : 'Haber';
        const motivo = descripcionCortaLado(PGC.get(s.c), s.lado);
        resultadoLineas.push({
          estado: 'lado',
          esperada: s.linea,
          dada,
          mensaje: `La ${s.c} va al ${nombreLado}: ${motivo}`,
        });
      }
    });

    // 3) Líneas de la solución que faltan
    solNorm.forEach((s, si) => {
      if (solEmparejada.has(si)) {
        return;
      }
      const ladoTxt = s.lado === 'D' ? 'Debe' : 'Haber';
      resultadoLineas.push({
        estado: 'falta',
        esperada: s.linea,
        dada: null,
        mensaje: `Falta la cuenta ${s.c} (${Fmt.eur(s.importe)} al ${ladoTxt})`,
      });
    });

    // 4) Líneas de la respuesta que sobran
    respFusionada.forEach((r, ri) => {
      if (respEmparejada.has(ri)) {
        return;
      }
      const dada: LineaDadaCorreccion = { ...r.linea, indices: r.indices };
      resultadoLineas.push({
        estado: 'sobra',
        esperada: null,
        dada,
        mensaje: `Sobra la cuenta ${r.c || '(vacía)'}`,
      });
    });

    const okCount = resultadoLineas.filter((l) => l.estado === 'ok').length;
    const maxLineas = Math.max(solNorm.length, respFusionada.length, 1);
    const puntos = Math.round((okCount / maxLineas) * 1000) / 1000;
    const ok =
      okCount === solNorm.length &&
      respFusionada.length === solNorm.length &&
      cuadra;

    return {
      puntos,
      ok,
      cuadra,
      lineas: resultadoLineas,
    };
  },

  explicarLineas(asiento: Asiento): string[] {
    return asiento.lineas.map((l) => explicarAutomatica(l));
  },

  explicar(asiento: Asiento): string {
    return Engine.explicarLineas(asiento).join('\n');
  },

  mayorizar(
    asientos: Asiento[],
    inicial?: SaldoInicial[] | null
  ): Record<string, number> {
    const saldos: Record<string, number> = {};

    if (inicial) {
      for (const item of inicial) {
        const c = String(item.c).trim();
        if (!c) {
          continue;
        }
        saldos[c] =
          Math.round(((saldos[c] ?? 0) + (item.d || 0) - (item.h || 0)) * 100) /
          100;
      }
    }

    for (const asiento of asientos) {
      for (const l of asiento.lineas) {
        const c = String(l.c).trim();
        if (!c) {
          continue;
        }
        saldos[c] =
          Math.round(((saldos[c] ?? 0) + (l.d || 0) - (l.h || 0)) * 100) / 100;
      }
    }

    return saldos;
  },

  sumasYSaldos(
    asientos: Asiento[],
    inicial?: SaldoInicial[] | null
  ): FilaSumasYSaldos[] {
    const acc = new Map<string, { d: number; h: number }>();

    const sumar = (cRaw: string, dRaw: number, hRaw: number) => {
      const c = String(cRaw).trim();
      if (!c) {
        return;
      }
      const prev = acc.get(c) ?? { d: 0, h: 0 };
      prev.d = Math.round((prev.d + (Number(dRaw) || 0)) * 100) / 100;
      prev.h = Math.round((prev.h + (Number(hRaw) || 0)) * 100) / 100;
      acc.set(c, prev);
    };

    if (inicial) {
      for (const item of inicial) {
        sumar(item.c, item.d, item.h);
      }
    }

    for (const asiento of asientos) {
      for (const l of asiento.lineas) {
        sumar(l.c, l.d, l.h);
      }
    }

    return Array.from(acc.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([c, { d, h }]) => {
        const saldo = Math.round((d - h) * 100) / 100;
        return {
          c,
          nombre: PGC.nombre(c) || `Cuenta ${c}`,
          sumasDebe: d,
          sumasHaber: h,
          saldoDeudor: saldo > 0 ? saldo : 0,
          saldoAcreedor: saldo < 0 ? Math.abs(saldo) : 0,
          saldo,
        };
      });
  },
};
