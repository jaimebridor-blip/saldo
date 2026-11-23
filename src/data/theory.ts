import { NATURALEZA_LABEL, PGC, type CuentaPGC, type NaturalezaPGC } from './pgc';
import type { TemaId } from './temas';

export interface PreguntaTeoria {
  id: string;
  tema: Exclude<TemaId, 'completo'>;
  tipo: 'opcion' | 'vf';
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  automatica?: boolean;
}

export interface PasoOrdena {
  id: string;
  texto: string;
  rango: number;
}

export interface SecuenciaOrdena {
  id: string;
  tema: Exclude<TemaId, 'completo'>;
  titulo: string;
  nota: string;
  pasos: PasoOrdena[];
}

export const PREGUNTAS_TEORIA: PreguntaTeoria[] = [
  // Conceptos
  {
    id: 'T01',
    tema: 'conceptos',
    tipo: 'opcion',
    enunciado: '¿Cuál NO es parte del PGC?',
    opciones: [
      'Marco conceptual',
      'Cuadro de cuentas',
      'Normas de elaboración del Impuesto de Sociedades',
      'Definiciones y relaciones contables',
    ],
    correcta: 2,
    explicacion:
      'El PGC consta de cinco partes y la tercera son las cuentas anuales, no normas fiscales del Impuesto sobre Sociedades.',
  },
  {
    id: 'T02',
    tema: 'conceptos',
    tipo: 'opcion',
    enunciado:
      '¿Qué principio exige imputar ingresos y gastos cuando se producen, aunque se cobren o paguen después?',
    opciones: ['Devengo', 'Prudencia', 'Uniformidad', 'Importancia relativa'],
    correcta: 0,
    explicacion:
      'El principio de devengo obliga a registrar las operaciones cuando ocurren con independencia de su cobro o pago.',
  },
  {
    id: 'T03',
    tema: 'conceptos',
    tipo: 'vf',
    enunciado:
      'Según el principio de no compensación pueden netearse activos con pasivos.',
    opciones: ['Verdadero', 'Falso'],
    correcta: 1,
    explicacion:
      'El principio de no compensación prohíbe compensar partidas del activo y del pasivo o de gastos e ingresos salvo norma expresa.',
  },
  {
    id: 'T04',
    tema: 'conceptos',
    tipo: 'opcion',
    enunciado:
      'Suponer que la empresa continuará su actividad es el principio de:',
    opciones: [
      'Empresa en funcionamiento',
      'Devengo',
      'Prudencia',
      'Uniformidad',
    ],
    correcta: 0,
    explicacion:
      'El principio de empresa en funcionamiento presume una duración ilimitada de la entidad sin propósito de liquidación.',
  },
  {
    id: 'T05',
    tema: 'conceptos',
    tipo: 'vf',
    enunciado: 'Activo = Patrimonio neto + Pasivo.',
    opciones: ['Verdadero', 'Falso'],
    correcta: 0,
    explicacion:
      'Es la ecuación fundamental del patrimonio: la estructura económica (Activo) iguala a la financiera (Patrimonio neto más Pasivo).',
  },
  {
    id: 'T06',
    tema: 'conceptos',
    tipo: 'opcion',
    enunciado: 'El PGC de PYMES lo aprueba el RD:',
    opciones: ['1514/2007', '1515/2007', '1516/2007', '1517/2007'],
    correcta: 1,
    explicacion:
      'El Real Decreto 1515/2007 aprueba el PGC de Pequeñas y Medianas Empresas, mientras que el 1514/2007 aprueba el PGC general.',
  },

  // Cuadro
  {
    id: 'T07',
    tema: 'cuadro',
    tipo: 'opcion',
    enunciado: 'El grupo 5 recoge:',
    opciones: [
      'Cuentas financieras',
      'Actividad propia',
      'Ventas',
      'Gastos de personal',
    ],
    correcta: 0,
    explicacion:
      'El grupo 5 agrupa instrumentos financieros a corto plazo, fianzas a corto plazo y la tesorería de la empresa.',
  },
  {
    id: 'T08',
    tema: 'cuadro',
    tipo: 'vf',
    enunciado: 'La cuenta 281 tiene saldo deudor.',
    opciones: ['Verdadero', 'Falso'],
    correcta: 1,
    explicacion:
      'La amortización acumulada (281) es una cuenta correctora de Activo con sentido inverso, por lo que tiene saldo acreedor.',
  },

  // Compras
  {
    id: 'T09',
    tema: 'compras',
    tipo: 'vf',
    enunciado:
      'Un descuento por pronto pago incluido en factura reduce la base imponible del IVA.',
    opciones: ['Verdadero', 'Falso'],
    correcta: 0,
    explicacion:
      'Cualquier descuento incluido en factura minora el importe de la compra o venta y, por tanto, reduce la base del IVA.',
  },
  {
    id: 'T10',
    tema: 'compras',
    tipo: 'opcion',
    enunciado:
      'Un «rappel» fuera de factura se registra en la cuenta ____ con ajuste del IVA soportado.',
    opciones: ['606', '609', '706', '709'],
    correcta: 1,
    explicacion:
      'Los «rappels» por compras fuera de factura se abonan en la cuenta 609 corrigiendo además el IVA soportado (472).',
  },

  // Préstamos
  {
    id: 'T11',
    tema: 'prestamos',
    tipo: 'opcion',
    enunciado: 'Lo que vence el año siguiente se pasa de:',
    opciones: ['170 a 520', '520 a 170', '170 a 572', '662 a 520'],
    correcta: 0,
    explicacion:
      'Al cierre se reclasifica de deudas a largo plazo (170) a deudas a corto plazo (520) la cuota que vence en los próximos 12 meses.',
  },

  // Capital
  {
    id: 'T12',
    tema: 'capital',
    tipo: 'opcion',
    enunciado:
      'Si las acciones nuevas son el 20 % del capital resultante, capital resultante =',
    opciones: [
      'capital anterior / 0,8',
      'capital anterior × 1,2',
      'capital anterior / 1,2',
      'capital anterior × 0,8',
    ],
    correcta: 0,
    explicacion:
      'Las acciones antiguas representan el 80 % restante del capital final, por lo que capital resultante = capital anterior / 0,8.',
  },

  // Nóminas
  {
    id: 'T13',
    tema: 'nominas',
    tipo: 'opcion',
    enunciado: 'La cuenta 476 recoge:',
    opciones: [
      'SS empresa + SS trabajador',
      'Solo SS empresa',
      'IRPF',
      'El líquido a pagar',
    ],
    correcta: 0,
    explicacion:
      'Organismos de la Seguridad Social, acreedores (476) acumula tanto la cuota patronal (642) como la retenida al empleado.',
  },

  // Inmovilizado
  {
    id: 'T14',
    tema: 'inmovilizado',
    tipo: 'opcion',
    enunciado: 'Con vida útil de 6 años el coeficiente degresivo es:',
    opciones: ['1,5', '2', '2,5', '3'],
    correcta: 1,
    explicacion:
      'En la amortización degresiva fiscal el coeficiente es 1,5 si vida < 5 años, 2 si está entre 5 y menos de 8, y 2,5 si ≥ 8.',
  },
  {
    id: 'T15',
    tema: 'inmovilizado',
    tipo: 'vf',
    enunciado:
      'Antes de dar de baja un elemento vendido hay que amortizarlo hasta la fecha de venta.',
    opciones: ['Verdadero', 'Falso'],
    correcta: 0,
    explicacion:
      'Es imprescindible dotar la amortización del ejercicio en curso hasta el día de la baja para calcular correctamente el VNC.',
  },

  // Existencias
  {
    id: 'T16',
    tema: 'existencias',
    tipo: 'opcion',
    enunciado: 'En el método especulativo el grupo 3 se mueve:',
    opciones: [
      'Solo al cierre',
      'En cada compra',
      'En cada venta',
      'Nunca',
    ],
    correcta: 0,
    explicacion:
      'Durante el año las compras van a la 600 y las ventas a la 700, regularizándose las existencias del grupo 3 únicamente al cierre.',
  },

  // Ajustes
  {
    id: 'T17',
    tema: 'ajustes',
    tipo: 'opcion',
    enunciado:
      'Un seguro pagado cuya cobertura llega al año siguiente se periodifica en:',
    opciones: ['480', '485', '629', '472'],
    correcta: 0,
    explicacion:
      'La parte de prima no devengada en el ejercicio en curso se traspasa al activo como Gastos anticipados en la cuenta 480.',
  },

  // Dudosos
  {
    id: 'T18',
    tema: 'dudosos',
    tipo: 'opcion',
    enunciado:
      'Al pasar un cliente a dudoso cobro se traspasa de 430 a 436:',
    opciones: ['El total con IVA', 'Solo la base', 'Solo el IVA', 'El 50 %'],
    correcta: 0,
    explicacion:
      'El derecho de cobro frente al cliente incluye la base y el IVA repercutido, por lo que se reclasifica el importe íntegro de la factura.',
  },

  // Cierre
  {
    id: 'T19',
    tema: 'cierre',
    tipo: 'opcion',
    enunciado: 'En la aplicación del resultado tras la apertura, el beneficio pasa de la 129 a:',
    opciones: ['120', '121', '129', '100'],
    correcta: 0,
    explicacion:
      'Tras el asiento de apertura del ejercicio siguiente (que reabre los saldos del cierre, con la 129 incluida), el asiento de aplicación del resultado traspasa el beneficio de 129 a 120 (o a reservas) o la pérdida de 121 a 129.',
  },
];

const CUENTAS_POR_TEMA: Record<Exclude<TemaId, 'completo'>, string[]> = {
  conceptos: ['100', '113', '129', '213', '281', '300', '400', '430', '572'],
  cuadro: ['570', '572', '621', '623', '627', '628', '631', '410', '281', '608', '708'],
  compras: ['600', '606', '608', '609', '700', '706', '708', '709', '400', '430', '472', '477'],
  prestamos: ['170', '520', '662', '540', '541', '760', '761', '473', '260', '565', '180'],
  capital: ['100', '110', '113', '210', '211', '572'],
  nominas: ['640', '642', '465', '4751', '476', '572'],
  inmovilizado: ['210', '211', '213', '216', '218', '281', '291', '681', '671', '771', '691', '791'],
  existencias: ['300', '390', '600', '610', '693', '793', '700'],
  ajustes: ['480', '485', '625', '752', '141', '142', '529', '678', '795'],
  dudosos: ['430', '436', '490', '650', '694', '794'],
  cierre: ['120', '121', '129', '630', '4752', '100', '113'],
};

function elegirAleatorio<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function barajar<T>(arr: readonly T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  return copia;
}

export function generarPreguntaAutomaticaPGC(
  temaId: TemaId,
  indice = 0
): PreguntaTeoria {
  const temaEfectivo: Exclude<TemaId, 'completo'> =
    temaId === 'completo' ? 'cuadro' : temaId;

  const preferidas =
    temaId === 'completo'
      ? PGC
      : PGC.filter((c) => CUENTAS_POR_TEMA[temaId]?.includes(c.n));
  const pool: readonly CuentaPGC[] = preferidas.length >= 4 ? preferidas : PGC;
  const cuenta = elegirAleatorio(pool);

  const formato = Math.floor(Math.random() * 3);

  if (formato === 0) {
    // ¿Qué cuenta es el nombre?
    const distractores = barajar(
      PGC.filter((c) => c.n !== cuenta.n)
    )
      .slice(0, 3)
      .map((c) => c.n);
    const opciones = barajar([cuenta.n, ...distractores]);
    const correcta = opciones.indexOf(cuenta.n);

    return {
      id: `AUTO_N_${cuenta.n}_${indice}`,
      tema: temaEfectivo,
      tipo: 'opcion',
      enunciado: `¿Qué código de cuenta del PGC corresponde a «${cuenta.nombre}»?`,
      opciones,
      correcta,
      explicacion: `La cuenta ${cuenta.n} recoge «${cuenta.nombre}» dentro del grupo ${cuenta.grupo}.`,
      automatica: true,
    };
  }

  if (formato === 1 && cuenta.nat !== 'M') {
    // ¿Naturaleza?
    const naturalezas: Exclude<NaturalezaPGC, 'M'>[] = [
      'A',
      'P',
      'PN',
      'G',
      'I',
    ];
    const distractores = barajar(naturalezas.filter((n) => n !== cuenta.nat))
      .slice(0, 3)
      .map((n) => NATURALEZA_LABEL[n]);
    const labelCorrecta = NATURALEZA_LABEL[cuenta.nat];
    const opciones = barajar([labelCorrecta, ...distractores]);
    const correcta = opciones.indexOf(labelCorrecta);

    return {
      id: `AUTO_NAT_${cuenta.n}_${indice}`,
      tema: temaEfectivo,
      tipo: 'opcion',
      enunciado: `¿Cuál es la naturaleza contable de la cuenta ${cuenta.n} (${cuenta.nombre})?`,
      opciones,
      correcta,
      explicacion: `La cuenta ${cuenta.n} (${cuenta.nombre}) pertenece a ${labelCorrecta}${
        cuenta.inv ? ' y tiene sentido inverso al habitual.' : '.'
      }`,
      automatica: true,
    };
  }

  // ¿Sentido inverso?
  const esInversa = Boolean(cuenta.inv);
  const opciones = ['Verdadero', 'Falso'];
  const correcta = esInversa ? 0 : 1;

  return {
    id: `AUTO_INV_${cuenta.n}_${indice}`,
    tema: temaEfectivo,
    tipo: 'vf',
    enunciado: `La cuenta ${cuenta.n} (${cuenta.nombre}) tiene sentido inverso respecto al funcionamiento normal de su naturaleza.`,
    opciones,
    correcta,
    explicacion: esInversa
      ? `Verdadero: la ${cuenta.n} es de sentido inverso (nace y aumenta en el lado contrario al normal de su masa).`
      : `Falso: la ${cuenta.n} funciona según el sentido normal de ${NATURALEZA_LABEL[cuenta.nat].toLowerCase()}.`,
    automatica: true,
  };
}

export const SECUENCIAS_ORDENA: SecuenciaOrdena[] = [
  {
    id: 'ORD_CIERRE',
    tema: 'cierre',
    titulo: 'Cierre del ejercicio',
    nota: 'Primero se calcula y contabiliza el impuesto (630 a 4752), después se regularizan gastos (grupo 6) e ingresos (grupo 7) contra 129 en cualquier orden, luego el asiento de cierre, después el asiento de apertura del ejercicio siguiente y finalmente la aplicación del resultado.',
    pasos: [
      {
        id: 'c1',
        texto: 'Contabilizar el impuesto sobre beneficios (630 a 4752)',
        rango: 1,
      },
      {
        id: 'c2',
        texto: 'Regularizar los gastos del grupo 6 contra 129',
        rango: 2,
      },
      {
        id: 'c3',
        texto: 'Regularizar los ingresos del grupo 7 contra 129',
        rango: 2,
      },
      {
        id: 'c4',
        texto: 'Asiento de cierre invirtiendo los saldos',
        rango: 3,
      },
      {
        id: 'c5',
        texto: 'Asiento de apertura del ejercicio siguiente',
        rango: 4,
      },
      {
        id: 'c6',
        texto:
          'Aplicación del resultado (beneficio de 129 a 120 o pérdida de 121 a 129)',
        rango: 5,
      },
    ],
  },
  {
    id: 'ORD_EXISTENCIAS',
    tema: 'existencias',
    titulo: 'Regularización de existencias',
    nota: 'Al cierre se revierte el deterioro inicial, se dan de baja las existencias iniciales, se dan de alta las finales y se dota deterioro si el valor de mercado es inferior al coste.',
    pasos: [
      {
        id: 'x1',
        texto: 'Anular el deterioro inicial (39x a 793)',
        rango: 1,
      },
      {
        id: 'x2',
        texto: 'Dar de baja las existencias iniciales (610 a 30x)',
        rango: 2,
      },
      {
        id: 'x3',
        texto: 'Dar de alta las existencias finales (30x a 610)',
        rango: 3,
      },
      {
        id: 'x4',
        texto:
          'Dotar el deterioro final si el valor de mercado es menor que el coste (693 a 39x)',
        rango: 4,
      },
    ],
  },
  {
    id: 'ORD_INMOVILIZADO',
    tema: 'inmovilizado',
    titulo: 'Baja de inmovilizado por venta',
    nota: 'Antes de registrar la enajenación se amortiza hasta la fecha de venta, se obtiene el VNC y se compara con el precio sin IVA.',
    pasos: [
      {
        id: 'i1',
        texto: 'Amortizar hasta la fecha de venta (681 a 281)',
        rango: 1,
      },
      {
        id: 'i2',
        texto: 'Calcular el VNC (precio − amortización acumulada)',
        rango: 2,
      },
      {
        id: 'i3',
        texto: 'Comparar el precio de venta con el VNC',
        rango: 3,
      },
      {
        id: 'i4',
        texto:
          'Registrar la baja (572 y 281 contra 21x; diferencia a 671 o 771)',
        rango: 4,
      },
    ],
  },
  {
    id: 'ORD_PRESTAMO',
    tema: 'prestamos',
    titulo: 'Ciclo de un préstamo bancario',
    nota: 'Primero entra el préstamo a l/p (170), al cierre se reclasifica a c/p (520) la cuota que vence en los próximos 12 meses y al vencimiento se paga capital e intereses.',
    pasos: [
      {
        id: 'p1',
        texto: 'Contabilizar la concesión (572 a 170)',
        rango: 1,
      },
      {
        id: 'p2',
        texto:
          'A 31/12 pasar a corto plazo la cuota del año siguiente (170 a 520)',
        rango: 2,
      },
      {
        id: 'p3',
        texto: 'Pagar la cuota con sus intereses (520 y 662 a 572)',
        rango: 3,
      },
    ],
  },
  {
    id: 'ORD_NOMINA',
    tema: 'nominas',
    titulo: 'Nómina, Seguridad Social e IRPF',
    nota: 'Primero se devenga la nómina al final del mes, luego se paga el salario líquido, después los seguros sociales al mes vencido y trimestralmente el IRPF.',
    pasos: [
      {
        id: 'n1',
        texto: 'Devengo a fin de mes (640 y 642 a 4751, 476 y 465)',
        rango: 1,
      },
      {
        id: 'n2',
        texto: 'Pago de la nómina al mes siguiente (465 a 572)',
        rango: 2,
      },
      {
        id: 'n3',
        texto: 'Pago de la Seguridad Social (476 a 572)',
        rango: 3,
      },
      {
        id: 'n4',
        texto: 'Ingreso del IRPF al trimestre siguiente (4751 a 572)',
        rango: 4,
      },
    ],
  },
  {
    id: 'ORD_CICLO',
    tema: 'conceptos',
    titulo: 'Ciclo contable completo',
    nota: 'El ciclo contable sigue un orden cronológico desde la apertura el 01/01 hasta el cierre el 31/12.',
    pasos: [
      { id: 'cc1', texto: 'Asiento de apertura', rango: 1 },
      { id: 'cc2', texto: 'Operaciones del ejercicio en el Diario', rango: 2 },
      { id: 'cc3', texto: 'Mayor y balance de sumas y saldos', rango: 3 },
      { id: 'cc4', texto: 'Ajustes y regularización', rango: 4 },
      { id: 'cc5', texto: 'Cierre', rango: 5 },
    ],
  },
];
