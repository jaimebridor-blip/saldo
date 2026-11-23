import { PGC } from '../data/pgc';
import type { TemaId } from '../data/temas';
import { Engine } from './engine';
import { PLANTILLAS_1 } from './gen/plantillas1';
import { PLANTILLAS_2 } from './gen/plantillas2';
import { PLANTILLAS_3 } from './gen/plantillas3';
import { generarSupuesto, type SupuestoOpts } from './gen/supuesto';
import { Masas } from './masas';
import type { Ejercicio } from './types';

export interface Rng {
  semilla: number;
  next: () => number;
  entero: (a: number, b: number, paso?: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  barajar: <T>(arr: readonly T[]) => T[];
}

export interface PlantillaContext {
  empresa: string;
  anio: string;
  r2: (x: number) => number;
  fecha: (dia: number, mes: number) => string;
}

export interface Plantilla {
  id: string;
  tema: TemaId;
  nombre: string;
  nivel: 1 | 2 | 3 | 4 | 5;
  hacer: (rng: Rng, ctx: PlantillaContext) => Ejercicio | null;
}

export interface GenerarOpts {
  semilla?: number;
  plantilla?: string;
}

export interface AutotestFallo {
  id: string;
  motivo: string;
}

export interface AutotestResultado {
  ok: boolean;
  total: number;
  fallos: AutotestFallo[];
  desactivadas: string[];
}

export const EMPRESAS: readonly string[] = [
  'ACEREPESA, S.A.',
  'METALÚRGICA DEL DUERO, S.L.',
  'TEXTILES PISUERGA, S.A.',
  'MUEBLES CAMPOS, S.A.',
  'CERÁMICAS CASTILLA, S.L.',
  'ELECTRODOMÉSTICOS TORMES, S.A.',
  'ALIMENTACIÓN CARRIÓN, S.L.',
  'MADERAS ARCO, S.A.',
  'CONSTRUCCIONES ARLANZÓN, S.L.',
  'DISTRIBUCIONES VALLE, S.A.',
  'SUMINISTROS DEL EBRO, S.L.',
  'TALLERES SANABRIA, S.A.',
];

const ANIOS: readonly string[] = ['20X5', '20X6', '20X7'];

const TODAS_PLANTILLAS: Plantilla[] = [
  ...PLANTILLAS_1,
  ...PLANTILLAS_2,
  ...PLANTILLAS_3,
];

const plantillasDesactivadas = new Set<string>();

function r2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function conPuntoFinal(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) return '';
  return limpio.endsWith('.') ? limpio : `${limpio}.`;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let z = Math.imul(t ^ (t >>> 15), 1 | t);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function crearRng(semillaInput?: number): Rng {
  const semilla =
    typeof semillaInput === 'number' && Number.isFinite(semillaInput)
      ? (semillaInput >>> 0) || 1
      : (Math.floor(Math.random() * 0x7fffffff) + 1) >>> 0;
  const next = mulberry32(semilla);

  const entero = (a: number, b: number, paso = 1): number => {
    const p = paso > 0 ? paso : 1;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const steps = Math.floor((max - min) / p);
    return min + Math.floor(next() * (steps + 1)) * p;
  };

  const pick = <T,>(arr: readonly T[]): T => {
    if (arr.length === 0) {
      throw new Error('No se puede elegir un elemento de una lista vacía.');
    }
    return arr[Math.floor(next() * arr.length)];
  };

  const barajar = <T,>(arr: readonly T[]): T[] => {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = copia[i];
      copia[i] = copia[j];
      copia[j] = tmp;
    }
    return copia;
  };

  return { semilla, next, entero, pick, barajar };
}

function crearContexto(rng: Rng): PlantillaContext {
  const empresa = rng.pick(EMPRESAS);
  const anio = rng.pick(ANIOS);
  const fecha = (dia: number, mes: number): string => {
    const dd = String(Math.max(1, Math.min(28, dia))).padStart(2, '0');
    const mm = String(Math.max(1, Math.min(12, mes))).padStart(2, '0');
    return `${dd}/${mm}/${anio}`;
  };
  return { empresa, anio, r2, fecha };
}

export const Gen = {
  rng(semilla?: number): Rng {
    return crearRng(semilla);
  },

  desactivadas(): string[] {
    return Array.from(plantillasDesactivadas).sort();
  },

  desactivarPlantilla(id: string): void {
    plantillasDesactivadas.add(id);
  },

  reactivarPlantillas(): void {
    plantillasDesactivadas.clear();
  },

  plantillas(
    temaId?: TemaId
  ): Array<{ id: string; tema: TemaId; nombre: string; nivel: 1 | 2 | 3 | 4 | 5 }> {
    const base =
      !temaId || temaId === 'completo'
        ? TODAS_PLANTILLAS
        : TODAS_PLANTILLAS.filter((p) => p.tema === temaId);

    return base
      .filter((p) => !plantillasDesactivadas.has(p.id))
      .map(({ id, tema, nombre, nivel }) => ({
        id,
        tema,
        nombre,
        nivel,
      }));
  },

  validar(ej: Ejercicio): { ok: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!ej || typeof ej !== 'object') {
      return { ok: false, errores: ['Ejercicio vacío o inválido.'] };
    }

    if (!ej.enunciado || !ej.enunciado.trim()) {
      errores.push('El enunciado está vacío.');
    }

    if (!Array.isArray(ej.calc)) {
      errores.push('Falta el array calc.');
    } else {
      ej.calc.forEach((c, idx) => {
        if (!c.etiqueta || !c.etiqueta.trim()) {
          errores.push(`calc[${idx}] sin etiqueta.`);
        }
        if (typeof c.valor !== 'number' || !Number.isFinite(c.valor)) {
          errores.push(`calc[${idx}] (${c.etiqueta}) no es un número finito.`);
        }
      });
    }

    if (ej.inicial) {
      for (const s of ej.inicial) {
        if (!PGC.get(s.c)) {
          errores.push(`Cuenta inicial ${s.c} no existe en PGC.`);
        }
      }
    }

    if (!Array.isArray(ej.asientos)) {
      errores.push('Falta el array asientos.');
    } else {
      ej.asientos.forEach((asiento, idx) => {
        const val = Engine.validar(asiento);
        if (!val.ok) {
          errores.push(`Asiento ${idx + 1}: ${val.errores.join(' ')}`);
        }
        for (const l of asiento.lineas) {
          if (!PGC.get(l.c)) {
            errores.push(`Asiento ${idx + 1}: cuenta ${l.c} no existe en PGC.`);
          }
        }
      });
    }

    return { ok: errores.length === 0, errores };
  },

  generar(temaId: TemaId, opts?: GenerarOpts): Ejercicio {
    const semillaBase =
      typeof opts?.semilla === 'number' && Number.isFinite(opts.semilla)
        ? (opts.semilla >>> 0) || 1
        : (Math.floor(Math.random() * 0x7fffffff) + 1) >>> 0;

    const r = crearRng(semillaBase);

    let candidatas: Plantilla[];
    if (opts?.plantilla) {
      const exacta = TODAS_PLANTILLAS.find((p) => p.id === opts.plantilla);
      if (!exacta) {
        throw new Error(`No existe la plantilla "${opts.plantilla}".`);
      }
      candidatas = [exacta];
    } else {
      const poolBase =
        temaId === 'completo'
          ? TODAS_PLANTILLAS
          : TODAS_PLANTILLAS.filter((p) => p.tema === temaId);

      const poolActivas = poolBase.filter((p) => !plantillasDesactivadas.has(p.id));
      const pool = poolActivas.length > 0 ? poolActivas : poolBase;

      if (pool.length === 0) {
        throw new Error(`No hay plantillas disponibles para el tema "${temaId}".`);
      }
      candidatas = r.barajar(pool);
    }

    const MAX_INTENTOS = 25;

    for (const plantilla of candidatas) {
      for (let intento = 0; intento < MAX_INTENTOS; intento++) {
        const subSemilla = (semillaBase + intento * 7919) >>> 0 || 1;
        const subRng = crearRng(subSemilla);
        const ctx = crearContexto(subRng);
        let ej: Ejercicio | null = null;
        try {
          ej = plantilla.hacer(subRng, ctx);
        } catch {
          ej = null;
        }

        if (!ej) {
          continue;
        }

        const completo: Ejercicio = {
          ...ej,
          id: `G-${plantilla.id}-${semillaBase}`,
          fuente: 'gen',
        };

        const check = Gen.validar(completo);
        if (check.ok) {
          return completo;
        }
      }

      plantillasDesactivadas.add(plantilla.id);
    }

    throw new Error(
      `No se pudo generar un ejercicio válido para "${temaId}" tras agotar las plantillas disponibles.`
    );
  },

  supuesto(temaId: TemaId, opts?: SupuestoOpts): Ejercicio {
    return generarSupuesto(temaId, opts);
  },

  autotest(n = 50): AutotestResultado {
    const fallos: AutotestFallo[] = [];
    const plantillas = TODAS_PLANTILLAS;
    let total = 0;

    if (plantillas.length === 0) {
      return {
        ok: false,
        total: 0,
        fallos: [{ id: 'gen', motivo: 'No hay plantillas registradas.' }],
        desactivadas: Gen.desactivadas(),
      };
    }

    for (let i = 0; i < n; i++) {
      const plantilla = plantillas[i % plantillas.length];
      const semilla = 1000 + i * 37;
      total += 1;
      try {
        const ej = Gen.generar(plantilla.tema, {
          semilla,
          plantilla: plantilla.id,
        });
        const val = Gen.validar(ej);
        if (!val.ok) {
          plantillasDesactivadas.add(plantilla.id);
          fallos.push({
            id: ej.id || `${plantilla.id}-${semilla}`,
            motivo: val.errores.join('; '),
          });
        }
      } catch (err) {
        plantillasDesactivadas.add(plantilla.id);
        fallos.push({
          id: `${plantilla.id}-${semilla}`,
          motivo: err instanceof Error ? err.message : 'Error desconocido',
        });
      }
    }

    for (let s = 0; s < 10; s++) {
      const semilla = 9000 + s * 53;
      total += 1;
      try {
        const sup = Gen.supuesto('completo', {
          n: 4 + (s % 5),
          semilla,
        });
        const val = Gen.validar(sup);
        if (!val.ok) {
          fallos.push({
            id: sup.id || `supuesto-${semilla}`,
            motivo: val.errores.join('; '),
          });
          continue;
        }
        const saldos = Engine.mayorizar(sup.asientos, sup.inicial);
        const bal = Masas.balance(saldos);
        if (Math.abs(bal.activo - bal.pnYPasivo) > 0.01) {
          fallos.push({
            id: sup.id || `supuesto-${semilla}`,
            motivo: `Balance descuadrado: Activo ${bal.activo} frente a PN+Pasivo ${bal.pnYPasivo}.`,
          });
        }
      } catch (err) {
        fallos.push({
          id: `supuesto-${semilla}`,
          motivo: err instanceof Error ? err.message : 'Error desconocido',
        });
      }
    }

    return {
      ok: fallos.length === 0,
      total,
      fallos,
      desactivadas: Gen.desactivadas(),
    };
  },
};
