import type { TemaId } from '../data/temas';

export interface Linea {
  c: string;
  d: number;
  h: number;
  por?: string;
}

export interface Asiento {
  fecha: string;
  concepto: string;
  lineas: Linea[];
}

export interface SaldoInicial {
  c: string;
  d: number;
  h: number;
}

export interface CalculoEjercicio {
  etiqueta: string;
  valor: string | number;
}

export interface Ejercicio {
  id: string;
  tema: TemaId;
  nivel: 1 | 2 | 3 | 4 | 5;
  titulo: string;
  enunciado: string;
  inicial: SaldoInicial[] | null;
  asientos: Asiento[];
  calc: CalculoEjercicio[];
  nota: string;
  fuente: 'banco' | 'gen' | 'ia';
}
