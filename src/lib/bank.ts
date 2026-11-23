import { BANK1 } from '../data/bank1';
import { BANK2 } from '../data/bank2';
import { PGC } from '../data/pgc';
import { TEMAS, type TemaId } from '../data/temas';
import { Fmt } from './fmt';
import type { Ejercicio } from './types';

const TOL = 0.01;

export interface BankElegirOpts {
  excluir?: string[];
  soloSupuestos?: boolean;
}

export interface BankAutotestFallo {
  id: string;
  motivo: string;
}

export interface BankAutotestResultado {
  ok: boolean;
  fallos: BankAutotestFallo[];
}

const EJERCICIOS: Ejercicio[] = [...BANK1, ...BANK2];

export const Bank = {
  ejercicios: EJERCICIOS,

  porId(id: string): Ejercicio | null {
    return EJERCICIOS.find((e) => e.id === id) ?? null;
  },

  supuestos(): Ejercicio[] {
    return EJERCICIOS.filter((ej) => ej.tema === 'completo');
  },

  elegir(temaId: TemaId, opts?: BankElegirOpts): Ejercicio | null {
    const excluidos = new Set(opts?.excluir ?? []);

    const candidatos = EJERCICIOS.filter((ej) => {
      if (temaId !== 'completo' && ej.tema !== temaId) {
        return false;
      }
      if (opts?.soloSupuestos && ej.asientos.length < 3) {
        return false;
      }
      if (excluidos.has(ej.id)) {
        return false;
      }
      return true;
    });

    if (candidatos.length === 0) {
      return null;
    }

    const idx = Math.floor(Math.random() * candidatos.length);
    return candidatos[idx];
  },

  autotest(): BankAutotestResultado {
    const fallos: BankAutotestFallo[] = [];

    if (EJERCICIOS.length !== 24) {
      fallos.push({
        id: 'bank',
        motivo: `Se esperaban 24 ejercicios en el banco y hay ${EJERCICIOS.length}.`,
      });
    }

    for (const tema of TEMAS) {
      if (tema.id === 'completo') {
        continue;
      }
      const cantidad = EJERCICIOS.filter((ej) => ej.tema === tema.id).length;
      if (cantidad < 2) {
        fallos.push({
          id: `tema-${tema.id}`,
          motivo: `La temática "${tema.id}" tiene ${cantidad} ejercicio(s); se requieren al menos 2.`,
        });
      }
    }

    for (const ej of EJERCICIOS) {
      if (ej.inicial && ej.inicial.length > 0) {
        let sumD = 0;
        let sumH = 0;

        for (const s of ej.inicial) {
          const cuenta = String(s.c ?? '').trim();
          if (!PGC.get(cuenta)) {
            const msg = `[Bank] ${ej.id}: cuenta inicial ${cuenta} no existe en PGC.`;
            console.warn(msg);
            fallos.push({ id: ej.id, motivo: `Cuenta inicial ${cuenta} no existe en PGC.` });
          }
          sumD += Number(s.d) || 0;
          sumH += Number(s.h) || 0;
        }

        if (Math.abs(sumD - sumH) > TOL) {
          fallos.push({
            id: ej.id,
            motivo: `Saldos iniciales descuadrados: Debe ${Fmt.eur(sumD)} frente a Haber ${Fmt.eur(sumH)}.`,
          });
        }
      }

      ej.asientos.forEach((asiento, idx) => {
        let sumD = 0;
        let sumH = 0;

        if (!asiento.lineas || asiento.lineas.length === 0) {
          fallos.push({
            id: ej.id,
            motivo: `Asiento ${idx + 1} sin líneas.`,
          });
          return;
        }

        for (const l of asiento.lineas) {
          const cuenta = String(l.c ?? '').trim();
          if (!PGC.get(cuenta)) {
            const msg = `[Bank] ${ej.id}: asiento ${idx + 1}, cuenta ${cuenta} no existe en PGC.`;
            console.warn(msg);
            fallos.push({
              id: ej.id,
              motivo: `Asiento ${idx + 1}: cuenta ${cuenta} no existe en PGC.`,
            });
          }

          const d = Number(l.d);
          const h = Number(l.h);
          if (!Number.isFinite(d) || !Number.isFinite(h) || d < 0 || h < 0) {
            fallos.push({
              id: ej.id,
              motivo: `Asiento ${idx + 1}: importe inválido en cuenta ${cuenta}.`,
            });
          } else {
            sumD += d;
            sumH += h;
          }
        }

        if (Math.abs(sumD - sumH) > TOL) {
          fallos.push({
            id: ej.id,
            motivo: `Asiento ${idx + 1} descuadrado: Debe ${Fmt.eur(sumD)} frente a Haber ${Fmt.eur(sumH)}.`,
          });
        }
      });
    }

    return {
      ok: fallos.length === 0,
      fallos,
    };
  },
};
