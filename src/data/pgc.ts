export type NaturalezaPGC = 'PN' | 'A' | 'P' | 'G' | 'I' | 'M';

export interface CuentaPGC {
  n: string;
  nombre: string;
  grupo: number;
  nat: NaturalezaPGC;
  inv: boolean;
}

const CUENTAS_RAW: CuentaPGC[] = [
  // Patrimonio neto (PN)
  { n: '100', nombre: 'Capital social', grupo: 1, nat: 'PN', inv: false },
  { n: '110', nombre: 'Prima de emisión o asunción', grupo: 1, nat: 'PN', inv: false },
  { n: '113', nombre: 'Reservas voluntarias', grupo: 1, nat: 'PN', inv: false },
  { n: '120', nombre: 'Remanente', grupo: 1, nat: 'PN', inv: false },
  {
    n: '121',
    nombre: 'Resultados negativos de ejercicios anteriores',
    grupo: 1,
    nat: 'PN',
    inv: true,
  },
  { n: '129', nombre: 'Resultado del ejercicio', grupo: 1, nat: 'PN', inv: false },

  // Activo (A)
  { n: '210', nombre: 'Terrenos y bienes naturales', grupo: 2, nat: 'A', inv: false },
  { n: '211', nombre: 'Construcciones', grupo: 2, nat: 'A', inv: false },
  { n: '213', nombre: 'Maquinaria', grupo: 2, nat: 'A', inv: false },
  { n: '216', nombre: 'Mobiliario', grupo: 2, nat: 'A', inv: false },
  { n: '218', nombre: 'Elementos de transporte', grupo: 2, nat: 'A', inv: false },
  {
    n: '260',
    nombre: 'Fianzas constituidas a largo plazo',
    grupo: 2,
    nat: 'A',
    inv: false,
  },
  {
    n: '281',
    nombre: 'Amortización acumulada del inmovilizado material',
    grupo: 2,
    nat: 'A',
    inv: true,
  },
  {
    n: '291',
    nombre: 'Deterioro de valor del inmovilizado material',
    grupo: 2,
    nat: 'A',
    inv: true,
  },
  { n: '300', nombre: 'Mercaderías A', grupo: 3, nat: 'A', inv: false },
  {
    n: '390',
    nombre: 'Deterioro de valor de las mercaderías',
    grupo: 3,
    nat: 'A',
    inv: true,
  },
  { n: '430', nombre: 'Clientes', grupo: 4, nat: 'A', inv: false },
  { n: '436', nombre: 'Clientes de dudoso cobro', grupo: 4, nat: 'A', inv: false },
  {
    n: '4700',
    nombre: 'Hacienda Pública, deudora por IVA',
    grupo: 4,
    nat: 'A',
    inv: false,
  },
  {
    n: '472',
    nombre: 'Hacienda Pública, IVA soportado',
    grupo: 4,
    nat: 'A',
    inv: false,
  },
  {
    n: '473',
    nombre: 'Hacienda Pública, retenciones y pagos a cuenta',
    grupo: 4,
    nat: 'A',
    inv: false,
  },
  { n: '480', nombre: 'Gastos anticipados', grupo: 4, nat: 'A', inv: false },
  {
    n: '490',
    nombre: 'Deterioro de valor de créditos por operaciones comerciales',
    grupo: 4,
    nat: 'A',
    inv: true,
  },
  {
    n: '540',
    nombre: 'Inversiones financieras a corto plazo en instrumentos de patrimonio',
    grupo: 5,
    nat: 'A',
    inv: false,
  },
  {
    n: '541',
    nombre: 'Valores representativos de deuda a corto plazo',
    grupo: 5,
    nat: 'A',
    inv: false,
  },
  {
    n: '565',
    nombre: 'Fianzas constituidas a corto plazo',
    grupo: 5,
    nat: 'A',
    inv: false,
  },
  { n: '570', nombre: 'Caja, euros', grupo: 5, nat: 'A', inv: false },
  {
    n: '572',
    nombre: 'Bancos e instituciones de crédito c/c vista, euros',
    grupo: 5,
    nat: 'A',
    inv: false,
  },

  // Pasivo (P)
  { n: '141', nombre: 'Provisión para impuestos', grupo: 1, nat: 'P', inv: false },
  {
    n: '142',
    nombre: 'Provisión para otras responsabilidades',
    grupo: 1,
    nat: 'P',
    inv: false,
  },
  {
    n: '170',
    nombre: 'Deudas a largo plazo con entidades de crédito',
    grupo: 1,
    nat: 'P',
    inv: false,
  },
  {
    n: '180',
    nombre: 'Fianzas recibidas a largo plazo',
    grupo: 1,
    nat: 'P',
    inv: false,
  },
  { n: '400', nombre: 'Proveedores', grupo: 4, nat: 'P', inv: false },
  {
    n: '410',
    nombre: 'Acreedores por prestaciones de servicios',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  {
    n: '465',
    nombre: 'Remuneraciones pendientes de pago',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  {
    n: '4750',
    nombre: 'Hacienda Pública, acreedora por IVA',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  {
    n: '4751',
    nombre: 'Hacienda Pública, acreedora por retenciones practicadas',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  {
    n: '4752',
    nombre: 'Hacienda Pública, acreedora por impuesto sobre sociedades',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  {
    n: '476',
    nombre: 'Organismos de la Seguridad Social, acreedores',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  {
    n: '477',
    nombre: 'Hacienda Pública, IVA repercutido',
    grupo: 4,
    nat: 'P',
    inv: false,
  },
  { n: '485', nombre: 'Ingresos anticipados', grupo: 4, nat: 'P', inv: false },
  {
    n: '520',
    nombre: 'Deudas a corto plazo con entidades de crédito',
    grupo: 5,
    nat: 'P',
    inv: false,
  },
  { n: '529', nombre: 'Provisiones a corto plazo', grupo: 5, nat: 'P', inv: false },

  // Gastos (G)
  { n: '600', nombre: 'Compras de mercaderías', grupo: 6, nat: 'G', inv: false },
  {
    n: '606',
    nombre: 'Descuentos sobre compras por pronto pago',
    grupo: 6,
    nat: 'G',
    inv: true,
  },
  {
    n: '608',
    nombre: 'Devoluciones de compras y operaciones similares',
    grupo: 6,
    nat: 'G',
    inv: true,
  },
  { n: '609', nombre: '«Rappels» por compras', grupo: 6, nat: 'G', inv: true },
  { n: '621', nombre: 'Arrendamientos y cánones', grupo: 6, nat: 'G', inv: false },
  { n: '622', nombre: 'Reparaciones y conservación', grupo: 6, nat: 'G', inv: false },
  {
    n: '623',
    nombre: 'Servicios de profesionales independientes',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  { n: '624', nombre: 'Transportes', grupo: 6, nat: 'G', inv: false },
  { n: '625', nombre: 'Primas de seguros', grupo: 6, nat: 'G', inv: false },
  {
    n: '626',
    nombre: 'Servicios bancarios y similares',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  {
    n: '627',
    nombre: 'Publicidad, propaganda y relaciones públicas',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  { n: '628', nombre: 'Suministros', grupo: 6, nat: 'G', inv: false },
  { n: '629', nombre: 'Otros servicios', grupo: 6, nat: 'G', inv: false },
  { n: '630', nombre: 'Impuesto sobre beneficios', grupo: 6, nat: 'G', inv: false },
  { n: '631', nombre: 'Otros tributos', grupo: 6, nat: 'G', inv: false },
  { n: '640', nombre: 'Sueldos y salarios', grupo: 6, nat: 'G', inv: false },
  {
    n: '642',
    nombre: 'Seguridad Social a cargo de la empresa',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  {
    n: '650',
    nombre: 'Pérdidas de créditos comerciales incobrables',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  { n: '662', nombre: 'Intereses de deudas', grupo: 6, nat: 'G', inv: false },
  {
    n: '671',
    nombre: 'Pérdidas procedentes del inmovilizado material',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  { n: '678', nombre: 'Gastos excepcionales', grupo: 6, nat: 'G', inv: false },
  {
    n: '681',
    nombre: 'Amortización del inmovilizado material',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  {
    n: '691',
    nombre: 'Pérdidas por deterioro del inmovilizado material',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  {
    n: '693',
    nombre: 'Pérdidas por deterioro de existencias',
    grupo: 6,
    nat: 'G',
    inv: false,
  },
  {
    n: '694',
    nombre: 'Pérdidas por deterioro de créditos por operaciones comerciales',
    grupo: 6,
    nat: 'G',
    inv: false,
  },

  // Ingresos (I)
  { n: '700', nombre: 'Ventas de mercaderías', grupo: 7, nat: 'I', inv: false },
  {
    n: '706',
    nombre: 'Descuentos sobre ventas por pronto pago',
    grupo: 7,
    nat: 'I',
    inv: true,
  },
  {
    n: '708',
    nombre: 'Devoluciones de ventas y operaciones similares',
    grupo: 7,
    nat: 'I',
    inv: true,
  },
  { n: '709', nombre: '«Rappels» sobre ventas', grupo: 7, nat: 'I', inv: true },
  { n: '752', nombre: 'Ingresos por arrendamientos', grupo: 7, nat: 'I', inv: false },
  {
    n: '760',
    nombre: 'Ingresos de participaciones en instrumentos de patrimonio',
    grupo: 7,
    nat: 'I',
    inv: false,
  },
  {
    n: '761',
    nombre: 'Ingresos de valores representativos de deuda',
    grupo: 7,
    nat: 'I',
    inv: false,
  },
  {
    n: '771',
    nombre: 'Beneficios procedentes del inmovilizado material',
    grupo: 7,
    nat: 'I',
    inv: false,
  },
  {
    n: '791',
    nombre: 'Reversión del deterioro del inmovilizado material',
    grupo: 7,
    nat: 'I',
    inv: false,
  },
  {
    n: '793',
    nombre: 'Reversión del deterioro de existencias',
    grupo: 7,
    nat: 'I',
    inv: false,
  },
  {
    n: '794',
    nombre: 'Reversión del deterioro de créditos por operaciones comerciales',
    grupo: 7,
    nat: 'I',
    inv: false,
  },
  { n: '795', nombre: 'Exceso de provisiones', grupo: 7, nat: 'I', inv: false },

  // Mixtas (M)
  {
    n: '610',
    nombre: 'Variación de existencias de mercaderías',
    grupo: 6,
    nat: 'M',
    inv: false,
  },
];

const CUENTAS: CuentaPGC[] = [...CUENTAS_RAW].sort((a, b) =>
  a.n.localeCompare(b.n)
);

const POR_NUMERO = new Map<string, CuentaPGC>(CUENTAS.map((c) => [c.n, c]));

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const PGC = Object.assign([...CUENTAS], {
  cuentas: CUENTAS,

  get(n: string): CuentaPGC | undefined {
    return POR_NUMERO.get(String(n).trim());
  },

  nombre(n: string): string {
    return POR_NUMERO.get(String(n).trim())?.nombre ?? '';
  },

  porGrupo(g: number | string): CuentaPGC[] {
    const grupoNum = Number(g);
    return CUENTAS.filter((c) => c.grupo === grupoNum);
  },

  buscar(texto: string, max = 8): CuentaPGC[] {
    const q = normalizar(texto);
    if (!q) {
      return CUENTAS.slice(0, max);
    }

    const palabras = q.split(/\s+/).filter(Boolean);

    const puntuadas: Array<{ cuenta: CuentaPGC; score: number }> = [];

    for (const c of CUENTAS) {
      const nNorm = normalizar(c.n);
      const nomNorm = normalizar(c.nombre);
      const todo = `${nNorm} ${nomNorm}`;

      if (!palabras.every((p) => todo.includes(p))) {
        continue;
      }

      let score = 50;
      if (nNorm === q || nomNorm === q) {
        score = 0;
      } else if (nNorm.startsWith(q)) {
        score = 10;
      } else if (nomNorm.startsWith(q)) {
        score = 20;
      } else {
        const palabrasNombre = nomNorm.split(/[\s,«»/]+/).filter(Boolean);
        const todasPrefijo = palabras.every((p) =>
          palabrasNombre.some((w) => w.startsWith(p)) || nNorm.startsWith(p)
        );
        score = todasPrefijo ? 30 : 40;
      }

      puntuadas.push({ cuenta: c, score });
    }

    puntuadas.sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.cuenta.n.localeCompare(b.cuenta.n);
    });

    return puntuadas.slice(0, max).map((x) => x.cuenta);
  },
});

export const NATURALEZA_LABEL: Record<NaturalezaPGC, string> = {
  A: 'Activo',
  P: 'Pasivo',
  PN: 'Patrimonio neto',
  G: 'Gasto',
  I: 'Ingreso',
  M: 'Mixta',
};
