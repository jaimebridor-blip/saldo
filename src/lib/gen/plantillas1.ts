import { Fmt } from '../fmt';
import type { Plantilla } from '../gen';
import type { Asiento, Ejercicio } from '../types';

export const PLANTILLAS_1: Plantilla[] = [
  // =========================================================================
  // CONCEPTOS Y PGC
  // =========================================================================
  {
    id: 'C1',
    tema: 'conceptos',
    nombre: 'Ecuación fundamental del balance',
    nivel: 1,
    hacer(rng, ctx): Ejercicio | null {
      const capital = rng.entero(20000, 60000, 1000);
      const reservas = rng.entero(2000, 5000, 500);
      const resultado = rng.entero(1000, 5000, 500);
      const proveedores = rng.entero(3000, 12000, 500);
      const deudaLP = rng.entero(5000, 25000, 1000);

      const caja = rng.entero(500, 2500, 500);
      const bancos = rng.entero(3000, 15000, 500);
      const mercaderias = rng.entero(2000, 10000, 500);
      const maquinaria = rng.entero(12000, 35000, 1000);
      const amortAcum = rng.entero(2000, 8000, 500);

      if (amortAcum >= maquinaria) {
        return null;
      }

      const pn = ctx.r2(capital + reservas + resultado);
      const pasivo = ctx.r2(proveedores + deudaLP);
      const activo = ctx.r2(pn + pasivo);
      const clientes = ctx.r2(
        activo - (caja + bancos + mercaderias + maquinaria - amortAcum)
      );

      // Exige Clientes > 0
      if (clientes <= 0) {
        return null;
      }

      const enunciado =
        `${ctx.empresa}. A 31/12/${ctx.anio}, la empresa presenta los siguientes elementos patrimoniales: ` +
        `Maquinaria por ${Fmt.eur(maquinaria)} (con una amortización acumulada de ${Fmt.eur(amortAcum)}), ` +
        `Mercaderías por ${Fmt.eur(mercaderias)}, Clientes por ${Fmt.eur(clientes)}, ` +
        `Bancos c/c por ${Fmt.eur(bancos)}, Caja por ${Fmt.eur(caja)}, ` +
        `Deudas a largo plazo con entidades de crédito por ${Fmt.eur(deudaLP)}, ` +
        `Proveedores por ${Fmt.eur(proveedores)}, Capital social por ${Fmt.eur(capital)} ` +
        `y Reservas voluntarias por ${Fmt.eur(reservas)}. ` +
        `Calcula el Activo total, el Pasivo total, el Patrimonio neto y el Resultado del ejercicio.`;

      return {
        id: '',
        tema: 'conceptos',
        nivel: 1,
        titulo: 'Ecuación fundamental del balance',
        enunciado,
        inicial: null,
        asientos: [],
        calc: [
          { etiqueta: 'Activo total', valor: activo },
          { etiqueta: 'Pasivo total', valor: pasivo },
          { etiqueta: 'Patrimonio neto', valor: pn },
          { etiqueta: 'Resultado del ejercicio', valor: resultado },
        ],
        nota: 'Activo = Patrimonio neto + Pasivo. La amortización acumulada (281) minora el Activo. El resultado del ejercicio completa el Patrimonio neto.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'C2',
    tema: 'conceptos',
    nombre: 'Masas patrimoniales del balance',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const catalogo = [
        {
          id: 'terrenos',
          etiqueta: 'Terrenos y bienes naturales',
          masa: 'ANC' as const,
          signo: 1,
          valor: rng.entero(15000, 40000, 1000),
        },
        {
          id: 'construcciones',
          etiqueta: 'Construcciones',
          masa: 'ANC' as const,
          signo: 1,
          valor: rng.entero(30000, 80000, 1000),
        },
        {
          id: 'amort',
          etiqueta: 'Amortización acumulada del inmovilizado material',
          masa: 'ANC' as const,
          signo: -1,
          valor: rng.entero(4000, 18000, 1000),
        },
        {
          id: 'existencias',
          etiqueta: 'Existencias de mercaderías',
          masa: 'AC' as const,
          signo: 1,
          valor: rng.entero(4000, 16000, 1000),
        },
        {
          id: 'clientes',
          etiqueta: 'Clientes',
          masa: 'AC' as const,
          signo: 1,
          valor: rng.entero(5000, 20000, 1000),
        },
        {
          id: 'bancos',
          etiqueta: 'Bancos c/c',
          masa: 'AC' as const,
          signo: 1,
          valor: rng.entero(6000, 25000, 1000),
        },
        {
          id: 'proveedores',
          etiqueta: 'Proveedores',
          masa: 'PC' as const,
          signo: 1,
          valor: rng.entero(3000, 14000, 1000),
        },
        {
          id: 'deudasLP',
          etiqueta: 'Deudas a largo plazo con entidades de crédito',
          masa: 'PNC' as const,
          signo: 1,
          valor: rng.entero(10000, 35000, 1000),
        },
        {
          id: 'deudasCP',
          etiqueta: 'Deudas a corto plazo con entidades de crédito',
          masa: 'PC' as const,
          signo: 1,
          valor: rng.entero(2000, 10000, 1000),
        },
        {
          id: 'acreedores',
          etiqueta: 'Acreedores por prestaciones de servicios',
          masa: 'PC' as const,
          signo: 1,
          valor: rng.entero(1000, 6000, 1000),
        },
      ];

      const nElementos = rng.entero(8, 10, 1);
      const obligatorios = catalogo.filter(
        (e) => e.id === 'construcciones' || e.id === 'amort'
      );
      const opcionales = rng.barajar(
        catalogo.filter((e) => e.id !== 'construcciones' && e.id !== 'amort')
      );
      const elegidos = rng.barajar([
        ...obligatorios,
        ...opcionales.slice(0, nElementos - obligatorios.length),
      ]);

      let anc = 0;
      let ac = 0;
      let pnc = 0;
      let pc = 0;

      for (const el of elegidos) {
        if (el.masa === 'ANC') anc += el.signo * el.valor;
        if (el.masa === 'AC') ac += el.valor;
        if (el.masa === 'PNC') pnc += el.valor;
        if (el.masa === 'PC') pc += el.valor;
      }

      anc = ctx.r2(anc);
      ac = ctx.r2(ac);
      pnc = ctx.r2(pnc);
      pc = ctx.r2(pc);
      const pn = ctx.r2(anc + ac - (pnc + pc));

      // Exige masas coherentes y PN positivo
      if (anc <= 0 || ac <= 0 || pn <= 0 || pnc + pc <= 0) {
        return null;
      }

      const listaTexto = elegidos
        .map((el) => `${el.etiqueta}: ${Fmt.eur(el.valor)}`)
        .join('; ');

      const enunciado =
        `${ctx.empresa}. A 31/12/${ctx.anio}, la empresa presenta los siguientes saldos (en euros): ${listaTexto}. ` +
        `Clasifica las masas patrimoniales y calcula el Activo no corriente (neto de amortización), el Activo corriente, el Pasivo no corriente, el Pasivo corriente y el Patrimonio neto.`;

      return {
        id: '',
        tema: 'conceptos',
        nivel: 2,
        titulo: 'Masas patrimoniales del balance',
        enunciado,
        inicial: null,
        asientos: [],
        calc: [
          { etiqueta: 'Activo no corriente', valor: anc },
          { etiqueta: 'Activo corriente', valor: ac },
          { etiqueta: 'Pasivo no corriente', valor: pnc },
          { etiqueta: 'Pasivo corriente', valor: pc },
          { etiqueta: 'Patrimonio neto', valor: pn },
        ],
        nota: 'La amortización acumulada resta dentro del Activo no corriente. El Patrimonio neto se obtiene por diferencia: Activo total − Pasivo total.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'C3',
    tema: 'conceptos',
    nombre: 'Asiento de apertura con cifra de cierre',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const c572 = rng.entero(8000, 25000, 1000);
      const c430 = rng.entero(4000, 15000, 500);
      const c300 = rng.entero(5000, 18000, 500);
      const c213 = rng.entero(20000, 50000, 1000);
      const c281 = rng.entero(3000, 12000, 500);
      const c400 = rng.entero(3000, 12000, 500);
      const c170 = rng.entero(5000, 20000, 1000);
      const c100 = rng.entero(18000, 42000, 1000);

      if (c281 >= c213) {
        return null;
      }

      const totalDebe = ctx.r2(c572 + c430 + c300 + c213);
      const haberConocido = ctx.r2(c281 + c400 + c170 + c100);
      const c113 = ctx.r2(totalDebe - haberConocido);

      // Exige 113 > 0
      if (c113 <= 0) {
        return null;
      }

      const fecha = ctx.fecha(1, 1);
      const asiento: Asiento = {
        fecha,
        concepto: 'Asiento de apertura del ejercicio',
        lineas: [
          {
            c: '213',
            d: c213,
            h: 0,
            por: 'Saldo deudor de inmovilizado material al inicio del ejercicio',
          },
          {
            c: '300',
            d: c300,
            h: 0,
            por: 'Existencias iniciales en almacén',
          },
          {
            c: '430',
            d: c430,
            h: 0,
            por: 'Derechos de cobro sobre clientes',
          },
          {
            c: '572',
            d: c572,
            h: 0,
            por: 'Efectivo en cuentas corrientes bancarias',
          },
          {
            c: '100',
            d: 0,
            h: c100,
            por: 'Capital social (patrimonio neto, saldo acreedor)',
          },
          {
            c: '113',
            d: 0,
            h: c113,
            por: 'Reservas voluntarias (cifra de cierre del balance inicial)',
          },
          {
            c: '170',
            d: 0,
            h: c170,
            por: 'Deudas bancarias a largo plazo',
          },
          {
            c: '281',
            d: 0,
            h: c281,
            por: 'Amortización acumulada (cuenta correctora de activo, va al Haber)',
          },
          {
            c: '400',
            d: 0,
            h: c400,
            por: 'Deudas pendientes con proveedores',
          },
        ],
      };

      const enunciado =
        `${ctx.empresa}. 1) ${fecha}: la empresa inicia el ejercicio con el siguiente inventario patrimonial: ` +
        `Maquinaria ${Fmt.eur(c213)}, Amortización acumulada del inmovilizado material ${Fmt.eur(c281)}, ` +
        `Mercaderías ${Fmt.eur(c300)}, Clientes ${Fmt.eur(c430)}, Bancos c/c ${Fmt.eur(c572)}, ` +
        `Proveedores ${Fmt.eur(c400)}, Deudas a largo plazo con entidades de crédito ${Fmt.eur(c170)}, ` +
        `Capital social ${Fmt.eur(c100)} y Reservas voluntarias por el importe necesario para cuadrar el balance. ` +
        `Determina las reservas voluntarias y redacta el asiento de apertura.`;

      return {
        id: '',
        tema: 'conceptos',
        nivel: 2,
        titulo: 'Asiento de apertura del ejercicio',
        enunciado,
        inicial: null,
        asientos: [asiento],
        calc: [
          { etiqueta: 'Reservas voluntarias (113)', valor: c113 },
          { etiqueta: 'Total Debe = Total Haber', valor: totalDebe },
        ],
        nota: 'En el asiento de apertura se cargan las cuentas de Activo y se abonan las de Patrimonio neto, Pasivo y las correctoras de Activo (como la 281).',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // CUADRO DE CUENTAS
  // =========================================================================
  {
    id: 'Q1',
    tema: 'cuadro',
    nombre: 'Servicios exteriores y tributos',
    nivel: 1,
    hacer(rng, ctx): Ejercicio | null {
      const catalogoServicios = [
        { c: '621', desc: 'alquiler del local comercial' },
        { c: '622', desc: 'reparación de la maquinaria del taller' },
        { c: '623', desc: 'minuta de la asesoría jurídica' },
        { c: '624', desc: 'transporte de mercancías a cargo de la empresa' },
        { c: '627', desc: 'campaña de publicidad local' },
        { c: '628', desc: 'factura del suministro eléctrico' },
        { c: '629', desc: 'servicios diversos de mensajería y oficina' },
      ];

      const elegidos = rng.barajar(catalogoServicios).slice(0, 3);
      const tributoPendiente = rng.next() < 0.5;
      const tributoBase = rng.entero(400, 2000, 100);

      const asientos: Asiento[] = [];
      const textosOperaciones: string[] = [];

      let totalServicios = 0;
      let totalIva = 0;
      let total410 = 0;

      elegidos.forEach((serv, idx) => {
        const base = rng.entero(500, 3000, 100);
        const iva = ctx.r2(base * 0.21);
        const total = ctx.r2(base + iva);
        const fecha = ctx.fecha(5 + idx * 6, 3);

        totalServicios = ctx.r2(totalServicios + base);
        totalIva = ctx.r2(totalIva + iva);
        total410 = ctx.r2(total410 + total);

        textosOperaciones.push(
          `${idx + 1}) ${fecha}: recibe factura a crédito por ${serv.desc} con base imponible de ${Fmt.eur(base)} más 21 % de IVA.`
        );

        asientos.push({
          fecha,
          concepto: `Factura de ${serv.desc}`,
          lineas: [
            {
              c: serv.c,
              d: base,
              h: 0,
              por: 'Gasto por servicio exterior (subgrupo 62)',
            },
            {
              c: '472',
              d: iva,
              h: 0,
              por: 'IVA soportado deducible al 21 %',
            },
            {
              c: '410',
              d: 0,
              h: total,
              por: 'Deuda con acreedores por prestaciones de servicios',
            },
          ],
        });
      });

      const fechaTributo = ctx.fecha(25, 3);
      const cuentaPagoTributo = tributoPendiente ? '410' : '572';
      if (tributoPendiente) {
        total410 = ctx.r2(total410 + tributoBase);
      }

      textosOperaciones.push(
        `4) ${fechaTributo}: devengo de un impuesto municipal (IBI, sin IVA) por ${Fmt.eur(tributoBase)}, ${
          tributoPendiente ? 'que queda pendiente de pago' : 'pagado mediante transferencia bancaria'
        }.`
      );

      asientos.push({
        fecha: fechaTributo,
        concepto: 'Devengo de otros tributos',
        lineas: [
          {
            c: '631',
            d: tributoBase,
            h: 0,
            por: 'Tributo distinto del impuesto sobre beneficios (cuenta 631)',
          },
          {
            c: cuentaPagoTributo,
            d: 0,
            h: tributoBase,
            por: tributoPendiente
              ? 'Obligación pendiente de pago'
              : 'Pago inmediato por cuenta bancaria',
          },
        ],
      });

      return {
        id: '',
        tema: 'cuadro',
        nivel: 1,
        titulo: 'Servicios exteriores y tributos',
        enunciado: `${ctx.empresa} (IVA 21 %). ${textosOperaciones.join(' ')}`,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Total servicios exteriores (sin IVA)', valor: totalServicios },
          { etiqueta: 'Total IVA soportado (472)', valor: totalIva },
          { etiqueta: 'Otros tributos (631)', valor: tributoBase },
          { etiqueta: 'Total acreedores (410)', valor: total410 },
        ],
        nota: 'Los servicios del subgrupo 62 se registran contra Acreedores (410), no contra Proveedores (400). Los tributos municipales van a la 631 sin IVA.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'Q2',
    tema: 'cuadro',
    nombre: 'Balance de sumas y saldos',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const d572 = rng.entero(28000, 60000, 1000);
      const h572 = rng.entero(10000, 22000, 1000);

      const d430 = rng.entero(14000, 32000, 1000);
      const h430 = rng.entero(4000, 11000, 1000);

      const d400 = rng.entero(3000, 9000, 1000);
      const h400 = rng.entero(12000, 24000, 1000);

      const d472 = rng.entero(2000, 5000, 500);
      const h472 = rng.entero(0, 500, 500);

      const d477 = rng.entero(0, 500, 500);
      const h477 = rng.entero(3000, 7500, 500);

      const d600 = rng.entero(14000, 32000, 1000);
      const h600 = 0;

      const d700 = 0;
      const h700 = rng.entero(20000, 42000, 1000);

      const totalSumasDebe = ctx.r2(d572 + d430 + d400 + d472 + d477 + d600 + d700);
      const sumasHaberSin100 = ctx.r2(h572 + h430 + h400 + h472 + h477 + h600 + h700);
      const h100 = ctx.r2(totalSumasDebe - sumasHaberSin100);

      if (h100 < 5000) {
        return null;
      }

      const saldo572 = ctx.r2(d572 - h572);
      const saldo430 = ctx.r2(d430 - h430);
      const saldo400 = ctx.r2(h400 - d400);
      const saldo472 = ctx.r2(d472 - h472);
      const saldo477 = ctx.r2(h477 - d477);
      const saldo600 = ctx.r2(d600 - h600);
      const saldo700 = ctx.r2(h700 - d700);

      const totalSaldosDeudores = ctx.r2(
        saldo572 + saldo430 + saldo472 + saldo600
      );

      const filas = [
        `100 Capital social: Debe 0 €, Haber ?`,
        `400 Proveedores: Debe ${Fmt.eur(d400)}, Haber ${Fmt.eur(h400)}`,
        `430 Clientes: Debe ${Fmt.eur(d430)}, Haber ${Fmt.eur(h430)}`,
        `472 H.P. IVA soportado: Debe ${Fmt.eur(d472)}, Haber ${Fmt.eur(h472)}`,
        `477 H.P. IVA repercutido: Debe ${Fmt.eur(d477)}, Haber ${Fmt.eur(h477)}`,
        `572 Bancos c/c: Debe ${Fmt.eur(d572)}, Haber ${Fmt.eur(h572)}`,
        `600 Compras de mercaderías: Debe ${Fmt.eur(d600)}, Haber ${Fmt.eur(h600)}`,
        `700 Ventas de mercaderías: Debe ${Fmt.eur(d700)}, Haber ${Fmt.eur(h700)}`,
      ];

      return {
        id: '',
        tema: 'cuadro',
        nivel: 2,
        titulo: 'Balance de comprobación de sumas y saldos',
        enunciado:
          `${ctx.empresa}. Con las siguientes sumas acumuladas a 31/12/${ctx.anio}: ${filas.join(' | ')}. ` +
          `Determina el Capital social (100) como cifra de cierre, los saldos de Bancos (572), Proveedores (400) y Ventas (700) con su sentido, el total de sumas y el total de saldos deudores.`,
        inicial: null,
        asientos: [],
        calc: [
          { etiqueta: 'Capital social (100, saldo acreedor)', valor: h100 },
          { etiqueta: 'Saldo 572 Bancos (Deudor)', valor: saldo572 },
          { etiqueta: 'Saldo 400 Proveedores (Acreedor)', valor: saldo400 },
          { etiqueta: 'Saldo 700 Ventas (Acreedor)', valor: saldo700 },
          { etiqueta: 'Total sumas (Debe = Haber)', valor: totalSumasDebe },
          { etiqueta: 'Total saldos deudores', valor: totalSaldosDeudores },
        ],
        nota: 'En el balance de sumas y saldos siempre coincide Total Sumas Debe = Total Sumas Haber y Total Saldos Deudores = Total Saldos Acreedores.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'Q3',
    tema: 'cuadro',
    nombre: 'Cuentas de sentido inverso (devoluciones y rappels)',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const b = rng.entero(600, 4000, 100);
      const ivaB = ctx.r2(b * 0.21);
      const totalB = ctx.r2(b + ivaB);

      const bv = rng.entero(800, 4500, 100);
      const ivaBv = ctx.r2(bv * 0.21);
      const totalBv = ctx.r2(bv + ivaBv);

      const r = rng.entero(400, 2500, 100);
      const ivaR = ctx.r2(r * 0.21);
      const totalR = ctx.r2(r + ivaR);

      const f1 = ctx.fecha(4, 4);
      const f2 = ctx.fecha(12, 4);
      const f3 = ctx.fecha(28, 4);

      const asientos: Asiento[] = [
        {
          fecha: f1,
          concepto: 'Devolución de compras de mercaderías',
          lineas: [
            {
              c: '400',
              d: totalB,
              h: 0,
              por: 'Disminución de la deuda con el proveedor',
            },
            {
              c: '608',
              d: 0,
              h: b,
              por: 'Devolución de compras (gasto de sentido inverso, va al Haber)',
            },
            {
              c: '472',
              d: 0,
              h: ivaB,
              por: 'Rectificación del IVA soportado',
            },
          ],
        },
        {
          fecha: f2,
          concepto: 'Devolución de ventas de mercaderías',
          lineas: [
            {
              c: '708',
              d: bv,
              h: 0,
              por: 'Devolución de ventas (ingreso de sentido inverso, va al Debe)',
            },
            {
              c: '477',
              d: ivaBv,
              h: 0,
              por: 'Rectificación del IVA repercutido',
            },
            {
              c: '430',
              d: 0,
              h: totalBv,
              por: 'Disminución del derecho de cobro sobre el cliente',
            },
          ],
        },
        {
          fecha: f3,
          concepto: 'Rappel sobre ventas fuera de factura',
          lineas: [
            {
              c: '709',
              d: r,
              h: 0,
              por: 'Rappel sobre ventas (ingreso de sentido inverso, va al Debe)',
            },
            {
              c: '477',
              d: ivaR,
              h: 0,
              por: 'Rectificación del IVA repercutido correspondiente al rappel',
            },
            {
              c: '430',
              d: 0,
              h: totalR,
              por: 'Menor saldo a cobrar al cliente',
            },
          ],
        },
      ];

      const enunciado =
        `${ctx.empresa} (IVA 21 %). ` +
        `1) ${f1}: devuelve mercaderías defectuosas a un proveedor por importe base de ${Fmt.eur(b)} (operación a crédito). ` +
        `2) ${f2}: un cliente devuelve géneros vendidos a crédito por base imponible de ${Fmt.eur(bv)}. ` +
        `3) ${f3}: concede a un cliente habitual un descuento por volumen de pedidos («rappel») fuera de factura por ${Fmt.eur(r)}.`;

      return {
        id: '',
        tema: 'cuadro',
        nivel: 2,
        titulo: 'Devoluciones y rappels (sentido inverso)',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Menor deuda con proveedores (op. 1)', valor: totalB },
          { etiqueta: 'Menor crédito con clientes por devolución (op. 2)', valor: totalBv },
          { etiqueta: 'Menor crédito con clientes por rappel (op. 3)', valor: totalR },
        ],
        nota: 'Las devoluciones y rappels de compras (608, 609) nacen en el Haber; las de ventas (708, 709), en el Debe, ajustando siempre su IVA correspondiente.',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // COMPRAS/VENTAS E IVA
  // =========================================================================
  {
    id: 'V1',
    tema: 'compras',
    nombre: 'Compra con descuentos en factura y pago',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const precioLista = rng.entero(4000, 20000, 1000);
      const dPct = rng.pick([5, 10, 15]);
      const pPct = rng.pick([1, 2, 3]);
      const variante606 = rng.next() < 0.25;

      const trasComercial = ctx.r2(precioLista * (1 - dPct / 100));
      const descuentoPP = ctx.r2(trasComercial * (pPct / 100));
      const base = ctx.r2(trasComercial - descuentoPP);
      const iva = ctx.r2(base * 0.21);
      const total = ctx.r2(base + iva);

      const f1 = ctx.fecha(8, 5);
      const f2 = ctx.fecha(15, 5);

      const asientoCompra: Asiento = variante606
        ? {
            fecha: f1,
            concepto: 'Compra con pronto pago contabilizado en la 606',
            lineas: [
              {
                c: '600',
                d: trasComercial,
                h: 0,
                por: 'Importe de la compra tras el descuento comercial',
              },
              {
                c: '472',
                d: iva,
                h: 0,
                por: 'IVA soportado al 21 % sobre la base neta',
              },
              {
                c: '606',
                d: 0,
                h: descuentoPP,
                por: 'Descuento por pronto pago en la cuenta 606',
              },
              {
                c: '400',
                d: 0,
                h: total,
                por: 'Deuda total con el proveedor',
              },
            ],
          }
        : {
            fecha: f1,
            concepto: 'Compra de mercaderías con descuentos en factura',
            lineas: [
              {
                c: '600',
                d: base,
                h: 0,
                por: 'Importe neto tras aplicar ambos descuentos en factura',
              },
              {
                c: '472',
                d: iva,
                h: 0,
                por: 'IVA soportado deducible (21 %)',
              },
              {
                c: '400',
                d: 0,
                h: total,
                por: 'Total factura pendiente hasta el pago',
              },
            ],
          };

      const asientoPago: Asiento = {
        fecha: f2,
        concepto: 'Pago al proveedor por banco',
        lineas: [
          {
            c: '400',
            d: total,
            h: 0,
            por: 'Cancelación de la deuda con el proveedor',
          },
          {
            c: '572',
            d: 0,
            h: total,
            por: 'Salida de fondos de la cuenta bancaria',
          },
        ],
      };

      const textoVariante = variante606
        ? ' Contabiliza el pronto pago en la cuenta 606.'
        : '';

      const enunciado =
        `${ctx.empresa} (IVA 21 %). ` +
        `1) ${f1}: compra mercaderías a crédito con un precio de catálogo de ${Fmt.eur(precioLista)}. ` +
        `En la propia factura figura un descuento comercial del ${dPct} % y un descuento por pronto pago del ${pPct} % aplicado sobre el importe ya rebajado.${textoVariante} ` +
        `2) ${f2}: paga la factura mediante transferencia bancaria.`;

      return {
        id: '',
        tema: 'compras',
        nivel: 2,
        titulo: 'Compra con descuentos en factura',
        enunciado,
        inicial: null,
        asientos: [asientoCompra, asientoPago],
        calc: [
          { etiqueta: 'Importe tras descuento comercial', valor: trasComercial },
          { etiqueta: 'Base imponible (tras ambos descuentos)', valor: base },
          { etiqueta: 'IVA soportado (21 %)', valor: iva },
          { etiqueta: 'Total factura', valor: total },
        ],
        nota: 'Los descuentos incluidos en factura (comerciales y por pronto pago) reducen el precio de adquisición en la 600, salvo que se indique explícitamente usar la 606.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'V2',
    tema: 'compras',
    nombre: 'Compra con descuentos fuera de factura',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const precioLista = rng.entero(6000, 20000, 1000);
      const dPct = rng.pick([5, 10, 15]);
      const pPct = rng.pick([2, 3, 5]);

      const b = ctx.r2(precioLista * (1 - dPct / 100));
      const ivaCompra = ctx.r2(b * 0.21);
      const totalCompra = ctx.r2(b + ivaCompra);

      const x = ctx.r2(b * (pPct / 100));
      const ivaPP = ctx.r2(x * 0.21);
      const totalPP = ctx.r2(x + ivaPP);
      const pagadoBanco = ctx.r2(totalCompra - totalPP);

      const r = rng.entero(500, 2500, 100);
      const ivaR = ctx.r2(r * 0.21);
      const totalR = ctx.r2(r + ivaR);

      if (pagadoBanco <= 0) {
        return null;
      }

      const f1 = ctx.fecha(10, 6);
      const f2 = ctx.fecha(20, 6);
      const f3 = ctx.fecha(30, 12);

      const asientos: Asiento[] = [
        {
          fecha: f1,
          concepto: 'Compra de mercaderías con descuento comercial en factura',
          lineas: [
            {
              c: '600',
              d: b,
              h: 0,
              por: 'Compra neta tras el descuento comercial en factura',
            },
            {
              c: '472',
              d: ivaCompra,
              h: 0,
              por: 'IVA soportado al 21 %',
            },
            {
              c: '400',
              d: 0,
              h: totalCompra,
              por: 'Deuda inicial con el proveedor',
            },
          ],
        },
        {
          fecha: f2,
          concepto: 'Pago anticipado con descuento por pronto pago fuera de factura',
          lineas: [
            {
              c: '400',
              d: totalCompra,
              h: 0,
              por: 'Cancelación total de la deuda con el proveedor',
            },
            {
              c: '606',
              d: 0,
              h: x,
              por: 'Descuento por pronto pago fuera de factura (606)',
            },
            {
              c: '472',
              d: 0,
              h: ivaPP,
              por: 'Rectificación del IVA soportado del descuento',
            },
            {
              c: '572',
              d: 0,
              h: pagadoBanco,
              por: 'Importe neto pagado por banco',
            },
          ],
        },
        {
          fecha: f3,
          concepto: 'Rappel sobre compras fuera de factura',
          lineas: [
            {
              c: '400',
              d: totalR,
              h: 0,
              por: 'Reducción de saldo pendiente o abono del proveedor',
            },
            {
              c: '609',
              d: 0,
              h: r,
              por: 'Rappel sobre compras fuera de factura (609)',
            },
            {
              c: '472',
              d: 0,
              h: ivaR,
              por: 'Rectificación del IVA soportado sobre el rappel',
            },
          ],
        },
      ];

      const enunciado =
        `${ctx.empresa} (IVA 21 %). ` +
        `1) ${f1}: compra mercaderías a crédito por un precio bruto de ${Fmt.eur(precioLista)} con un descuento comercial en factura del ${dPct} %. ` +
        `2) ${f2}: paga anticipadamente por banco, obteniendo un descuento por pronto pago del ${pPct} % fuera de factura sobre la base de la compra. ` +
        `3) ${f3}: al cierre del ejercicio, el proveedor concede un «rappel» fuera de factura por volumen de pedidos de ${Fmt.eur(r)} (registrado en cuenta de proveedores).`;

      return {
        id: '',
        tema: 'compras',
        nivel: 3,
        titulo: 'Compra con descuentos fuera de factura',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Base compra inicial', valor: b },
          { etiqueta: 'Total factura inicial', valor: totalCompra },
          { etiqueta: 'Pronto pago fuera de factura (606)', valor: x },
          { etiqueta: 'Importe pagado por banco (572)', valor: pagadoBanco },
          { etiqueta: 'Abono total del rappel (con IVA)', valor: totalR },
        ],
        nota: 'Los descuentos fuera de factura siempre se registran en sus cuentas específicas (606 pronto pago, 609 rappels) rectificando el IVA soportado (472) al Haber.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'V3',
    tema: 'compras',
    nombre: 'Venta con devolución y pronto pago posterior',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const precioV = rng.entero(8000, 24000, 1000);
      const dPct = rng.pick([5, 10, 15]);
      const pPct = rng.pick([2, 3, 5]);

      const bv = ctx.r2(precioV * (1 - dPct / 100));
      const ivaV = ctx.r2(bv * 0.21);
      const totalV = ctx.r2(bv + ivaV);

      const maxDev = Math.floor((bv * 0.4) / 500) * 500;
      if (maxDev < 1000) {
        return null;
      }
      const dev = rng.entero(1000, Math.min(5000, maxDev), 500);
      const ivaDev = ctx.r2(dev * 0.21);
      const totalDev = ctx.r2(dev + ivaDev);

      const baseNeta = ctx.r2(bv - dev);
      const saldoVivo = ctx.r2(totalV - totalDev);

      const x = ctx.r2(baseNeta * (pPct / 100));
      const ivaPP = ctx.r2(x * 0.21);
      const totalPP = ctx.r2(x + ivaPP);
      const cobroBanco = ctx.r2(saldoVivo - totalPP);

      if (baseNeta <= 0 || cobroBanco <= 0) {
        return null;
      }

      const f1 = ctx.fecha(3, 9);
      const f2 = ctx.fecha(9, 9);
      const f3 = ctx.fecha(18, 9);

      const asientos: Asiento[] = [
        {
          fecha: f1,
          concepto: 'Venta de mercaderías a crédito con descuento comercial',
          lineas: [
            {
              c: '430',
              d: totalV,
              h: 0,
              por: 'Derecho de cobro sobre el cliente por el total de la factura',
            },
            {
              c: '700',
              d: 0,
              h: bv,
              por: 'Ingreso por venta neta tras descuento comercial en factura',
            },
            {
              c: '477',
              d: 0,
              h: ivaV,
              por: 'IVA repercutido (21 %)',
            },
          ],
        },
        {
          fecha: f2,
          concepto: 'Devolución parcial de la venta',
          lineas: [
            {
              c: '708',
              d: dev,
              h: 0,
              por: 'Devolución de ventas (menor ingreso)',
            },
            {
              c: '477',
              d: ivaDev,
              h: 0,
              por: 'Rectificación del IVA repercutido por la devolución',
            },
            {
              c: '430',
              d: 0,
              h: totalDev,
              por: 'Reducción del crédito frente al cliente',
            },
          ],
        },
        {
          fecha: f3,
          concepto: 'Cobro anticipado con pronto pago fuera de factura',
          lineas: [
            {
              c: '572',
              d: cobroBanco,
              h: 0,
              por: 'Importe líquido cobrado por banco',
            },
            {
              c: '706',
              d: x,
              h: 0,
              por: 'Descuento por pronto pago fuera de factura sobre base neta',
            },
            {
              c: '477',
              d: ivaPP,
              h: 0,
              por: 'Rectificación del IVA repercutido sobre el descuento',
            },
            {
              c: '430',
              d: 0,
              h: saldoVivo,
              por: 'Cancelación del saldo vivo del cliente',
            },
          ],
        },
      ];

      const enunciado =
        `${ctx.empresa} (IVA 21 %). ` +
        `1) ${f1}: vende mercaderías a crédito por un precio bruto de ${Fmt.eur(precioV)} con un descuento comercial en factura del ${dPct} %. ` +
        `2) ${f2}: el cliente devuelve parte del pedido por una base imponible de ${Fmt.eur(dev)}. ` +
        `3) ${f3}: el cliente paga anticipadamente el resto pendiente por banco, concediéndosele un descuento por pronto pago fuera de factura del ${pPct} % sobre la base neta no devuelta.`;

      return {
        id: '',
        tema: 'compras',
        nivel: 3,
        titulo: 'Venta con devolución y pronto pago',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Base venta inicial', valor: bv },
          { etiqueta: 'Devolución con IVA', valor: totalDev },
          { etiqueta: 'Saldo vivo cliente (430)', valor: saldoVivo },
          { etiqueta: 'Descuento pronto pago (706)', valor: x },
          { etiqueta: 'Cobro neto por banco (572)', valor: cobroBanco },
        ],
        nota: 'El descuento por pronto pago posterior se calcula sobre la base realmente conservada por el cliente (bv − dev) y minora el IVA repercutido (477) en el Debe.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'V4',
    tema: 'compras',
    nombre: 'Venta con descuentos en factura y cobro',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const precioLista = rng.entero(4000, 20000, 1000);
      const dPct = rng.pick([5, 10, 15]);
      const pPct = rng.pick([1, 2, 3]);
      const variante706 = rng.next() < 0.25;

      const trasComercial = ctx.r2(precioLista * (1 - dPct / 100));
      const descuentoPP = ctx.r2(trasComercial * (pPct / 100));
      const base = ctx.r2(trasComercial - descuentoPP);
      const iva = ctx.r2(base * 0.21);
      const total = ctx.r2(base + iva);

      const f1 = ctx.fecha(6, 10);
      const f2 = ctx.fecha(14, 10);

      const asientoVenta: Asiento = variante706
        ? {
            fecha: f1,
            concepto: 'Venta con pronto pago contabilizado en la 706',
            lineas: [
              {
                c: '430',
                d: total,
                h: 0,
                por: 'Derecho de cobro sobre el cliente',
              },
              {
                c: '706',
                d: descuentoPP,
                h: 0,
                por: 'Descuento por pronto pago contabilizado en la 706',
              },
              {
                c: '700',
                d: 0,
                h: trasComercial,
                por: 'Importe de la venta tras el descuento comercial',
              },
              {
                c: '477',
                d: 0,
                h: iva,
                por: 'IVA repercutido (21 % sobre base neta)',
              },
            ],
          }
        : {
            fecha: f1,
            concepto: 'Venta de mercaderías con descuentos en factura',
            lineas: [
              {
                c: '430',
                d: total,
                h: 0,
                por: 'Derecho de cobro por el total de la factura',
              },
              {
                c: '700',
                d: 0,
                h: base,
                por: 'Ingreso neto tras descuentos incluidos en factura',
              },
              {
                c: '477',
                d: 0,
                h: iva,
                por: 'IVA repercutido (21 %)',
              },
            ],
          };

      const asientoCobro: Asiento = {
        fecha: f2,
        concepto: 'Cobro al cliente por banco',
        lineas: [
          {
            c: '572',
            d: total,
            h: 0,
            por: 'Entrada de dinero en la cuenta corriente',
          },
          {
            c: '430',
            d: 0,
            h: total,
            por: 'Cancelación del derecho de cobro',
          },
        ],
      };

      const textoVariante = variante706
        ? ' Contabiliza el pronto pago en la cuenta 706.'
        : '';

      const enunciado =
        `${ctx.empresa} (IVA 21 %). ` +
        `1) ${f1}: vende mercaderías a crédito con un precio de catálogo de ${Fmt.eur(precioLista)}. ` +
        `En la factura figura un descuento comercial del ${dPct} % y un pronto pago del ${pPct} % sobre el importe ya rebajado.${textoVariante} ` +
        `2) ${f2}: cobra la factura por transferencia bancaria.`;

      return {
        id: '',
        tema: 'compras',
        nivel: 2,
        titulo: 'Venta con descuentos en factura',
        enunciado,
        inicial: null,
        asientos: [asientoVenta, asientoCobro],
        calc: [
          { etiqueta: 'Importe tras descuento comercial', valor: trasComercial },
          { etiqueta: 'Base imponible (tras ambos descuentos)', valor: base },
          { etiqueta: 'IVA repercutido (21 %)', valor: iva },
          { etiqueta: 'Total factura a cobrar', valor: total },
        ],
        nota: 'En ventas, los descuentos en factura minoran directamente la 700, salvo indicación expresa de contabilizar el pronto pago en la 706.',
        fuente: 'gen',
      };
    },
  },
];
