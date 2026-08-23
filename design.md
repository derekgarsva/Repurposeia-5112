# Repurpose AI — Design System

## Concepto
Un "estudio de redacción" oscuro y editorial. Sensación de terminal + revista impresa.
Nada de gradientes morados, nada de grids de cards genéricas.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--ink` | `oklch(0.16 0.008 250)` | fondo base (casi negro azulado) |
| `--ink-raise` | `oklch(0.21 0.010 250)` | paneles elevados |
| `--ink-line` | `oklch(1 0 0 / 9%)` | bordes hairline |
| `--paper` | `oklch(0.96 0.012 90)` | texto principal (crema, no blanco puro) |
| `--paper-dim` | `oklch(0.70 0.010 90)` | texto secundario |
| `--acid` | `oklch(0.88 0.20 118)` | acento principal (lima eléctrico) |
| `--ember` | `oklch(0.72 0.17 45)` | acento secundario (ámbar) |

Regla: el acento lima solo para acción, estado activo y datos. Nunca como relleno decorativo.

## Tipografía
- Display: **Instrument Serif** (italic para énfasis) — títulos grandes, 1.05 line-height, tracking negativo.
- Body/UI: **DM Sans** — 15–16px, line-height 1.65.
- Mono: **JetBrains Mono** — etiquetas, contadores de caracteres, metadatos en uppercase 11px tracking 0.14em.

## Layout
- Split asimétrico: columna izquierda de composición (40%) + panel de resultados (60%) en desktop; stack en móvil.
- Historial como riel horizontal de "tickets", no sidebar de lista.
- Hairlines de 1px en vez de sombras. Radios pequeños (6px) excepto botón pill principal.
- Fondo: malla de puntos sutil + un halo radial lima al 6% detrás del hero.

## Movimiento
Una entrada orquestada: hero → composer → panel, stagger de 60ms, translateY(12px) + fade.
Los resultados aparecen con stagger al llegar. Nada más se mueve.

## Componentes
- `FormatCard`: hairline border, etiqueta mono arriba, contenido en body, footer con contador y botón copiar.
- `Pill`: selector de tono/idioma, activo = fondo lima con texto tinta.
- `Ticket`: item de historial, borde punteado izquierdo, título truncado + fecha mono.
