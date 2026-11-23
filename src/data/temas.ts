export type TemaId =
  | 'completo'
  | 'conceptos'
  | 'cuadro'
  | 'compras'
  | 'prestamos'
  | 'capital'
  | 'nominas'
  | 'inmovilizado'
  | 'existencias'
  | 'ajustes'
  | 'dudosos'
  | 'cierre';

export interface Tema {
  id: TemaId;
  nombre: string;
  color: string;
}

export const TEMAS: Tema[] = [
  { id: 'completo', nombre: 'Examen completo', color: '#EC4899' },
  { id: 'conceptos', nombre: 'Conceptos y PGC', color: '#6366F1' },
  { id: 'cuadro', nombre: 'Cuadro de cuentas', color: '#3B82F6' },
  { id: 'compras', nombre: 'Compras/ventas e IVA', color: '#F59E0B' },
  { id: 'prestamos', nombre: 'Préstamos e inversiones financieras', color: '#10B981' },
  { id: 'capital', nombre: 'Capital y constitución', color: '#0EA5E9' },
  { id: 'nominas', nombre: 'Nóminas', color: '#EF4444' },
  { id: 'inmovilizado', nombre: 'Inmovilizado y amortización', color: '#8B5A3C' },
  { id: 'existencias', nombre: 'Existencias', color: '#14B8A6' },
  { id: 'ajustes', nombre: 'Ajustes y periodificaciones', color: '#F97316' },
  { id: 'dudosos', nombre: 'Clientes dudosos y provisiones', color: '#A855F7' },
  { id: 'cierre', nombre: 'Cierre y cuentas anuales', color: '#475569' },
];

export function getTema(id: TemaId): Tema {
  return TEMAS.find((t) => t.id === id) ?? TEMAS[0];
}
