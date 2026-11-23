import type { Ejercicio } from '../lib/types';

export const BANK2: Ejercicio[] = [
  {
    "id": "E15",
    "tema": "existencias",
    "nivel": 3,
    "titulo": "Regularización con FIFO y deterioro",
    "enunciado": "ELECTRODOMÉSTICOS TORMES, S.A. (método especulativo). Existencias iniciales: 20 uds a 100 €/ud, con un deterioro de 150 € registrado el año anterior. Compras del año: 20 uds a 120 €/ud. Ventas del año: 30 uds. Al cierre, el valor de mercado de las existencias finales es 1.000 €. Calcula las existencias finales por FIFO y contabiliza la regularización a 31/12/20X6.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X6", "concepto": "Anulación del deterioro inicial", "lineas": [
        {"c":"390","d":150,"h":0},
        {"c":"793","d":0,"h":150}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Existencias iniciales", "lineas": [
        {"c":"610","d":2000,"h":0},
        {"c":"300","d":0,"h":2000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Existencias finales", "lineas": [
        {"c":"300","d":1200,"h":0},
        {"c":"610","d":0,"h":1200}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Deterioro de las existencias finales", "lineas": [
        {"c":"693","d":200,"h":0},
        {"c":"390","d":0,"h":200}
      ] }
    ],
    "calc": [
      {"etiqueta":"Existencias finales FIFO","valor":1200},
      {"etiqueta":"Coste de ventas FIFO","valor":3200},
      {"etiqueta":"Deterioro a dotar","valor":200}
    ],
    "nota": "Regularización: anular deterioro inicial (390 a 793), existencias iniciales (610 a 300), finales (300 a 610) y deterioro si valor de mercado < coste (693 a 390).",
    "fuente": "banco"
  },
  {
    "id": "E16",
    "tema": "existencias",
    "nivel": 3,
    "titulo": "PMP frente a FIFO y LIFO",
    "enunciado": "MUEBLES CAMPOS, S.A. (método especulativo). Existencias iniciales: 30 uds a 40 €/ud, sin deterioro previo. Compras del año: 30 uds a 50 €/ud. Ventas del año: 40 uds. El valor de mercado de las existencias finales es 850 €. Calcula las existencias finales por PMP, por FIFO y por LIFO (este solo como ejercicio de examen) y contabiliza la regularización con PMP.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X6", "concepto": "Existencias iniciales", "lineas": [
        {"c":"610","d":1200,"h":0},
        {"c":"300","d":0,"h":1200}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Existencias finales (PMP)", "lineas": [
        {"c":"300","d":900,"h":0},
        {"c":"610","d":0,"h":900}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Deterioro", "lineas": [
        {"c":"693","d":50,"h":0},
        {"c":"390","d":0,"h":50}
      ] }
    ],
    "calc": [
      {"etiqueta":"PMP (€/ud)","valor":45},
      {"etiqueta":"Existencias finales PMP","valor":900},
      {"etiqueta":"Existencias finales FIFO","valor":1000},
      {"etiqueta":"Existencias finales LIFO","valor":800},
      {"etiqueta":"Deterioro a dotar con PMP","valor":50}
    ],
    "nota": "PMP = coste total / unidades totales. Compras a 600 y ventas a 700; el grupo 3 solo se mueve al cierre.",
    "fuente": "banco"
  },
  {
    "id": "E17",
    "tema": "ajustes",
    "nivel": 2,
    "titulo": "Gasto anticipado e ingreso anticipado",
    "enunciado": "ACEREPESA, S.A. (IVA 21 %). 1) 01/10/20X6: paga por banco una prima de seguro anual de 12.000 €, exenta de IVA (del 01/10/20X6 al 30/09/20X7). 2) 01/11/20X6: cobra por banco 6.000 € + IVA por el alquiler anticipado de un local cedido durante 6 meses (del 01/11/20X6 al 30/04/20X7). 3) Realiza los ajustes a 31/12/20X6.",
    "inicial": null,
    "asientos": [
      { "fecha": "01/10/20X6", "concepto": "Pago del seguro", "lineas": [
        {"c":"625","d":12000,"h":0},
        {"c":"572","d":0,"h":12000}
      ] },
      { "fecha": "01/11/20X6", "concepto": "Cobro del alquiler anticipado", "lineas": [
        {"c":"572","d":7260,"h":0},
        {"c":"752","d":0,"h":6000},
        {"c":"477","d":0,"h":1260}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Gasto anticipado (9 meses de seguro)", "lineas": [
        {"c":"480","d":9000,"h":0},
        {"c":"625","d":0,"h":9000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Ingreso anticipado (4 meses de alquiler)", "lineas": [
        {"c":"752","d":4000,"h":0},
        {"c":"485","d":0,"h":4000}
      ] }
    ],
    "calc": [
      {"etiqueta":"Gasto anticipado a 31/12","valor":9000},
      {"etiqueta":"Ingreso anticipado a 31/12","valor":4000}
    ],
    "nota": "480 (gastos anticipados) contra el gasto; 485 (ingresos anticipados) contra el ingreso.",
    "fuente": "banco"
  },
  {
    "id": "E18",
    "tema": "ajustes",
    "nivel": 3,
    "titulo": "Provisión: dotación, paso a corto plazo y pago",
    "enunciado": "METALÚRGICA DEL DUERO, S.L. a) A 31/12/20X6 estima que un litigio con un proveedor terminará con una indemnización probable de 30.000 €, pagadera a largo plazo (gasto en 678). b) A 31/12/20X7 se espera el pago en 20X8: reclasifica. c) El 15/03/20X8 paga los 30.000 € por banco.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X6", "concepto": "Dotación de la provisión", "lineas": [
        {"c":"678","d":30000,"h":0},
        {"c":"142","d":0,"h":30000}
      ] },
      { "fecha": "31/12/20X7", "concepto": "Paso de l/p a c/p", "lineas": [
        {"c":"142","d":30000,"h":0},
        {"c":"529","d":0,"h":30000}
      ] },
      { "fecha": "15/03/20X8", "concepto": "Pago de la indemnización", "lineas": [
        {"c":"529","d":30000,"h":0},
        {"c":"572","d":0,"h":30000}
      ] }
    ],
    "calc": [],
    "nota": "Provisión a l/p en 14x; a 31/12 pasa a c/p (529) cuando vence en el ejercicio siguiente.",
    "fuente": "banco"
  },
  {
    "id": "E19",
    "tema": "dudosos",
    "nivel": 3,
    "titulo": "Dudoso cobro, deterioro e incobrable",
    "enunciado": "ELECTRODOMÉSTICOS TORMES, S.A. Su cliente Hogar Sur, S.A. no paga una factura vencida de 12.100 € (10.000 € + IVA 21 %). 1) 30/09/20X6: se clasifica como cliente de dudoso cobro. 2) 31/12/20X6: se estima un deterioro del 40 % del importe total. 3) 30/06/20X7: se declara incobrable.",
    "inicial": null,
    "asientos": [
      { "fecha": "30/09/20X6", "concepto": "Clasificación como dudoso cobro", "lineas": [
        {"c":"436","d":12100,"h":0},
        {"c":"430","d":0,"h":12100}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Deterioro (40 %)", "lineas": [
        {"c":"694","d":4840,"h":0},
        {"c":"490","d":0,"h":4840}
      ] },
      { "fecha": "30/06/20X7", "concepto": "Crédito incobrable", "lineas": [
        {"c":"490","d":4840,"h":0},
        {"c":"650","d":7260,"h":0},
        {"c":"436","d":0,"h":12100}
      ] }
    ],
    "calc": [
      {"etiqueta":"Deterioro a 31/12/20X6","valor":4840},
      {"etiqueta":"Pérdida por incobrable (650)","valor":7260}
    ],
    "nota": "436 a 430 por el total con IVA; deterioro 694 a 490; al declararse incobrable se aplica 490 y el resto va a 650.",
    "fuente": "banco"
  },
  {
    "id": "E20",
    "tema": "dudosos",
    "nivel": 3,
    "titulo": "Corrección del deterioro: dotación y reversión",
    "enunciado": "CERÁMICAS CASTILLA, S.L. El saldo de 490 a 31/12/20X6 es 6.000 €. A 31/12/20X7 los clientes de dudoso cobro suman 30.250 € (IVA incluido) y se estima una insolvencia del 30 %. A 31/12/20X8 suman 25.000 € con la misma estimación del 30 %. Contabiliza los ajustes de 20X7 y 20X8.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X7", "concepto": "Dotación complementaria", "lineas": [
        {"c":"694","d":3075,"h":0},
        {"c":"490","d":0,"h":3075}
      ] },
      { "fecha": "31/12/20X8", "concepto": "Reversión del exceso", "lineas": [
        {"c":"490","d":1575,"h":0},
        {"c":"794","d":0,"h":1575}
      ] }
    ],
    "calc": [
      {"etiqueta":"Deterioro necesario a 31/12/20X7","valor":9075},
      {"etiqueta":"Deterioro necesario a 31/12/20X8","valor":7500}
    ],
    "nota": "Se compara el deterioro necesario con el saldo de 490: si falta, 694 a 490; si sobra, 490 a 794.",
    "fuente": "banco"
  },
  {
    "id": "E21",
    "tema": "cierre",
    "nivel": 3,
    "titulo": "Regularización con pérdida y apertura",
    "enunciado": "A 31/12/20X6, antes de regularizar, ACEREPESA, S.A. tiene estos saldos (en €): 700 Ventas de mercaderías 120.000; 752 Ingresos por arrendamientos 6.000; 600 Compras 95.000; 610 Variación de existencias (saldo deudor) 4.000; 640 Sueldos 30.000; 642 SS empresa 9.000; 621 Arrendamientos 7.000; 681 Amortización 5.000; 662 Intereses 3.000. No procede impuesto por haber pérdida. Contabiliza la regularización y el asiento de apertura del resultado.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X6", "concepto": "Regularización de gastos (grupo 6)", "lineas": [
        {"c":"129","d":153000,"h":0},
        {"c":"600","d":0,"h":95000},
        {"c":"610","d":0,"h":4000},
        {"c":"640","d":0,"h":30000},
        {"c":"642","d":0,"h":9000},
        {"c":"621","d":0,"h":7000},
        {"c":"681","d":0,"h":5000},
        {"c":"662","d":0,"h":3000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Regularización de ingresos (grupo 7)", "lineas": [
        {"c":"700","d":120000,"h":0},
        {"c":"752","d":6000,"h":0},
        {"c":"129","d":0,"h":126000}
      ] },
      { "fecha": "01/01/20X7", "concepto": "Apertura: traspaso de la pérdida", "lineas": [
        {"c":"121","d":27000,"h":0},
        {"c":"129","d":0,"h":27000}
      ] }
    ],
    "calc": [
      {"etiqueta":"Resultado del ejercicio (negativo = pérdida)","valor":-27000}
    ],
    "nota": "Grupos 6 y 7 contra 129; la pérdida pasa a 121 y el beneficio a 120.",
    "fuente": "banco"
  },
  {
    "id": "E22",
    "tema": "cierre",
    "nivel": 4,
    "titulo": "Impuesto, PyG y Balance",
    "enunciado": "ACEREPESA, S.A. presenta a 31/12/20X6, tras regularizar existencias y antes del impuesto, estos saldos (en €). Deudores: 213 Maquinaria 60.000; 300 Mercaderías 12.000; 430 Clientes 25.000; 572 Bancos 33.000; 600 Compras 120.000; 610 Variación de existencias 3.000; 640 Sueldos 40.000; 642 SS empresa 12.000; 621 Arrendamientos 8.000; 681 Amortización 6.000; 662 Intereses 2.000. Acreedores: 281 Amortización acumulada 12.000; 100 Capital social 50.000; 113 Reservas voluntarias 7.000; 400 Proveedores 20.000; 170 Deudas a l/p 24.000; 520 Deudas a c/p 8.000; 700 Ventas 200.000. Tipo del impuesto: 25 %. Contabiliza el impuesto y calcula las líneas de la PyG (1, 4, 6, 7, 8, 13; A, B, C, 17, D) y las masas del Balance.",
    "inicial": null,
    "asientos": [
      { "fecha": "31/12/20X6", "concepto": "Impuesto sobre beneficios", "lineas": [
        {"c":"630","d":2250,"h":0},
        {"c":"4752","d":0,"h":2250}
      ] }
    ],
    "calc": [
      {"etiqueta":"1. Importe neto de la cifra de negocios","valor":200000},
      {"etiqueta":"4. Aprovisionamientos","valor":-123000},
      {"etiqueta":"6. Gastos de personal","valor":-52000},
      {"etiqueta":"7. Otros gastos de explotación","valor":-8000},
      {"etiqueta":"8. Amortización del inmovilizado","valor":-6000},
      {"etiqueta":"A) Resultado de explotación","valor":11000},
      {"etiqueta":"13. Gastos financieros","valor":-2000},
      {"etiqueta":"B) Resultado financiero","valor":-2000},
      {"etiqueta":"C) Resultado antes de impuestos","valor":9000},
      {"etiqueta":"17. Impuestos sobre beneficios","valor":-2250},
      {"etiqueta":"D) Resultado del ejercicio","valor":6750},
      {"etiqueta":"Total Activo","valor":118000},
      {"etiqueta":"Patrimonio neto","valor":63750},
      {"etiqueta":"Pasivo no corriente","valor":24000},
      {"etiqueta":"Pasivo corriente","valor":30250}
    ],
    "nota": "Aprovisionamientos = compras + variación de existencias. Impuesto = tipo × resultado antes de impuestos (630 a 4752).",
    "fuente": "banco"
  },
  {
    "id": "E23",
    "tema": "completo",
    "nivel": 4,
    "titulo": "Supuesto: comercial, nómina, amortización y cierre",
    "enunciado": "TEXTILES PISUERGA, S.A. (IVA 21 %, ejercicio 20X6). Saldos iniciales a 01/01 (en €): 572 Bancos 70.000; 213 Maquinaria 50.000 (comprada ese día, vida útil 10 años, VR 0, amortización lineal); 100 Capital social 120.000. Operaciones: 1) 15/02: compra mercaderías por 30.000 € con descuento comercial del 10 % en factura, a pagar más tarde. 2) 10/05: vende mercaderías por 54.000 € + IVA, cobrado por banco. 3) 31/05: nómina de un trabajador con bruto de 2.000 € (IRPF 15 %, SS trabajador 6,5 %, SS empresa 30 %), pendiente de pago. 4) 31/12: amortización de la máquina. 5) 31/12: existencias finales 5.000 € (no había iniciales). 6) 31/12: impuesto sobre beneficios al 25 %. Se pide: asientos, PyG y Balance.",
    "inicial": [
      {"c":"572","d":70000,"h":0},
      {"c":"213","d":50000,"h":0},
      {"c":"100","d":0,"h":120000}
    ],
    "asientos": [
      { "fecha": "15/02/20X6", "concepto": "Compra de mercaderías", "lineas": [
        {"c":"600","d":27000,"h":0},
        {"c":"472","d":5670,"h":0},
        {"c":"400","d":0,"h":32670}
      ] },
      { "fecha": "10/05/20X6", "concepto": "Venta de mercaderías", "lineas": [
        {"c":"572","d":65340,"h":0},
        {"c":"700","d":0,"h":54000},
        {"c":"477","d":0,"h":11340}
      ] },
      { "fecha": "31/05/20X6", "concepto": "Devengo de la nómina", "lineas": [
        {"c":"640","d":2000,"h":0},
        {"c":"642","d":600,"h":0},
        {"c":"4751","d":0,"h":300},
        {"c":"476","d":0,"h":730},
        {"c":"465","d":0,"h":1570}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Amortización de la máquina", "lineas": [
        {"c":"681","d":5000,"h":0},
        {"c":"281","d":0,"h":5000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Existencias finales", "lineas": [
        {"c":"300","d":5000,"h":0},
        {"c":"610","d":0,"h":5000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Impuesto sobre beneficios", "lineas": [
        {"c":"630","d":6100,"h":0},
        {"c":"4752","d":0,"h":6100}
      ] }
    ],
    "calc": [
      {"etiqueta":"1. Importe neto de la cifra de negocios","valor":54000},
      {"etiqueta":"4. Aprovisionamientos","valor":-22000},
      {"etiqueta":"6. Gastos de personal","valor":-2600},
      {"etiqueta":"8. Amortización del inmovilizado","valor":-5000},
      {"etiqueta":"A) Resultado de explotación","valor":24400},
      {"etiqueta":"C) Resultado antes de impuestos","valor":24400},
      {"etiqueta":"17. Impuestos sobre beneficios","valor":-6100},
      {"etiqueta":"D) Resultado del ejercicio","valor":18300},
      {"etiqueta":"Total Activo","valor":185340},
      {"etiqueta":"Patrimonio neto","valor":138300},
      {"etiqueta":"Pasivo corriente","valor":47040}
    ],
    "nota": "IVA: 477 − 472 = 5.670 a pagar (Hacienda Pública, acreedora por IVA). Resultado = 18.300.",
    "fuente": "banco"
  },
  {
    "id": "E24",
    "tema": "completo",
    "nivel": 5,
    "titulo": "Supuesto: compraventa, seguro, dudoso, existencias y cierre",
    "enunciado": "MUEBLES CAMPOS, S.A. (IVA 21 %, ejercicio 20X6). Saldos iniciales a 01/01 (en €): 572 Bancos 50.000; 430 Clientes 24.200; 218 Elementos de transporte 36.000 (vida útil 6 años, VR 0, lineal); 100 Capital social 80.000; 113 Reservas voluntarias 20.000; 400 Proveedores 10.200. Operaciones: 1) 01/02: compra mercaderías por 20.000 € con descuento por pronto pago del 2 % en factura, a crédito. 2) 01/07: vende mercaderías por 50.000 € + IVA, a crédito. 3) 01/10: paga por banco 6.000 € de un seguro anual exento de IVA (01/10/20X6 a 30/09/20X7). 4) 31/12: amortización del transporte. 5) 31/12: periodifica el seguro. 6) 31/12: el cliente de 24.200 € pasa a dudoso cobro y se deteriora el 50 %. 7) 31/12: existencias finales 9.000 € (no había iniciales). 8) 31/12: impuesto al 25 %. Se pide: asientos, PyG y Balance.",
    "inicial": [
      {"c":"572","d":50000,"h":0},
      {"c":"430","d":24200,"h":0},
      {"c":"218","d":36000,"h":0},
      {"c":"100","d":0,"h":80000},
      {"c":"113","d":0,"h":20000},
      {"c":"400","d":0,"h":10200}
    ],
    "asientos": [
      { "fecha": "01/02/20X6", "concepto": "Compra con pronto pago en factura", "lineas": [
        {"c":"600","d":19600,"h":0},
        {"c":"472","d":4116,"h":0},
        {"c":"400","d":0,"h":23716}
      ] },
      { "fecha": "01/07/20X6", "concepto": "Venta de mercaderías", "lineas": [
        {"c":"430","d":60500,"h":0},
        {"c":"700","d":0,"h":50000},
        {"c":"477","d":0,"h":10500}
      ] },
      { "fecha": "01/10/20X6", "concepto": "Pago del seguro", "lineas": [
        {"c":"625","d":6000,"h":0},
        {"c":"572","d":0,"h":6000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Amortización del transporte", "lineas": [
        {"c":"681","d":6000,"h":0},
        {"c":"281","d":0,"h":6000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Gasto anticipado (9 meses)", "lineas": [
        {"c":"480","d":4500,"h":0},
        {"c":"625","d":0,"h":4500}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Cliente de dudoso cobro", "lineas": [
        {"c":"436","d":24200,"h":0},
        {"c":"430","d":0,"h":24200}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Deterioro del 50 %", "lineas": [
        {"c":"694","d":12100,"h":0},
        {"c":"490","d":0,"h":12100}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Existencias finales", "lineas": [
        {"c":"300","d":9000,"h":0},
        {"c":"610","d":0,"h":9000}
      ] },
      { "fecha": "31/12/20X6", "concepto": "Impuesto sobre beneficios", "lineas": [
        {"c":"630","d":4950,"h":0},
        {"c":"4752","d":0,"h":4950}
      ] }
    ],
    "calc": [
      {"etiqueta":"1. Importe neto de la cifra de negocios","valor":50000},
      {"etiqueta":"4. Aprovisionamientos","valor":-10600},
      {"etiqueta":"7. Otros gastos de explotación","valor":-13600},
      {"etiqueta":"8. Amortización del inmovilizado","valor":-6000},
      {"etiqueta":"A) Resultado de explotación","valor":19800},
      {"etiqueta":"C) Resultado antes de impuestos","valor":19800},
      {"etiqueta":"17. Impuestos sobre beneficios","valor":-4950},
      {"etiqueta":"D) Resultado del ejercicio","valor":14850},
      {"etiqueta":"Total Activo","valor":160100},
      {"etiqueta":"Patrimonio neto","valor":114850},
      {"etiqueta":"Pasivo corriente","valor":45250}
    ],
    "nota": "Gasto anticipado: 6.000 × 9/12 = 4.500. Deterioro: 694 a 490 por el 50 % del total con IVA. IVA: 477 − 472 = 6.384 a pagar.",
    "fuente": "banco"
  },
];
