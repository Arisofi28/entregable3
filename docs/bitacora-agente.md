# Bitácora del trabajo con el agente (Claude Code)

Momentos clave de la sesión del 2026-11-11 en la rama `feature/e2-metas-rachas`.

## 1. Diagnóstico y huecos de producto
- **Se le pidió:** leer el Proyecto 3 y la ficha de hechos, y encontrar lo que faltaba.
- **Qué hizo bien:** además de los 8 huecos de la ficha, encontró que la métrica «3 de 4 semanas» necesita
  historial de semanas que el cliente excluyó (quedó como PA-01), que no estaba definido qué es «cumplir la meta»
  (RN-15) y que las partidas con fecha futura alterarían la racha (RN-16). También detectó, probando la API
  desplegada, que la URL de respaldo del frontend responde 404 (P-05).
- **Cómo se trabajó:** el agente **no decidió** las reglas de negocio: hizo preguntas con opciones y
  una recomendación, y yo elegí. Las respuestas están en el PRD (RN-07 a RN-14).

## 2. El hook bloqueó al propio agente
- **Qué pasó:** con el hook `PreToolUse` ya activo, el agente intentó hacer el commit del harness con un mensaje
  que decía «bloquea lectura/edición de .env». El hook lo detuvo, porque el texto del comando mencionaba `.env`.
- **Corrección:** se reformuló el mensaje. Sirvió como prueba real de que el hook funciona en la sesión.

## 3. Falso positivo del hook con `process.env`
- **Qué hizo mal (el harness):** al levantar la API local con un script que contenía `process.env.MONGODB_URI`,
  el hook lo bloqueó: la expresión regular trataba `.env.MONGODB_URI` como si fuera un archivo `.env.*`.
- **Corrección:** se cambió la regex para que solo cuente `.env` como ruta (al inicio, tras `/`, espacio,
  comilla o `=`). Antes de commitear se probó con 9 casos guardados en un archivo (bloquear `cat frontend/.env`,
  `.env.local` y `> backend/.env`; permitir `.env.example`, `process.env.X` y `env.ts`). Commit `fix(harness)`.

## 4. Tests primero y reloj inyectado
- **Se le pidió:** seguir el orden de los tickets, con los tests del dominio antes que el código.
- **Qué hizo bien:** T-01 se commiteó en rojo (el módulo no existía) y T-02 lo puso en verde (31/31). Para que
  los tests no dependan del día en que se ejecutan, todas las funciones reciben `ahora` y los tests fijan
  «hoy» en miércoles 11-nov-2026 12:00 en Ecuador. Un test fija explícitamente que domingo 23:30 en Ecuador
  ya es lunes 04:30 UTC, que es el error más probable al calcular semanas.

## 5. Desvío de la spec detectado en la revisión de diseño ⚠️
- **Qué hizo mal:** la spec frontend (F-09) y DESIGN.md §8 dicen que los estilos nuevos no usan medidas escritas
  a mano. Aun así, el agente escribió `44px` en 11 lugares de los CSS nuevos (tamaño táctil mínimo). Además,
  sin meta activa el botón «SET A GOAL» aparecía dos veces (encabezado y panel vacío).
- **Cómo se detectó:** en la revisión de diseño contra DESIGN.md, con `grep` sobre los CSS nuevos y capturas
  de Chrome headless a 1300 px y 390 px. El `grep` de colores fijos daba 0, pero el de medidas no.
- **Corrección:** token `--tap-target` en `index.css` y DESIGN.md §3, reemplazo de los 11 valores y botón
  duplicado eliminado. Commit `fix(E2): T-10 T-11 correcciones de la revisión de diseño`. Tabla en
  `docs/revision-diseno.md`. El desbordamiento en móvil se atribuyó al encabezado del Proyecto 3 tras comprobar
  que `/sessions` (que E2 no toca) también se desborda, y se difirió como D-10.

## 6. Una edición automática rompió un archivo
- **Qué hizo mal:** para conectar el formulario de edición de partidas, el agente usó un reemplazo por regex
  cuyo grupo de indentación incluía el salto de línea; `CheckpointPage.tsx` quedó con líneas en blanco
  intercaladas y un `if` dentro de un `return (`.
- **Corrección:** lo vio al revisar el resultado antes de compilar, restauró el archivo con
  `git checkout` y repitió el cambio con reemplazos de texto exactos. El build y el lint quedaron limpios.

## 7. La prueba E2E falló y no era culpa del código
- **Qué pasó:** el script de punta a punta (Chrome headless + DevTools Protocol) marcó como fallidos «editar» y
  «eliminar» partida.
- **Cómo se investigó:** primero apareció un error del propio script (cada evaluación compartía el ámbito
  global y `const f` se redeclaraba). Al arreglarlo seguían fallando dos pasos; el log del servidor mostraba
  `PUT /api/partidas/... 404`: la API local se había arrancado **antes** de implementar D-02 y no se recarga sola.
- **Corrección:** se reinició el servidor y el flujo pasó 14/14. El agente no tocó el código de la app para
  «arreglar» un falso fallo. El script quedó versionado en `frontend/e2e/flujo-e2.mjs`.

## 8. Diffs limpios con el hook de Prettier
- **Qué pasó:** el hook `PostToolUse` reformatea todo el archivo que se edita. Editar `CheckpointPage.tsx` habría
  mezclado cientos de líneas de formato con el cambio de T-10.
- **Corrección:** el agente hizo antes un commit solo de formato (`chore: formato Prettier…`), sin lógica, para
  que los commits de cada ticket muestren solo su cambio.
