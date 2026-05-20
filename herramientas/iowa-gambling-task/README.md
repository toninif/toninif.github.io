# Iowa Gambling Task — versión exprés

Herramienta interactiva para acompañar la clase sobre **emoción y toma de decisiones** en *Psicología de la Motivación y Emoción* (UP). Permite a los estudiantes vivenciar el paradigma original de Bechara, Damasio, Damasio y Anderson (1994) y comparar su propia curva de aprendizaje con las curvas típicas de controles sanos y pacientes con lesión prefrontal ventromedial.

## ¿Qué hace?

1. **Intro**: explicación del paradigma y botón para empezar.
2. **Juego (30 cartas)**: el participante elige cartas de 4 mazos (A, B, C, D) intentando ganar la mayor cantidad de dinero posible. Recibe feedback inmediato sobre cada carta (paga y/o castigo).
3. **Resultado**: dinero final, ganancia neta, y un gráfico que compara la propia curva con las curvas de referencia de controles y lesionados. Incluye explicación del experimento original y de la composición real de los mazos.

## Estructura

```
iowa-gambling-task/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   └── igt.js
└── img/                # (vacío por ahora)
```

## Detalle de los mazos

Réplica reducida del esquema original de Bechara et al. (1994):

| Mazo | Paga | Castigos | Balance c/10 cartas |
|------|------|----------|----------------------|
| **A** | $100 | Frecuentes, medianos | ≈ −$250 |
| **B** | $100 | Raro pero muy grande ($1250 en la carta 10) | −$250 |
| **C** | $50 | Frecuentes, chicos | +$200 |
| **D** | $50 | Raro y mediano ($250 en la carta 10) | +$250 |

La distinción A vs. B (y C vs. D) replica la disociación clave del experimento original entre **frecuencia** y **magnitud** del castigo.

## Versión exprés vs. versión completa

- **Original**: 100 cartas, dinero ficticio.
- **Esta versión**: 30 cartas, dinero ficticio. Más corta para usar en clase o como demo de autoestudio. Las curvas de referencia están adaptadas a esta escala reducida.

## Dependencias

- Chart.js 4.4 (via CDN: `cdn.jsdelivr.net`)
- Fuentes Google: Libre Baskerville + Inter

## Cómo integrarla al sitio

Copiar la carpeta `iowa-gambling-task/` al sitio `toninif.github.io` y agregar una entrada en la sección de **Herramientas**:

```markdown
::: {.pub-item}
**[Iowa Gambling Task](iowa-gambling-task/index.html){target="_blank"}** ·
Demo interactivo del paradigma de Bechara et al. (1994). Permite vivenciar el
aprendizaje implícito de los marcadores somáticos y comparar la propia curva
con datos de referencia.
:::
```

## Despliegue local

```bash
cd iowa-gambling-task
python3 -m http.server 8000
# → http://localhost:8000
```

## Referencia

> Bechara, A., Damasio, A. R., Damasio, H., & Anderson, S. W. (1994).
> Insensitivity to future consequences following damage to human prefrontal
> cortex. *Cognition*, 50, 7–15.
