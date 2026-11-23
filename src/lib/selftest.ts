import { useSyncExternalStore } from 'react';
import { PGC, type NaturalezaPGC } from '../data/pgc';
import { Bank } from './bank';
import { Engine } from './engine';
import { Fmt } from './fmt';
import { Gen } from './gen';
import type { Asiento, Linea } from './types';

export interface BloqueSelftest {
  id: 'pgc' | 'bank' | 'gen' | 'engine' | 'fmt';
  nombre: string;
  ok: boolean;
  resumen: string;
  errores: string[];
}

export interface ResultadoSelftest {
  estado: 'pendiente' | 'ok' | 'error';
  ok: boolean;
  ejecutadoEn: number | null;
  duracionMs: number;
  bloques: BloqueSelftest[];
  plantillasDesactivadas: string[];
}

const CUENTAS_INVERSAS_ESPERADAS = [
  '281',
  '291',
  '390',
  '490',
  '606',
  '608',
  '609',
  '706',
  '708',
  '709',
];

const NATURALEZAS_VALIDAS = new Set<NaturalezaPGC>([
  'PN',
  'A',
  'P',
  'G',
  'I',
  'M',
]);

let ultimoResultado: ResultadoSelftest = {
  estado: 'pendiente',
  ok: true,
  ejecutadoEn: null,
  duracionMs: 0,
  bloques: [],
  plantillasDesactivadas: [],
};

const listeners = new Set<() => void>();

function emitir(): void {
  for (const listener of listeners) {
    listener();
  }
}

function probarPGC(): BloqueSelftest {
  const errores: string[] = [];
  const cuentas = PGC.cuentas;

  if (cuentas.length < 75) {
    errores.push(`Se esperaban al menos 75 cuentas y hay ${cuentas.length}.`);
  }

  const codigosVistos = new Set<string>();
  for (const c of cuentas) {
    if (codigosVistos.has(c.n)) {
      errores.push(`Código duplicado en PGC: ${c.n}.`);
    }
    codigosVistos.add(c.n);
    if (!NATURALEZAS_VALIDAS.has(c.nat)) {
      errores.push(`Naturaleza inválida en cuenta ${c.n}: ${String(c.nat)}.`);
    }
    if (!c.nombre || !c.nombre.trim()) {
      errores.push(`Cuenta ${c.n} sin nombre.`);
    }
  }

  for (const codigo of CUENTAS_INVERSAS_ESPERADAS) {
    const cuenta = PGC.get(codigo);
    if (!cuenta) {
      errores.push(`Falta la cuenta de sentido inverso ${codigo} en PGC.`);
    } else if (!cuenta.inv) {
      errores.push(`La cuenta ${codigo} debe tener inv = true.`);
    }
  }

  if (PGC.buscar('iva').length === 0) {
    errores.push('La búsqueda PGC.buscar("iva") no devolvió resultados.');
  }

  return {
    id: 'pgc',
    nombre: 'Plan General Contable (PGC)',
    ok: errores.length === 0,
    resumen:
      errores.length === 0
        ? `${cuentas.length} cuentas verificadas y 10 cuentas inversas activas.`
        : `${errores.length} incidencia(s) detectada(s) en el PGC.`,
    errores,
  };
}

function probarBank(): BloqueSelftest {
  const res = Bank.autotest();
  const errores = res.fallos.map((f) => `${f.id}: ${f.motivo}`);
  return {
    id: 'bank',
    nombre: 'Banco fijo (Bank)',
    ok: res.ok,
    resumen: res.ok
      ? `${Bank.ejercicios.length} ejercicios fijos cuadrados y cubriendo las 11 temáticas.`
      : `${errores.length} fallo(s) en los ejercicios del banco.`,
    errores,
  };
}

function probarGen(): BloqueSelftest {
  const res = Gen.autotest(50);
  const errores = res.fallos.map((f) => `${f.id}: ${f.motivo}`);
  return {
    id: 'gen',
    nombre: 'Generador y supuestos (Gen)',
    ok: res.ok,
    resumen: res.ok
      ? `50 ejercicios paramétricos y 10 supuestos completos validados (Balance cuadrado).`
      : `${errores.length} fallo(s) en ${res.total} pruebas.`,
    errores,
  };
}

function probarEngine(): BloqueSelftest {
  const errores: string[] = [];

  const referencia: Asiento = {
    fecha: '22/11/20X6',
    concepto: 'Compra con IVA a crédito',
    lineas: [
      { c: '600', d: 10000, h: 0 },
      { c: '472', d: 2100, h: 0 },
      { c: '400', d: 0, h: 12100 },
    ],
  };

  // 1) Líneas desordenadas: debe puntuar 1 y ser ok
  const desordenadas: Linea[] = [
    { c: '400', d: 0, h: 12100 },
    { c: '472', d: 2100, h: 0 },
    { c: '600', d: 10000, h: 0 },
  ];
  const resOrden = Engine.corregir(referencia, desordenadas);
  if (!resOrden.ok || resOrden.puntos !== 1) {
    errores.push(
      `Líneas desordenadas: se esperaba ok=true y puntos=1 (obtenido ok=${resOrden.ok}, puntos=${resOrden.puntos}).`
    );
  }

  // 2) Diferencia de 0,01 € (tolerada)
  const tol01: Linea[] = [
    { c: '600', d: 10000.01, h: 0 },
    { c: '472', d: 2100, h: 0 },
    { c: '400', d: 0, h: 12100.01 },
  ];
  const resTol01 = Engine.corregir(referencia, tol01);
  if (!resTol01.ok || resTol01.puntos !== 1) {
    errores.push(
      `Tolerancia 0,01 €: se esperaba ok=true y puntos=1 (obtenido ok=${resTol01.ok}, puntos=${resTol01.puntos}).`
    );
  }

  // 3) Diferencia de 0,02 € (no tolerada)
  const tol02: Linea[] = [
    { c: '600', d: 10000.02, h: 0 },
    { c: '472', d: 2100, h: 0 },
    { c: '400', d: 0, h: 12100.02 },
  ];
  const resTol02 = Engine.corregir(referencia, tol02);
  if (resTol02.ok || resTol02.puntos >= 1) {
    errores.push(
      `Desviación 0,02 €: no debe tolerarse (obtenido ok=${resTol02.ok}, puntos=${resTol02.puntos}).`
    );
  }

  return {
    id: 'engine',
    nombre: 'Motor de corrección (Engine)',
    ok: errores.length === 0,
    resumen:
      errores.length === 0
        ? 'Orden indiferente = 1, tolerancia 0,01 € aceptada y 0,02 € rechazada.'
        : `${errores.length} error(es) en el motor de corrección.`,
    errores,
  };
}

function probarFmt(): BloqueSelftest {
  const errores: string[] = [];

  if (Fmt.eur(1234.56) !== '1.234,56 €') {
    errores.push(`Fmt.eur(1234.56) devolvió "${Fmt.eur(1234.56)}".`);
  }
  if (Fmt.eur(1000) !== '1.000 €') {
    errores.push(`Fmt.eur(1000) devolvió "${Fmt.eur(1000)}".`);
  }
  if (Fmt.parse('1.234,56') !== 1234.56) {
    errores.push(`Fmt.parse("1.234,56") devolvió ${Fmt.parse('1.234,56')}.`);
  }
  if (Fmt.parse('1234,56') !== 1234.56) {
    errores.push(`Fmt.parse("1234,56") devolvió ${Fmt.parse('1234,56')}.`);
  }
  if (Fmt.parse('1234.56') !== 1234.56) {
    errores.push(`Fmt.parse("1234.56") devolvió ${Fmt.parse('1234.56')}.`);
  }
  if (Fmt.parse('-1.234,56 €') !== -1234.56) {
    errores.push(`Fmt.parse("-1.234,56 €") devolvió ${Fmt.parse('-1.234,56 €')}.`);
  }
  if (Fmt.fecha('2026-11-22') !== '22/11/2026') {
    errores.push(`Fmt.fecha("2026-11-22") devolvió "${Fmt.fecha('2026-11-22')}".`);
  }

  return {
    id: 'fmt',
    nombre: 'Formato español (Fmt)',
    ok: errores.length === 0,
    resumen:
      errores.length === 0
        ? 'Formato europeo (1.234,56 €), parse decimal mixto y fechas dd/mm/aaaa.'
        : `${errores.length} error(es) de formato.`,
    errores,
  };
}

export const Selftest = {
  get(): ResultadoSelftest {
    return ultimoResultado;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  run(): ResultadoSelftest {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const bloques: BloqueSelftest[] = [
      probarPGC(),
      probarBank(),
      probarGen(),
      probarEngine(),
      probarFmt(),
    ];
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const ok = bloques.every((b) => b.ok);

    ultimoResultado = {
      estado: ok ? 'ok' : 'error',
      ok,
      ejecutadoEn: Date.now(),
      duracionMs: Math.max(1, Math.round(t1 - t0)),
      bloques,
      plantillasDesactivadas: Gen.desactivadas(),
    };
    emitir();
    return ultimoResultado;
  },
};

export function useSelftest(): ResultadoSelftest {
  return useSyncExternalStore(
    Selftest.subscribe,
    Selftest.get,
    Selftest.get
  );
}
