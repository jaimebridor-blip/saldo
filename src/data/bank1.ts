import type { Ejercicio } from '../lib/types';

export const BANK1: Ejercicio[] = [
  {
    "id": "E01",
    "tema": "conceptos",
    "nivel": 1,
    "titulo": "Ecuación fundamental del balance",
    "enunciado": "A 31/12/20X6, ACEREPESA, S.A. presenta (en €): Caja y bancos 15.000; Clientes 25.000; Mercaderías 20.000; Maquinaria 80.000; Amortización acumulada de maquinaria 20.000; Proveedores 30.000; Deudas a largo plazo con entidades de crédito 45.000; Capital social 40.000; Reservas 3.000; el resto del patrimonio neto es el resultado del ejercicio. Calcula el total del Activo, el Pasivo, el Patrimonio neto y el resultado del ejercicio.",
    "inicial": null,
    "asientos": [],
    "calc": [
      {"etiqueta":"Total Activo","valor":120000},
      {"etiqueta":"Total Pasivo","valor":75000},
      {"etiqueta":"Patrimonio neto","valor":45000},
      {"etiqueta":"Resultado del ejercicio","valor":2000}
    ],
    "nota": "Activo = PN + Pasivo. La amortización acumulada (281) resta del Activo.",
    "fuente": "banco"
  },
  {
    "id": "E02",
    "tema": "conceptos",
    "nivel": 2,
    "titulo": "Masas patrimoniales",
    "enunciado": "A 31/12/20X6, METALÚRGICA DEL DUERO, S.L. tiene (en €): Terrenos 60.000; Construcciones 90.000; Amortización acumulada de construcciones 18.000; Existencias 14.000; Clientes 22.000; Bancos 12.000; Proveedores 19.000; Deudas a largo plazo 50.000; Deudas a corto plazo con entidades de crédito 10.000; Acreedores por prestaciones de servicios 6.000. Calcula Activo no corriente, Activo corriente, Pasivo no corriente, Pasivo corriente y Patrimonio neto.",
    "inicial": null,
    "asientos": [],
    "calc": [
      {"etiqueta":"Activo no corriente","valor":132000},
      {"etiqueta":"Activo corriente","valor":48000},
      {"etiqueta":"Pasivo no corriente","valor":50000},
      {"etiqueta":"Pasivo corriente","valor":35000},
      {"etiqueta":"Patrimonio neto","valor":95000}
    ],
    "nota": "El inmovilizado se presenta neto de amortización acumulada. PN = Activo − Pasivo.",
    "fuente": "banco"
  },
  {
    "id": "E03",
    "tema": "cuadro",
    "nivel": 1,
    "titulo": "Elegir la cuenta correcta",
    "enunciado": "ELECTRODOMÉSTICOS TORMES, S.A. (IVA 21 %). 1) 02/03/20X6: el despacho Gil y Asociados factura honorarios por 2.000 €, pendientes de pago. 2) 15/03/20X6: recibe la factura de la luz (suministro) por 800 €, pendiente de pago. 3) 20/03/20X6: paga por banco el IBI del local, 1.500 € (sin IVA). 4) 25/03/20X6: recibe factura por una campaña de publicidad de 3.000 €, pendiente de pago.",
    "inicial": null,
    "asientos": [
      { "fecha": "02/03/20X6", "concepto": "Honorarios de abogados", "lineas": [
        {"c":"623","d":2000,"h":0},
        {"c":"472","d":420,"h":0},
        {"c":"410","d":0,"h":2420}
      ] },
      { "fecha": "15/03/20X6", "concepto": "Suministro eléctrico", "lineas": [
        {"c":"628","d":800,"h":0},
        {"c":"472","d":168,"h":0},
        {"c":"410","d":0,"h":968}
      ] },
      { "fecha": "20/03/20X6", "concepto": "Pago del IBI (tributo)", "lineas": [
        {"c":"631","d":1500,"h":0},
        {"c":"572","d":0,"h":1500}
      ] },
      { "fecha": "25/03/20X6", "concepto": "Campaña de publicidad", "lineas": [
        {"c":"627","d":3000,"h":0},
        {"c":"472","d":630,"h":0},
        {"c":"410","d":0,"h":3630}
      ] }
    ],
    "calc": [],
    "nota": "Servicios exteriores 621-629 con IVA soportado (472) y deuda a 410; tributos (631) sin IVA.",
    "fuente": "banco"
  },
  {
    "id": "E04",
    "tema": "cuadro",
    "nivel": 2,
    "titulo": "Sumas y saldos",
    "enunciado": "Sumas del Libro Mayor de CERÁMICAS CASTILLA, S.L. a 30/06/20X6 (Debe / Haber, en €): 572 Bancos 85.000 / 52.000; 430 Clientes 60.500 / 35.000; 400 Proveedores 20.000 / 48.400; 472 IVA soportado 8.400 / 0; 477 IVA repercutido 0 / 10.500; 600 Compras 40.000 / 0; 700 Ventas 0 / 50.000; 100 Capital social 0 / 18.000. Calcula el saldo de 572, 430 y 400 (indicando si es deudor o acreedor), el total de sumas y el total de saldos deudores.",
    "inicial": null,
    "asientos": [],
    "calc": [
      {"etiqueta":"Saldo deudor de 572","valor":33000},
      {"etiqueta":"Saldo deudor de 430","valor":25500},
      {"etiqueta":"Saldo acreedor de 400","valor":28400},
      {"etiqueta":"Total sumas del Debe (= Haber)","valor":213900},
      {"etiqueta":"Total saldos deudores (= acreedores)","valor":106900}
    ],
    "nota": "Saldo = diferencia entre Debe y Haber. Sumas del Debe = sumas del Haber y saldos deudores = acreedores.",
    "fuente": "banco"
  },
  {
    "id": "E05",
    "tema": "compras",
    "nivel": 2,
    "titulo": "Compra con descuentos y rappel",
    "enunciado": "METALÚRGICA DEL DUERO, S.L. (IVA 21 %). 1) 10/03/20X6: compra mercaderías por 20.000 € (precio de lista). La factura incluye un descuento comercial del 5 % y un descuento por pronto pago del 2 % (sobre el importe ya rebajado); pago a 30 días. 2) 09/04/20X6: paga la factura por banco. 3) 31/12/20X6: el proveedor concede un «rappel» de 1.000 € (base imponible) por volumen de compras, fuera de factura, que queda como saldo a favor de la empresa en la cuenta del proveedor, a descontar de próximas compras.",
    "inicial": null,
    "asientos": [
      { "fecha": "10/03/20X6", "concepto": "Compra", "lineas": [
        {"c":"600","d":18620,"h":0},
        {"c":"472","d":3910.2,"h":0},
        {"c":"400","d":0,"h":22530.2}
      ] },
      { "fecha": "09/04/20X6", "concepto": "Pago al proveedor", "lineas": [
        {"c":"400","d":22530.2,"h":0},
        {"c":"572","d":0,"h":22530.2}
      ] },
      { "fecha": "31/12/20X6", "concepto": "«Rappel» fuera de factura", "lineas": [
        {"c":"400","d":1210,"h":0},
        {"c":"609","d":0,"h":1000},
        {"c":"472","d":0,"h":210}
      ] }
    ],
    "calc": [],
    "nota": "Descuentos EN factura reducen la base del IVA y no se registran aparte. El «rappel» fuera de factura va a 609 con ajuste del IVA soportado (472).",
    "fuente": "banco"
  },
  {
    "id": "E06",
    "tema": "compras",
    "nivel": 3,
    "titulo": "Venta con devolución y pronto pago",
    "enunciado": "ELECTRODOMÉSTICOS TORMES, S.A. (IVA 21 %). 1) 05/05/20X6: vende mercaderías por 30.000 € (precio de lista) con un descuento comercial del 10 % en factura; cobro a 60 días. 2) 12/05/20X6: el cliente devuelve mercaderías cuya base imponible es 2.000 €. 3) 15/05/20X6: el cliente paga el resto por banco y se le concede un descuento por pronto pago del 2 % sobre la base neta, fuera de factura.",
    "inicial": null,
    "asientos": [
      { "fecha": "05/05/20X6", "concepto": "Venta", "lineas": [
        {"c":"430","d":32670,"h":0},
        {"c":"700","d":0,"h":27000},
        {"c":"477","d":0,"h":5670}
      ] },
      { "fecha": "12/05/20X6", "concepto": "Devolución de ventas", "lineas": [
        {"c":"708","d":2000,"h":0},
        {"c":"477","d":420,"h":0},
        {"c":"430","d":0,"h":2420}
      ] },
      { "fecha": "15/05/20X6", "concepto": "Cobro con pronto pago fuera de factura", "lineas": [
        {"c":"572","d":29645,"h":0},
        {"c":"706","d":500,"h":0},
        {"c":"477","d":105,"h":0},
        {"c":"430","d":0,"h":30250}
      ] }
    ],
    "calc": [],
    "nota": "Devoluciones a 708 con ajuste del IVA repercutido; pronto pago fuera de factura a 706 con ajuste de IVA.",
    "fuente": "banco"
  },
  {
    "id": "E07",
    "tema": "prestamos",
    "nivel": 2,
    "titulo": "Préstamo con amortización constante",
    "enunciado": "ACEREPESA, S.A. obtiene el 31/12/20X5 un préstamo bancario de 100.000 € a 5 años, ingresado en cuenta. Amortiza capital en cuotas anuales constantes cada 31/12 (la primera el 31/12/20X6) y paga intereses del 4 % anual sobre el capital pendiente junto con cada cuota. Contabiliza: 1) la concesión; 2) la reclasificación a corto plazo a 31/12/20X5; 3) el pago de la primera cuota; 4) la reclasificación a 31/12/20X6. Calcula la cuota de capital y los intereses de 20X6 y 20X7.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X5", "concepto": "Concesión del préstamo", "lineas": [
        {"c":"572","d":100000,"h":0},
        {"c":"170","d":0,"h":100000}
      ] },
      { "fecha": "31/12/20X5", "concepto": "Reclasificación a c/p", "lineas": [
        {"c":"170","d":20000,"h":0},
        {"c":"520","d":0,"h":20000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Pago de la 1.ª cuota", "lineas": [
        {"c":"520","d":20000,"h":0},
        {"c":"662","d":4000,"h":0},
        {"c":"572","d":0,"h":24000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Reclasificación a c/p", "lineas": [
        {"c":"170","d":20000,"h":0},
        {"c":"520","d":0,"h":20000}
      ] }
    ],
    "calc": [
      {"etiqueta":"Cuota anual de capital","valor":20000},
      {"etiqueta":"Intereses 20X6","valor":4000},
      {"etiqueta":"Intereses 20X7","valor":3200}
    ],
    "nota": "A 31/12 se pasa de 170 a 520 lo que vence el año siguiente. Intereses = capital pendiente × tipo (662).",
    "fuente": "banco"
  },
  {
    "id": "E08",
    "tema": "prestamos",
    "nivel": 3,
    "titulo": "Dividendos, intereses con retención y fianza",
    "enunciado": "CERÁMICAS CASTILLA, S.L. 1) 02/01/20X6: compra por banco 2.000 acciones de DUERO ENERGÍA, S.A. a 15 € cada una, como inversión a corto plazo. 2) 20/07/20X6: cobra por banco dividendos; el importe neto ingresado es 8.100 € tras una retención del 19 %. 3) 31/10/20X6: cobra por banco 2.430 € netos de intereses de bonos (valores representativos de deuda a corto plazo), tras retención del 19 %. 4) 01/11/20X6: paga por banco una fianza de 1.200 € por el alquiler de un local con contrato a 3 años.",
    "inicial": null,
    "asientos": [
      { "fecha": "02/01/20X6", "concepto": "Compra de acciones", "lineas": [
        {"c":"540","d":30000,"h":0},
        {"c":"572","d":0,"h":30000}
      ] },
      { "fecha": "20/07/20X6", "concepto": "Cobro de dividendos", "lineas": [
        {"c":"572","d":8100,"h":0},
        {"c":"473","d":1900,"h":0},
        {"c":"760","d":0,"h":10000}
      ] },
      { "fecha": "31/10/20X6", "concepto": "Cobro de intereses", "lineas": [
        {"c":"572","d":2430,"h":0},
        {"c":"473","d":570,"h":0},
        {"c":"761","d":0,"h":3000}
      ] },
      { "fecha": "01/11/20X6", "concepto": "Fianza", "lineas": [
        {"c":"260","d":1200,"h":0},
        {"c":"572","d":0,"h":1200}
      ] }
    ],
    "calc": [
      {"etiqueta":"Dividendo bruto","valor":10000},
      {"etiqueta":"Retención dividendos","valor":1900},
      {"etiqueta":"Intereses brutos","valor":3000},
      {"etiqueta":"Retención intereses","valor":570}
    ],
    "nota": "Bruto = neto / (1 − retención). Retención del 19 % a 473; dividendos a 760 e intereses a 761; fianza a l/p a 260.",
    "fuente": "banco"
  },
  {
    "id": "E09",
    "tema": "capital",
    "nivel": 1,
    "titulo": "Constitución con aportaciones",
    "enunciado": "Se constituye METALÚRGICA DEL DUERO, S.A. con un capital social de 200.000 € (20.000 acciones de 10 €), totalmente suscrito y desembolsado. Los socios aportan un terreno valorado en 40.000 €, una nave (construcción) valorada en 80.000 € y el resto en efectivo, ingresado en el banco. Contabiliza la constitución.",
    "inicial": null,
    "asientos": [
      { "fecha": "01/02/20X6", "concepto": "Constitución", "lineas": [
        {"c":"572","d":80000,"h":0},
        {"c":"210","d":40000,"h":0},
        {"c":"211","d":80000,"h":0},
        {"c":"100","d":0,"h":200000}
      ] }
    ],
    "calc": [
      {"etiqueta":"Efectivo aportado","valor":80000}
    ],
    "nota": "Capital social (100) al Haber por el valor nominal; los bienes aportados al Debe por su valoración.",
    "fuente": "banco"
  },
  {
    "id": "E10",
    "tema": "capital",
    "nivel": 3,
    "titulo": "Ampliación de capital con prima",
    "enunciado": "TEXTILES PISUERGA, S.A. tiene un capital social de 300.000 € (30.000 acciones de 10 €). El 01/09/20X6 amplía capital de modo que las acciones nuevas representen el 20 % del capital resultante. Se emiten a 12 € por acción y se desembolsan íntegramente por banco. Calcula el capital tras la ampliación, el número de acciones nuevas y la prima de emisión, y contabiliza.",
    "inicial": null,
    "asientos": [
      { "fecha": "01/09/20X6", "concepto": "Ampliación de capital", "lineas": [
        {"c":"572","d":90000,"h":0},
        {"c":"100","d":0,"h":75000},
        {"c":"110","d":0,"h":15000}
      ] }
    ],
    "calc": [
      {"etiqueta":"Capital tras la ampliación","valor":375000},
      {"etiqueta":"Acciones nuevas (nº)","valor":7500},
      {"etiqueta":"Prima de emisión","valor":15000}
    ],
    "nota": "Capital resultante = capital anterior / (1 − % que entra). Prima = (precio de emisión − nominal) × acciones nuevas (110).",
    "fuente": "banco"
  },
  {
    "id": "E11",
    "tema": "nominas",
    "nivel": 2,
    "titulo": "Nómina mensual, pago de SS y de IRPF",
    "enunciado": "MUEBLES CAMPOS, S.A. Un trabajador cobra un bruto mensual de 3.000 €; retención de IRPF 15 %, cuota de SS del trabajador 6,5 % y SS a cargo de la empresa 30 %. Las nóminas de enero, febrero y marzo son idénticas. Contabiliza: 1) la nómina de enero (31/01/20X6); 2) el pago por banco de la nómina (05/02) y de la SS (28/02); 3) el ingreso por banco del IRPF del primer trimestre (20/04), suponiendo contabilizadas las nóminas de febrero y marzo.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/01/20X6", "concepto": "Devengo de la nómina", "lineas": [
        {"c":"640","d":3000,"h":0},
        {"c":"642","d":900,"h":0},
        {"c":"4751","d":0,"h":450},
        {"c":"476","d":0,"h":1095},
        {"c":"465","d":0,"h":2355}
      ] },
      { "fecha": "05/02/20X6", "concepto": "Pago de la nómina", "lineas": [
        {"c":"465","d":2355,"h":0},
        {"c":"572","d":0,"h":2355}
      ] },
      { "fecha": "28/02/20X6", "concepto": "Pago de la Seguridad Social", "lineas": [
        {"c":"476","d":1095,"h":0},
        {"c":"572","d":0,"h":1095}
      ] },
      { "fecha": "20/04/20X6", "concepto": "Ingreso del IRPF del trimestre", "lineas": [
        {"c":"4751","d":1350,"h":0},
        {"c":"572","d":0,"h":1350}
      ] }
    ],
    "calc": [
      {"etiqueta":"Líquido a percibir","valor":2355},
      {"etiqueta":"Total a ingresar a la Seguridad Social","valor":1095}
    ],
    "nota": "640 = bruto; 642 = SS empresa; 4751 = IRPF; 476 = SS empresa + SS trabajador; 465 = bruto − IRPF − SS trabajador.",
    "fuente": "banco"
  },
  {
    "id": "E12",
    "tema": "nominas",
    "nivel": 3,
    "titulo": "Nómina con paga extra prorrateada",
    "enunciado": "TEXTILES PISUERGA, S.A. Un trabajador tiene un sueldo bruto mensual de 2.000 € y dos pagas extra de 3.000 € (junio y diciembre), cuyo devengo es semestral y se prorratea mensualmente. IRPF 15 %, SS del trabajador 6,5 % y SS de la empresa 30 %, sobre el bruto devengado del mes. Contabiliza la nómina de marzo (31/03/20X6).",
    "inicial": null,
    "asientos": [
      { "fecha": "31/03/20X6", "concepto": "Devengo de la nómina de marzo", "lineas": [
        {"c":"640","d":2500,"h":0},
        {"c":"642","d":750,"h":0},
        {"c":"4751","d":0,"h":375},
        {"c":"476","d":0,"h":912.5},
        {"c":"465","d":0,"h":1962.5}
      ] }
    ],
    "calc": [
      {"etiqueta":"Bruto devengado en el mes","valor":2500},
      {"etiqueta":"Abono a 465 del mes","valor":1962.5}
    ],
    "nota": "Bruto del mes = 2.000 + 3.000/6. El resto de reglas son las de la nómina ordinaria. La parte prorrateada de la paga extra queda pendiente en 465 hasta su pago en junio.",
    "fuente": "banco"
  },
  {
    "id": "E13",
    "tema": "inmovilizado",
    "nivel": 3,
    "titulo": "Amortización lineal y venta con pérdida",
    "enunciado": "MUEBLES CAMPOS, S.A. compra el 01/04/20X5 una máquina por 60.000 € + IVA 21 %, pagada por banco. Vida útil 10 años, valor residual 0, amortización lineal por meses. La amortización de 20X6 ya está contabilizada. El 01/10/20X7 la vende por 36.000 € + IVA 21 %, cobrados por banco. Contabiliza: 1) la compra; 2) la amortización de 20X5; 3) la amortización de 20X7 hasta la venta; 4) la venta. Calcula cuota anual, amortización acumulada, VNC y resultado.",
    "inicial": null,
    "asientos": [
      { "fecha": "01/04/20X5", "concepto": "Compra de maquinaria", "lineas": [
        {"c":"213","d":60000,"h":0},
        {"c":"472","d":12600,"h":0},
        {"c":"572","d":0,"h":72600}
      ] },
      { "fecha": "31/12/20X5", "concepto": "Amortización 20X5 (9 meses)", "lineas": [
        {"c":"681","d":4500,"h":0},
        {"c":"281","d":0,"h":4500}
      ] },
      { "fecha": "01/10/20X7", "concepto": "Amortización 20X7 hasta la venta (9 meses)", "lineas": [
        {"c":"681","d":4500,"h":0},
        {"c":"281","d":0,"h":4500}
      ] },
      { "fecha": "01/10/20X7", "concepto": "Baja y venta de la máquina", "lineas": [
        {"c":"572","d":43560,"h":0},
        {"c":"281","d":15000,"h":0},
        {"c":"671","d":9000,"h":0},
        {"c":"213","d":0,"h":60000},
        {"c":"477","d":0,"h":7560}
      ] }
    ],
    "calc": [
      {"etiqueta":"Cuota anual","valor":6000},
      {"etiqueta":"Amortización acumulada a 01/10/20X7","valor":15000},
      {"etiqueta":"VNC a 01/10/20X7","valor":45000},
      {"etiqueta":"Resultado de la venta (negativo = pérdida)","valor":-9000}
    ],
    "nota": "Primero se amortiza hasta la fecha de la venta (681 a 281); después se da de baja (281 y 572 contra 213) y la diferencia va a 671 (pérdida) o 771 (beneficio).",
    "fuente": "banco"
  },
  {
    "id": "E14",
    "tema": "inmovilizado",
    "nivel": 4,
    "titulo": "Amortización degresiva, suma de dígitos y deterioro",
    "enunciado": "CERÁMICAS CASTILLA, S.L. adquiere el 01/01/20X6 un camión por 45.000 €, vida útil 5 años, valor residual 0. Calcula: a) cuotas de 20X6 y 20X7 y VNC a 31/12/20X7 con amortización degresiva; b) cuotas de 20X6 y 20X7 y VNC a 31/12/20X7 por suma de dígitos. Contabiliza: c) la cuota de 20X6 degresiva; d) el deterioro de 2.000 € a 31/12/20X7; e) la reversión de 1.500 € a 31/12/20X8.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X6", "concepto": "Amortización 20X6 (degresiva)", "lineas": [
        {"c":"681","d":18000,"h":0},
        {"c":"281","d":0,"h":18000}
      ] },
      { "fecha": "31/12/20X7", "concepto": "Deterioro del camión", "lineas": [
        {"c":"691","d":2000,"h":0},
        {"c":"291","d":0,"h":2000}
      ] },
      { "fecha": "31/12/20X8", "concepto": "Reversión del deterioro", "lineas": [
        {"c":"291","d":1500,"h":0},
        {"c":"791","d":0,"h":1500}
      ] }
    ],
    "calc": [
      {"etiqueta":"Degresiva: cuota 20X6","valor":18000},
      {"etiqueta":"Degresiva: cuota 20X7","valor":10800},
      {"etiqueta":"Degresiva: VNC a 31/12/20X7","valor":16200},
      {"etiqueta":"Suma de dígitos: cuota 20X6","valor":15000},
      {"etiqueta":"Suma de dígitos: cuota 20X7","valor":12000},
      {"etiqueta":"Suma de dígitos: VNC a 31/12/20X7","valor":18000}
    ],
    "nota": "Degresiva: % = coeficiente (2 si 5 ≤ n < 8) × 100/n, aplicado sobre el VNC. Suma de dígitos: cuota = (años restantes / Σ de dígitos) × precio. Deterioro 691 a 291; reversión 291 a 791.",
    "fuente": "banco"
  },
];
