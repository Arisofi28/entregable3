# DESIGN.md — Arcade Universe

Sistema de diseño del frontend. Documenta la identidad que ya tiene el Proyecto 3 (biblioteca
luminosa, pastel y juguetona, con tarjetas redondeadas) y la convierte en tokens. Todo estilo
nuevo usa **solo** las variables CSS de esta guía, declaradas en `frontend/src/index.css`.

## 1. Colores

| Token | Valor | Uso |
|---|---|---|
| `--blue` | `#5278f4` | Acción principal, enlaces, foco, iconos destacados |
| `--blue-soft` | `#edf2ff` | Fondo de iconos y chips informativos |
| `--navy` | `#20314d` | Texto principal y títulos |
| `--muted` | `#75839a` | Texto secundario, etiquetas |
| `--cream` | `#fffdf7` | Fondo de tarjetas (`surface-card`) |
| `--surface` | `#ffffff` | Filas e inputs dentro de tarjetas |
| `--page` | `#f4f8fb` | Fondo de página |
| `--line` | `#e5eaf0` | Bordes y divisores |
| `--sky` | `#b9e7fa` | Ilustraciones, héroe |
| `--green` | `#a8d98c` | Decoración positiva |
| `--success` | `#4f8a45` | Texto de éxito (hito alcanzado, meta cumplida) |
| `--success-soft` | `#edf6e9` | Fondo de éxito |
| `--yellow` | `#ffe19b` | Selección, racha (🔥) |
| `--warning` | `#9a6d12` | Texto de aviso |
| `--warning-soft` | `#fff4d8` | Fondo de aviso |
| `--coral` | `#f66961` | Acento de marca |
| `--danger` | `#c2413a` | Texto de error y acciones destructivas |
| `--danger-soft` | `#fff0ee` | Fondo de error / botón destructivo |
| `--pink` | `#f9d9d8` | Decoración |

Contraste: `--navy`, `--muted`, `--success`, `--warning` y `--danger` sobre `--cream` o su
fondo `-soft` cumplen WCAG AA (≥ 4.5:1) para texto normal.

## 2. Tipografía

- Títulos (`h1`–`h3`, cifras grandes): **Space Grotesk** 600–700, `letter-spacing` negativo (−0.04 a −0.06em).
- Texto y controles: **DM Sans** 400–800.
- Tokens: `--font-display`, `--font-body`.
- Escala: `--text-xs` 11px · `--text-sm` 13px · `--text-md` 15px · `--text-lg` 22px · `--text-xl` 32px.
- Etiquetas tipo *kicker*: mayúsculas, 800, `letter-spacing: 0.1–0.16em`, `--text-xs`.
- Nunca menos de 11px para texto que el usuario deba leer.

## 3. Espaciado y forma

- Escala de espaciado (múltiplos de 4): `--space-1` 4px · `--space-2` 8px · `--space-3` 12px ·
  `--space-4` 16px · `--space-5` 24px · `--space-6` 32px.
- Radios: `--radius-sm` 10px (chips, inputs pequeños) · `--radius-md` 15px (botones, filas) ·
  `--radius-lg` 25px (tarjetas).
- Sombra única de tarjeta: `--shadow`. No se inventan sombras nuevas.

## 4. Componentes

- **Tarjeta** (`.surface-card`): fondo `--cream`, radio `--radius-lg`, `--shadow`.
- **Botón** (`.button`): primario `--blue` con texto blanco en mayúsculas; `.secondary` blanco con
  borde `--line`; `.danger` `--danger-soft` con texto `--danger`. Altura mínima 44px.
- **Encabezado de sección**: *kicker* con icono lucide + `h2` en Space Grotesk.
- **Barra de progreso**: pista `--line`, relleno `--blue` (o `--success` si llega a la meta),
  radio completo, `role="progressbar"` con `aria-valuenow/min/max`. El relleno visual se limita
  al 100 % aunque el valor sea mayor; el número real se muestra como texto.
- **Indicador de días**: 7 puntos (L–D) o «3 / 4 days»; jugado = `--blue`, no jugado = `--line`.
- **Estadística**: icono en cuadrado `--radius-md` con fondo `-soft` + etiqueta + cifra grande.
- **Lista de hitos**: fila con icono (✓ alcanzado `--success`, candado/círculo `--muted`) y
  porcentaje objetivo. El estado nunca se comunica solo con color: lleva icono y texto.
- **Estados**: carga (icono girando + texto, `role="status"`), error (`.notice`, `role="alert"`,
  botón «Try again»), vacío (`.state-panel` con icono, frase y una acción).
- **Confirmación**: en línea, dentro de la tarjeta (texto + «Cancel» / acción destructiva). No `window.confirm`.
- **Formularios**: etiqueta visible sobre cada campo, ayuda corta debajo, errores en `--danger`
  junto al campo y resumen arriba.

## 5. Tono de los textos

- Interfaz en **inglés**, cercana y motivadora, en segunda persona: «Keep the streak alive!».
- Botones en mayúsculas y con verbo: «SET A GOAL», «SAVE GOAL», «DEACTIVATE».
- Mensajes de error que dicen qué pasó y qué hacer: «This game already has an active goal. Edit it instead.»
- Sin culpa ni presión: nada de «You failed your goal». Mejor «2 more hours to reach your goal».
- Emojis solo como decoración puntual (🔥 en la racha), nunca como único portador de información.

## 6. Accesibilidad

- Foco visible: `outline: 3px solid` azul translúcido (ya definido globalmente). No se quita.
- Todo control con etiqueta accesible; iconos decorativos con `aria-hidden="true"`.
- Barras con `role="progressbar"` y texto equivalente; regiones que cambian con `aria-live="polite"`.
- Objetivos táctiles ≥ 44px. Contraste AA. Respeta `prefers-reduced-motion` en animaciones nuevas.
- Diseño usable desde 320px de ancho: las rejillas pasan a una columna bajo 700px.

## 7. Librerías autorizadas

- `lucide-react` para iconos. Nada más: sin librerías de componentes, de gráficos ni de CSS.

## 8. No hacemos

- No usamos colores, sombras, radios ni tamaños escritos a mano en estilos nuevos: solo tokens.
- No agregamos librerías de UI (MUI, Bootstrap, Tailwind, Chakra, librerías de gráficos).
- No usamos `window.alert` / `window.confirm` en pantallas nuevas.
- No mostramos gráficos históricos, rankings ni notificaciones (fuera del alcance de E2).
- No comunicamos estados solo con color ni solo con emoji.
- No usamos texto gris claro sobre fondos claros por debajo de AA.
- No usamos personajes, logos ni arte de videojuegos reales.
