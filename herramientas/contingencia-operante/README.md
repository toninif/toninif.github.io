# Contingencia operante

Herramienta interactiva para trabajar como actividad de clase la unidad de **condicionamiento operante** de *Psicología General* (UP), en particular la definición de contingencia como diferencia de probabilidades. Acompaña a `presentaciones/psico_general/aprendizaje-memoria.qmd` (diapositivas «Contingencia» a «Releyendo un caso»), pero no depende de ella.

## ¿Qué hace?

1. **Calculadora.** El estudiante carga una tabla de frecuencias (hizo o no hizo R, hubo o no hubo C) y ve:
   - `P(C | hizo R)` y `P(C | no hizo R)` como barras;
   - la resta y el signo de la contingencia (positiva, negativa o nula);
   - al indicar qué pasó con la conducta, el procedimiento resultante (reforzamiento o castigo, positivo o negativo), resaltado en la tabla de 2×2.
2. **Casos para clasificar.** Diez situaciones ficticias con sus frecuencias. El estudiante responde el signo y el procedimiento, y recibe la cuenta y una explicación. Un botón abre los números del caso en la calculadora. Incluye un caso sin contingencia y uno en que la consecuencia «parece» aversiva pero refuerza (el berrinche).

3. **Simulador.** El estudiante elige las probabilidades «reales» `P(C | R)` y `P(C | no R)` y la cantidad de observaciones por fila (10 a 500). El simulador sortea una muestra y la muestra en la misma tabla y con las mismas barras que la calculadora, y dice si el signo observado coincide con el real. «Simular 20 veces» arma un historial (máximo 200) con un gráfico de las contingencias observadas contra la real y el conteo de signos. Sirve para ver que con pocas observaciones una contingencia nula puede aparecer como positiva o negativa. Cualquier muestra se puede llevar a la calculadora. Al cambiar la realidad se borra el historial, porque ya no es comparable.

Opción «Texto grande» para proyectar en el aula.

## Estructura

```
contingencia-operante/
├── index.html
├── README.md
├── css/style.css
├── js/
│   ├── logic.js      # cálculo, clasificación y simulación (sin DOM)
│   ├── cases.js      # banco de casos
│   └── app.js        # interfaz
└── tests/logic.test.cjs
```

Sin compilación ni servidor: se abre `index.html`. Quarto la publica porque `herramientas/**` está en `project.resources` de `_quarto.yml`.

## Decisiones de diseño

- El signo de la contingencia se decide con productos cruzados de enteros (`a·(c+d) − c·(a+b)`), no con la resta de decimales, para que una contingencia nula nunca dependa del redondeo.
- Los nombres de los procedimientos se describen solo con probabilidades y efecto sobre la conducta, nunca con «agradable», «desagradable», «aparece» o «se quita», en línea con la diapositiva «Un problema con esta forma de presentarlo».
- El simulador acepta un generador aleatorio inyectable (`simular(pctR, pctNoR, n, azar)`), de modo que las pruebas usan una semilla fija y son deterministas. Las probabilidades se manejan como porcentajes enteros para que el signo real nunca dependa de decimales.
- No se guardan datos ni hay backend. Todos los casos son ficticios.
- El tipo de procedimiento de cada caso no se almacena: se calcula con `logic.js`, y las pruebas fijan la clasificación esperada de cada uno.

## Pruebas

Desde la raíz del repositorio:

```
node --test herramientas/contingencia-operante/tests/*.test.cjs
node --check herramientas/contingencia-operante/js/app.js
```

## Agregar un caso

Añadir un objeto a `js/cases.js` con `id`, `titulo`, `texto`, `R`, `C`, `unidad`, las frecuencias `a`, `b`, `c`, `d` (a = R y C, b = R sin C, c = sin R y C, d = sin R ni C), `efecto` (`aumenta`, `disminuye` o `igual`) y `nota`; luego sumarlo al mapa `esperado` de la prueba.
