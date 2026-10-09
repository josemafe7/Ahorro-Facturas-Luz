# Cálculo de una factura de luz 2.0TD

Cómo calcula la app lo que paga un cliente, de dónde sale cada valor regulado y un ejemplo hecho a mano con
el que se comprueba el código. Es lo propio del sector de la luz: el motor de la app no sabe nada de esto.

## La fórmula

Se calcula igual lo que el cliente paga hoy, con los precios de su factura, y lo que pagaría con cada tarifa
del catálogo, con los precios de esa tarifa. Siempre para el periodo de la factura: los mismos días, las
mismas potencias contratadas y los mismos consumos.

| Línea | Operación |
|---|---|
| Potencia en punta (P1) | kW contratados × días × precio en € por kW y día |
| Potencia en valle (P2) | kW contratados × días × precio en € por kW y día |
| Energía en punta (P1) | kWh consumidos × precio en € por kWh |
| Energía en llano (P2) | kWh consumidos × precio en € por kWh |
| Energía en valle (P3) | kWh consumidos × precio en € por kWh |
| Financiación del bono social | días × importe diario |
| Impuesto eléctrico | (potencia + energía + bono social) × tipo |
| Alquiler del contador | el importe de la factura; si no lo trae, días × importe diario |
| IVA | (todo lo anterior) × tipo |
| **Total** | la suma de todas las líneas |

- Cada línea se redondea al céntimo, con el medio céntimo hacia arriba, y los totales suman líneas ya
  redondeadas. Así lo que se ve en pantalla y en el PDF suma exactamente.
- El impuesto eléctrico no puede ser menor que su mínimo legal: los MWh consumidos por el mínimo en € por
  MWh. Con el tipo normal nunca se alcanza; con el tipo rebajado al 0,5 %, sí.
- Una tarifa con un solo precio de energía se calcula igual, con ese precio en los tres periodos.
- Un precio de potencia dado por mes se pasa a día multiplicándolo por 12 y dividiéndolo entre 365; uno dado
  por año, dividiéndolo entre 365. El resultado se redondea a seis decimales, como en las facturas.
- El alquiler del contador no depende de la comercializadora: es el mismo hoy y con cualquier tarifa.

El ahorro:

- Ahorro en la factura: lo que paga hoy menos lo que pagaría.
- Ahorro anual: el ahorro en la factura × 365 ÷ días facturados.
- Ahorro mensual: el ahorro anual ÷ 12.

El ahorro anual es una proyección: supone que el resto del año se consume al ritmo de esa factura. El PDF lo
dice.

## Los valores regulados

Son los que la app trae de inicio en los ajustes. Comprobados el 9 de octubre de 2026.

| Valor | Vigente | Fuente oficial |
|---|---|---|
| IVA | 21 % | Tipo general de la Ley 37/1992. La rebaja al 10 % del Real Decreto-ley 7/2026 se aplicó del 22 de marzo al 31 de mayo de 2026. |
| Impuesto eléctrico | 5,11269632 % | Artículo 99 de la Ley 38/1992. [Agencia Tributaria: tipo impositivo](https://sede.agenciatributaria.gob.es/Sede/impuestos-especiales-medioambientales/impuesto-especial-sobre-electricidad/liquidacion-pago-impuesto/tipo-impositivo.html) y [vuelta al tipo general desde el 1 de junio de 2026](https://sede.agenciatributaria.gob.es/Sede/impuestos-especiales-medioambientales/novedades-impuestos-especiales-medioambientales/2026/mayo/19/clausula-desactivacion-rebaja-tipo-impositivo-electricidad.html). |
| Mínimo del impuesto eléctrico | 1 € por MWh | Artículo 99 de la [Ley 38/1992](https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741). El mínimo de 0,5 € por MWh es solo para usos industriales, que no son de la tarifa 2.0TD. |
| Alquiler del contador | 0,026630 € al día | 0,81 € al mes para un contador monofásico con telegestión: disposición transitoria única de la [Orden IET/1491/2013](https://www.boe.es/buscar/act.php?id=BOE-A-2013-8561). 0,81 × 12 ÷ 365 = 0,026630. El trifásico son 1,36 € al mes. |
| Financiación del bono social | 0,024688 € al día | 9,011295 € al año por punto de suministro desde julio de 2026: [Orden TED/634/2026](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-13759). 9,011295 ÷ 365 = 0,024688. Hasta junio eran 6,979247 € al año ([Orden TED/1524/2025](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-26705)), 0,019121 € al día. |

### Lo que puede cambiar pronto

El [Real Decreto-ley 25/2026](https://www.boe.es/buscar/act.php?id=BOE-A-2026-20265), en vigor desde el 1 de
octubre de 2026, prevé volver a bajar el IVA al 10 % (para potencias de hasta 10 kW) y el impuesto eléctrico
al 0,5 % en noviembre y en diciembre de 2026, pero solo si se cumple una condición. Según la [nota del
Ministerio de Hacienda](https://www.hacienda.gob.es/en-GB/Prensa/Noticias/paginas/2026/20260929-np-cm-medidas-fiscales.aspx),
la condición es que el IPC de la electricidad de septiembre supere en un 15 % al del año anterior; diciembre
depende del dato de octubre. En octubre no se aplica ninguna rebaja. Lo resume también la [nota de la Agencia
Tributaria del 30 de septiembre de
2026](https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2026/septiembre/30/nuevas-medidas-marco-plan-integral-medio.html).
Antes de cambiar un tipo en los ajustes hay que confirmarlo en la Agencia Tributaria, que publica cada mes si
la rebaja se aplica.

Por eso estos valores se cambian en la pantalla de ajustes, sin tocar el código, y cada estudio guarda los
que se usaron al calcularlo.

## Ejemplo hecho a mano

Es la primera factura de ejemplo del proyecto. Las pruebas del cálculo tienen que dar estos mismos importes.

Datos de la factura: 30 días; 4,6 kW contratados en punta y en valle; consumo de 96 kWh en punta, 84 en
llano y 130 en valle; alquiler del contador de 0,80 €. Impuestos y cargos, los de la tabla de arriba.

| Línea | Hoy | Importe | Con la tarifa propuesta | Importe |
|---|---|---|---|---|
| Potencia en punta | 4,6 kW × 30 días × 0,123288 € | 17,01 € | 4,6 kW × 30 días × 0,090411 € | 12,48 € |
| Potencia en valle | 4,6 kW × 30 días × 0,041096 € | 5,67 € | 4,6 kW × 30 días × 0,027397 € | 3,78 € |
| Energía en punta | 96 kWh × 0,215 € | 20,64 € | 96 kWh × 0,119 € | 11,42 € |
| Energía en llano | 84 kWh × 0,165 € | 13,86 € | 84 kWh × 0,119 € | 10,00 € |
| Energía en valle | 130 kWh × 0,115 € | 14,95 € | 130 kWh × 0,119 € | 15,47 € |
| Financiación del bono social | 30 días × 0,024688 € | 0,74 € | 30 días × 0,024688 € | 0,74 € |
| Impuesto eléctrico | 72,87 € × 5,11269632 % | 3,73 € | 53,89 € × 5,11269632 % | 2,76 € |
| Alquiler del contador | el de la factura | 0,80 € | el de la factura | 0,80 € |
| IVA | 77,40 € × 21 % | 16,25 € | 57,45 € × 21 % | 12,06 € |
| **Total** | | **93,65 €** | | **69,51 €** |

- Ahorro en la factura: 93,65 − 69,51 = 24,14 €.
- Ahorro anual: 24,14 × 365 ÷ 30 = 293,70 €.
- Ahorro mensual: 293,70 ÷ 12 = 24,48 €.

El mínimo del impuesto eléctrico en este ejemplo es 0,310 MWh × 1 € = 0,31 €, muy por debajo de lo que sale
con el porcentaje. Con el tipo rebajado al 0,5 %, la tarifa propuesta daría 53,89 € × 0,5 % = 0,27 €, menos
que el mínimo: se aplicarían los 0,31 €.

## Lo que este cálculo no contempla

Descuentos, servicios añadidos, compensación de excedentes de placas solares, bono social del cliente y
tarifas de precio variable. Si la factura lleva alguno, lo que la app calcula que paga hoy no coincidirá con
el total impreso, y la app avisa.
