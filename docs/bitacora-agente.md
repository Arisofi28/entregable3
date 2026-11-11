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
- **Qué hizo mal (el harness):** al arrancar la API en local, el comando incluía el texto `process.env.MONGODB_URI`
  (una variable dentro del código, no un archivo). El hook lo confundió con un archivo `.env` y lo bloqueó.
- **Corrección:** se ajustó el patrón del hook para que solo bloquee cuando `.env` aparece como nombre de archivo.
  Antes de commitear se comprobó con 9 casos: bloquea `cat frontend/.env` o `.env.local`, y deja pasar
  `.env.example`, `process.env.X` y `env.ts`. Commit `fix(harness)`.

## 4. Tests primero y reloj inyectado
- **Se le pidió:** seguir el orden de los tickets, con los tests del dominio antes que el código.
- **Qué hizo bien:** T-01 se commiteó en rojo (el módulo no existía) y T-02 lo puso en verde (31/31). Para que
  los tests no dependan del día en que se ejecutan, las funciones reciben la fecha actual como dato (`ahora`)
  y los tests usan siempre el mismo «hoy»: miércoles 11 de noviembre de 2026 a las 12:00 en Ecuador.
  Un test comprueba que el domingo a las 23:30 en Ecuador sigue siendo domingo, aunque en hora universal (UTC)
  ya sea lunes: es el error más probable al calcular semanas.

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
- **Qué hizo mal:** para agregar el botón de editar partidas, el agente modificó `CheckpointPage.tsx` con un
  reemplazo automático mal planteado, y el archivo quedó con código desordenado que no compilaba.
- **Corrección:** lo vio al revisar el resultado, devolvió el archivo a su última versión guardada en Git y
  repitió el cambio copiando el texto exacto que debía reemplazar. Después compiló sin errores.

## 7. La prueba E2E falló y no era culpa del código
- **Qué pasó:** la prueba automática que usa la aplicación en un navegador Chrome sin ventana (crear meta,
  registrar, editar y borrar partidas) marcó como fallidos los pasos «editar» y «eliminar» partida.
- **Cómo se investigó:** primero había un error en el propio script de prueba, que se corrigió. Aun así fallaban
  dos pasos. El registro del servidor mostraba que la ruta para editar partidas no existía: la API local se había
  arrancado **antes** de programar D-02 y seguía con el código viejo.
- **Corrección:** se reinició el servidor y la prueba pasó 14/14. El agente no cambió el código de la aplicación
  para «arreglar» un fallo que no era real. La prueba quedó guardada en `frontend/e2e/flujo-e2.mjs`.

## 8. Diffs limpios con el hook de Prettier
- **Qué pasó:** el hook de Prettier reordena el formato de todo el archivo que se edita. Al editar
  `CheckpointPage.tsx` para T-10, el cambio real habría quedado mezclado con cientos de líneas que solo cambiaban de formato.
- **Corrección:** el agente hizo antes un commit solo de formato (`chore: formato Prettier…`), sin cambiar la lógica, para
  que el commit de cada ticket muestre solo su cambio.
