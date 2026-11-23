import { TEMAS, type TemaId } from '../data/temas';
import { SECUENCIAS_ORDENA } from '../data/theory';
import { Bank } from './bank';
import { Gen } from './gen';
import { Masas } from './masas';
import { go } from './router';
import { Store, type ModoJuego } from './store';
import type { Ejercicio } from './types';

export type JuegoId =
  | 'debe-haber'
  | 'rellena'
  | 'asiento'
  | 'calcula'
  | 'ordena'
  | 'test'
  | 'clasifica';

export interface JuegoInfo {
  id: JuegoId;
  nombre: string;
  descripcion: string;
  duracion: string;
  defaultN: number;
  etiquetaN: string;
}

export const JUEGOS: JuegoInfo[] = [
  {
    id: 'debe-haber',
    nombre: '¿Debe o Haber?',
    descripcion: 'Desliza cada cuenta y su importe al Debe o al Haber.',
    duracion: '2 min',
    defaultN: 8,
    etiquetaN: '8 tarjetas',
  },
  {
    id: 'rellena',
    nombre: 'Rellena el asiento',
    descripcion: 'Completa los 2 o 3 huecos de cuenta o importe en el Diario.',
    duracion: '3 min',
    defaultN: 5,
    etiquetaN: '5 asientos',
  },
  {
    id: 'asiento',
    nombre: 'Asiento completo',
    descripcion: 'Redacta el asiento entero desde el enunciado con autocorrección.',
    duracion: '4 min',
    defaultN: 5,
    etiquetaN: '5 asientos',
  },
  {
    id: 'calcula',
    nombre: 'Calcula',
    descripcion: 'Resuelve paso a paso los importes clave con pistas opcionales.',
    duracion: '3 min',
    defaultN: 5,
    etiquetaN: '5 ejercicios',
  },
  {
    id: 'ordena',
    nombre: 'Ordena',
    descripcion: 'Coloca los pasos contables en la secuencia correcta.',
    duracion: '2 min',
    defaultN: 5,
    etiquetaN: 'secuencias',
  },
  {
    id: 'test',
    nombre: 'Test de teoría',
    descripcion: 'Opción múltiple y verdadero/falso con explicación inmediata.',
    duracion: '2 min',
    defaultN: 7,
    etiquetaN: 'preguntas',
  },
  {
    id: 'clasifica',
    nombre: 'Clasifica',
    descripcion: 'Asigna cuentas aleatorias del PGC a su masa patrimonial.',
    duracion: '2 min',
    defaultN: 7,
    etiquetaN: 'cuentas',
  },
];

export type MasaClasificacion =
  | 'Activo no corriente'
  | 'Activo corriente'
  | 'Patrimonio neto'
  | 'Pasivo no corriente'
  | 'Pasivo corriente'
  | 'Gasto'
  | 'Ingreso';

export const MASAS_CLASIFICA: MasaClasificacion[] = [
  'Activo no corriente',
  'Activo corriente',
  'Patrimonio neto',
  'Pasivo no corriente',
  'Pasivo corriente',
  'Gasto',
  'Ingreso',
];

export function clasificarMasaCuenta(n: string): {
  masaBoton: MasaClasificacion;
  submasa: string;
} {
  const m = Masas.de(n);
  switch (m) {
    case 'ANC':
      return { masaBoton: 'Activo no corriente', submasa: 'Activo no corriente' };
    case 'Existencias y deudores':
      return { masaBoton: 'Activo corriente', submasa: 'Existencias y deudores' };
    case 'Inversiones y efectivo':
      return { masaBoton: 'Activo corriente', submasa: 'Inversiones y efectivo' };
    case 'PN':
      return { masaBoton: 'Patrimonio neto', submasa: 'Patrimonio neto' };
    case 'Pasivo no corriente':
      return { masaBoton: 'Pasivo no corriente', submasa: 'Pasivo no corriente' };
    case 'Pasivo corriente':
      return { masaBoton: 'Pasivo corriente', submasa: 'Pasivo corriente' };
    case 'Gasto':
      return { masaBoton: 'Gasto', submasa: 'Gasto (grupo 6)' };
    case 'Ingreso':
      return { masaBoton: 'Ingreso', submasa: 'Ingreso (grupo 7)' };
  }
}

export interface JugarOpts {
  tema?: TemaId;
  modo?: ModoJuego;
  n?: number;
}

export interface CargarEjercicioOpts {
  tema: TemaId;
  paso: number;
  requiereAsientos?: boolean;
  requiereCalculos?: boolean;
  plantillaFija?: string;
  semillaBase?: number;
  usadosBanco?: string[];
}

export interface RegistrarPreguntaOpts {
  tema: TemaId;
  puntos: number;
  juego: string;
  enunciado: string;
  tuRespuesta: string;
  correcta: string;
  ejercicioId: string;
}

const TEMAS_CONCRETOS = TEMAS.filter((t) => t.id !== 'completo');

export function barajarArray<T>(arr: readonly T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  return copia;
}

export const Games = {
  juegos: JUEGOS,

  get(id: string | undefined): JuegoInfo | undefined {
    return JUEGOS.find((j) => j.id === id);
  },

  esJuegoId(id: string | undefined): id is JuegoId {
    return JUEGOS.some((j) => j.id === id);
  },

  tieneContenido(juegoId: JuegoId, temaId: TemaId): boolean {
    if (temaId === 'completo') {
      return true;
    }
    if (juegoId === 'ordena') {
      return SECUENCIAS_ORDENA.some((s) => s.tema === temaId);
    }
    return true;
  },

  jugar(juegoId: JuegoId, opts?: JugarOpts): void {
    const state = Store.get();
    const tema = opts?.tema ?? state.ui.tema;
    const modo = opts?.modo ?? state.ui.modoJuego;
    const def = Games.get(juegoId)?.defaultN ?? 5;
    const n = opts?.n ?? def;
    const params = new URLSearchParams({
      tema,
      modo,
      n: String(n),
    });
    go(`/jugar/${juegoId}?${params.toString()}`);
  },

  temaMenorDominio(): TemaId {
    const state = Store.get();
    const ordenado = [...TEMAS_CONCRETOS].sort((a, b) => {
      const recA = state.dominio[a.id]?.recientes ?? [];
      const recB = state.dominio[b.id]?.recientes ?? [];
      const sinA = recA.length === 0;
      const sinB = recB.length === 0;
      if (sinA !== sinB) {
        return sinA ? -1 : 1;
      }
      const pctA = Store.porcentajeTema(a.id);
      const pctB = Store.porcentajeTema(b.id);
      return pctA - pctB;
    });
    return ordenado[0]?.id ?? 'conceptos';
  },

  rapido5(): void {
    const temaDebil = Games.temaMenorDominio();
    Store.update((prev) => ({
      ...prev,
      ui: { ...prev.ui, tema: temaDebil },
    }));
    go('/jugar?rapido=1');
  },

  rotarTema(temaPrincipal: TemaId, paso: number): Exclude<TemaId, 'completo'> {
    if (temaPrincipal !== 'completo') {
      return temaPrincipal;
    }
    const idx = Math.abs(paso) % TEMAS_CONCRETOS.length;
    return TEMAS_CONCRETOS[idx].id as Exclude<TemaId, 'completo'>;
  },

  extraerPlantillaId(ej: Ejercicio): string | undefined {
    const match = ej.id.match(/^G-([A-Z0-9]+)-\d+$/);
    return match ? match[1] : undefined;
  },

  obtenerEjercicio(opts: CargarEjercicioOpts): Ejercicio {
    const temaReal = Games.rotarTema(opts.tema, opts.paso);
    const semillaBase =
      opts.semillaBase ??
      ((Date.now() ^ (opts.paso * 2654435761)) >>> 0 || 1);

    if (opts.plantillaFija) {
      const nuevaSemilla = (semillaBase + Math.floor(Math.random() * 99991) + 1) >>> 0;
      return Gen.generar(temaReal, {
        plantilla: opts.plantillaFija,
        semilla: nuevaSemilla,
      });
    }

    // A veces (aprox. 22 %) tomamos un ejercicio del banco fijo si cumple el filtro
    if (Math.random() < 0.22) {
      const candidatoBanco = Bank.elegir(temaReal, {
        excluir: opts.usadosBanco,
      });
      if (candidatoBanco) {
        const cumpleAsientos =
          !opts.requiereAsientos || candidatoBanco.asientos.length > 0;
        const cumpleCalculos =
          !opts.requiereCalculos || candidatoBanco.calc.length > 0;
        if (cumpleAsientos && cumpleCalculos) {
          return candidatoBanco;
        }
      }
    }

    const plantillasTema = Gen.plantillas(temaReal);
    const candidatas = barajarArray(plantillasTema);

    for (const p of candidatas) {
      const ej = Gen.generar(temaReal, {
        plantilla: p.id,
        semilla: (semillaBase + Math.floor(Math.random() * 100000)) >>> 0 || 1,
      });
      const okAsientos = !opts.requiereAsientos || ej.asientos.length > 0;
      const okCalculos = !opts.requiereCalculos || ej.calc.length > 0;
      if (okAsientos && okCalculos) {
        return ej;
      }
    }

    // Respaldo: rotación a cualquier plantilla válida si hubiera algún filtro restrictivo
    return Gen.generar('completo', { semilla: semillaBase });
  },

  calcularXPReto(puntos: number): number {
    return Math.round(10 * Math.max(0, Math.min(1, puntos)));
  },

  calcularBonusPerfecto(aciertos: number, total: number): number {
    return total > 0 && aciertos === total ? 20 : 0;
  },

  registrarPregunta(opts: RegistrarPreguntaOpts): boolean {
    const acertada = opts.puntos >= 0.99;
    const temaRegistro: TemaId = opts.tema === 'completo' ? 'conceptos' : opts.tema;

    Store.registrar(temaRegistro, acertada);
    Store.marcarDia();
    Store.contar('juegos');

    if (!acertada) {
      Store.addError({
        tema: temaRegistro,
        juego: opts.juego,
        enunciado: opts.enunciado,
        tuRespuesta: opts.tuRespuesta,
        correcta: opts.correcta,
        ejercicioId: opts.ejercicioId,
      });
    }

    return acertada;
  },
};
