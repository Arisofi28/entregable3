# Backlog E2 · Metas y rachas

Fuente: [`docs/prd/PRD.md`](../prd/PRD.md). Las reglas `RN-xx` son las del PRD.

## Definition of Done (común a todos los tickets)

1. Existe una spec en `docs/specs/` que lista el ticket en su tabla ticket → archivos, commiteada antes del código.
2. Los criterios del ticket tienen verificación: test automatizado si no necesita base de datos; si no, prueba manual registrada.
3. `cd backend && npm test` pasa y `cd frontend && npm run build` compila.
4. El commit nombra el ticket (`feat(E2): T-xx …` o `fix(deuda): D-xx …`).
5. Hay una fila en `docs/AUDITORIA.md` por cada criterio cubierto.

---

## Historias y criterios de aceptación

### HU-01 · Fijar una meta semanal
**Como** persona que registra sus partidas, **quiero** fijar para un videojuego cuántas horas y cuántos días por semana quiero jugarlo, **para** saber si estoy cumpliendo lo que me propuse.

- **CA-01.1** DADO un videojuego en estado «jugando» o «pausado» sin meta activa, CUANDO fijo 5 horas y 4 días por semana, ENTONCES la meta queda activa y la veo en el detalle del juego.
- **CA-01.2** DADO el formulario de meta, CUANDO indico 0 horas, más de 100 horas, 0 días, 8 días o días con decimales, ENTONCES la meta no se guarda y se me explica el límite permitido.
- **CA-01.3** DADO un videojuego que ya tiene una meta activa, CUANDO intento crear otra, ENTONCES se rechaza con un mensaje que indica que ya existe una meta activa (RN-01).
- **CA-01.4** DADO un videojuego completado o abandonado, CUANDO intento crearle una meta, ENTONCES se rechaza explicando que el juego no admite metas en ese estado (RN-13).
- **CA-01.5** DADO un videojuego que no existe, CUANDO intento crearle una meta, ENTONCES se informa que el videojuego no existe.

### HU-02 · Definir hitos de avance
**Como** persona que juega, **quiero** añadir a mi meta algunos hitos de avance como «Llegar al 50 %», **para** celebrar etapas concretas del juego.

- **CA-02.1** DADO el formulario de meta, CUANDO agrego entre 0 y 5 hitos con descripción y porcentaje entre 1 y 100, ENTONCES se guardan con la meta.
- **CA-02.2** DADO una meta con 5 hitos, CUANDO intento agregar un sexto, ENTONCES no se permite (RN-03).
- **CA-02.3** DADO un hito, CUANDO su porcentaje es menor que 1, mayor que 100 o no tiene descripción, ENTONCES la meta no se guarda y se indica qué hito está mal.
- **CA-02.4** DADO hitos ingresados en cualquier orden, CUANDO veo el progreso, ENTONCES aparecen ordenados de menor a mayor porcentaje (RN-20).

### HU-03 · Ver cómo voy esta semana
**Como** persona que juega, **quiero** ver en el detalle del juego cuántas horas y días he jugado esta semana frente a mi meta, **para** saber si voy bien antes de que termine la semana.

- **CA-03.1** DADO que hoy es miércoles, CUANDO veo el progreso, ENTONCES la semana mostrada va del lunes al domingo de esta semana, en hora de Ecuador (RN-04).
- **CA-03.2** DADO partidas de 90 y 120 minutos esta semana, CUANDO veo el progreso, ENTONCES las horas de la semana son 3,5.
- **CA-03.3** DADO una meta de 5 horas y 3,5 horas jugadas, CUANDO veo el progreso, ENTONCES el porcentaje es 70 %.
- **CA-03.4** DADO una meta de 5 horas y 7 horas jugadas, CUANDO veo el progreso, ENTONCES el porcentaje es 140 % y la barra se ve completa (RN-11).
- **CA-03.5** DADO tres partidas el mismo día, CUANDO veo los días jugados, ENTONCES ese día cuenta una sola vez (RN-08).
- **CA-03.6** DADO una partida que empieza el domingo a las 23:30 (hora de Ecuador) y dura 60 minutos, CUANDO veo el progreso, ENTONCES cuenta completa para el domingo y para esa semana (RN-09).
- **CA-03.7** DADO partidas de la semana pasada o con fecha futura, CUANDO veo el progreso, ENTONCES no cuentan para esta semana (RN-16).
- **CA-03.8** DADO un juego sin meta activa, CUANDO veo el progreso, ENTONCES veo horas, días y rachas, no veo porcentaje y se me invita a crear una meta (RN-19).
- **CA-03.9** DADO un juego sin partidas, CUANDO veo el progreso, ENTONCES horas, días y rachas están en 0.
- **CA-03.10** DADO una meta que edito a mitad de semana, CUANDO veo el progreso, ENTONCES el porcentaje se calcula con la meta nueva (RN-10).
- **CA-03.11** DADO que alcancé las horas y los días objetivo, CUANDO veo el progreso, ENTONCES se indica que la meta de la semana está cumplida (RN-15).

### HU-04 · Ver mi racha
**Como** persona que suele abandonar sus juegos, **quiero** ver cuántos días seguidos llevo jugando y mi mejor racha, **para** motivarme a ser constante.

- **CA-04.1** DADO partidas hoy, ayer y anteayer, CUANDO veo la racha, ENTONCES la racha actual es 3 (RN-05).
- **CA-04.2** DADO partidas ayer y anteayer pero no hoy, CUANDO veo la racha, ENTONCES la racha actual es 2: sigue viva (RN-07).
- **CA-04.3** DADO que la última partida fue anteayer, CUANDO veo la racha, ENTONCES la racha actual es 0.
- **CA-04.4** DADO un historial con una racha de 9 días en el pasado y una de 4 ahora, CUANDO veo la racha, ENTONCES la mejor racha es 9 y la actual 4 (RN-18).
- **CA-04.5** DADO varias partidas el mismo día, CUANDO veo la racha, ENTONCES ese día suma una sola vez (RN-08).

### HU-05 · Ver qué hitos alcancé
**Como** persona que juega, **quiero** ver qué hitos de mi meta ya alcancé, **para** sentir que avanzo.

- **CA-05.1** DADO un avance actual de 50 % y hitos de 25, 50 y 100 %, CUANDO veo los hitos, ENTONCES los de 25 y 50 % aparecen alcanzados y el de 100 % no (RN-06).
- **CA-05.2** DADO un hito alcanzado, CUANDO elimino o edito una partida y el avance actual baja por debajo de su objetivo, ENTONCES el hito deja de aparecer alcanzado (RN-12).
- **CA-05.3** DADO un juego sin partidas, CUANDO veo los hitos, ENTONCES ninguno está alcanzado.

### HU-06 · Editar y desactivar la meta
**Como** persona que juega, **quiero** ajustar o desactivar mi meta, **para** adaptarla a mi realidad sin perder el historial.

- **CA-06.1** DADO una meta activa, CUANDO cambio sus horas, días o hitos, ENTONCES el progreso se recalcula con los nuevos valores.
- **CA-06.2** DADO una meta activa, CUANDO elijo desactivarla, ENTONCES se me pide confirmación y, si confirmo, el juego queda sin meta activa.
- **CA-06.3** DADO una meta desactivada, CUANDO intento editarla o desactivarla de nuevo, ENTONCES se rechaza (RN-17).
- **CA-06.4** DADO un juego con metas anteriores, CUANDO consulto sus metas, ENTONCES veo la activa y las desactivadas.
- **CA-06.5** DADO una meta, CUANDO intento cambiar el videojuego al que pertenece, ENTONCES se rechaza (RN-21).

### HU-07 · Coherencia entre el juego y su meta
**Como** persona que juega, **quiero** que mis metas sigan el ciclo de vida del juego, **para** no ver metas de juegos que terminé o eliminé.

- **CA-07.1** DADO un juego con metas, CUANDO lo elimino, ENTONCES se eliminan también todas sus metas (RN-14).
- **CA-07.2** DADO un juego con meta activa, CUANDO lo marco como completado o abandonado, ENTONCES la meta se desactiva y queda en el historial (RN-13).

### HU-08 · Progreso al día cuando cambian mis partidas
**Como** persona que juega, **quiero** que el progreso de la semana se actualice al registrar, editar o eliminar una partida, **para** ver el efecto de inmediato.

- **CA-08.1** DADO el detalle de un juego, CUANDO registro una partida desde ahí, ENTONCES horas, días, racha e hitos se actualizan sin recargar la página.
- **CA-08.2** DADO el detalle de un juego, CUANDO elimino una de sus partidas, ENTONCES el progreso se actualiza.
- **CA-08.3** DADO el detalle de un juego, CUANDO edito una de sus partidas, ENTONCES el progreso se actualiza (depende de D-02).

### HU-09 · Mensajes claros cuando algo falla
**Como** persona que juega, **quiero** saber qué pasó cuando algo falla, **para** poder corregirlo.

- **CA-09.1** DADO un identificador de juego mal escrito, CUANDO consulto su progreso, ENTONCES se informa que el identificador no es válido.
- **CA-09.2** DADO un juego que no existe, CUANDO consulto su progreso, ENTONCES se informa que no existe.
- **CA-09.3** DADO que el progreso no se puede cargar, CUANDO abro el detalle, ENTONCES veo un mensaje de error con la opción de reintentar, y mientras carga veo un indicador de carga.

---

## Tickets

| Id | Tipo | Título | Historias / criterios | Depende de | Estado |
|---|---|---|---|---|---|
| T-01 | test | Tests de las funciones de dominio (semana, días, horas, porcentaje, racha, hitos) | HU-03, HU-04, HU-05 | — | Hecho |
| T-02 | feat | Funciones puras de dominio en `src/dominio/progreso.ts` | HU-03, HU-04, HU-05 | T-01 | Hecho |
| T-03 | feat | Modelo `Meta` con validaciones, hitos embebidos y una activa por juego | HU-01, HU-02 | — | Hecho |
| T-04 | feat | CRUD de Meta: crear, obtener, listar por juego, actualizar, desactivar | HU-01, HU-02, HU-06 | T-03, T-05 | Hecho |
| T-05 | feat | errorHandler distingue 409 (conflicto y clave duplicada) | CA-01.3, CA-06.3 | — | Hecho |
| T-06 | feat | Endpoint `GET /api/videojuegos/:id/progreso-semanal` | HU-03, HU-04, HU-05, HU-09 | T-02, T-03 | Hecho |
| T-07 | feat | Política de juego → meta: borrado en cascada y desactivación por estado | HU-07 | T-03 | Hecho |
| T-08 | chore | Tokens CSS de DESIGN.md en `index.css` | — | — | Hecho |
| T-09 | feat | Servicio `metasApi.ts` | HU-01…HU-06 | T-04, T-06 | Hecho |
| T-10 | feat | Sección de progreso semanal en el detalle (carga, error, vacío) | HU-03, HU-04, HU-05, CA-09.3 | T-08, T-09 | Hecho |
| T-11 | feat | Formulario de meta con hitos y desactivación con confirmación | HU-01, HU-02, HU-06 | T-10 | Hecho |
| T-12 | feat | Registrar y eliminar partidas desde el detalle y reconsultar el progreso | CA-08.1, CA-08.2 | T-10 | Hecho |
| T-13 | docs | Auditoría, despliegue y pull request | todas | todos | En curso (PR integrado; falta verificar Render) |

### Definition of Done específica

- **T-01** Los tests existen y **fallan** antes de T-02 (no hay implementación). Cubren CA-03.1 a CA-03.7, CA-03.9 a CA-03.11, CA-04.x y CA-05.x.
- **T-02** Todos los tests de T-01 pasan; las funciones no importan Mongoose ni Express y reciben `ahora`.
- **T-03** Rechaza horas fuera de (0, 100], días no enteros o fuera de 1–7, más de 5 hitos y porcentajes fuera de 1–100; impide dos metas activas para el mismo juego.
- **T-04** Responde 201/200; 400 en datos inválidos; 404 si el juego o la meta no existen; 409 en meta activa duplicada, juego completado/abandonado o meta inactiva.
- **T-05** El cuerpo de error mantiene el formato `{ error: { mensaje, statusCode, requestId } }`.
- **T-06** Devuelve la forma del ejemplo del PRD más `metaCumplida`; probado con curl en juego sin partidas, juego con ≥5 partidas en días distintos y racha rota, 400, 404.
- **T-07** Tras borrar un juego no quedan metas suyas; al pasar a completado/abandonado la meta queda `activa: false`.
- **T-08** Los tokens de DESIGN.md existen como variables; los CSS nuevos no tienen colores ni medidas fijos.
- **T-09** Todas las llamadas de metas y progreso pasan por `metasApi.ts`; ningún componente usa `fetch`.
- **T-10** Muestra barra de horas, días, racha actual, mejor racha e hitos; estados de carga, error y sin meta.
- **T-11** Crear/editar con validación en el cliente, hasta 5 hitos, error 409 visible; desactivar con confirmación en línea.
- **T-12** Tras crear o eliminar una partida en el detalle se vuelven a pedir resumen y progreso.
- **T-13** `docs/AUDITORIA.md` con una fila por criterio; tickets marcados; Render actualizado; PR con tickets y enlace a la auditoría.

---

## Deuda técnica

### Se paga en esta épica (ciclo completo: criterio → test → código → verificación)

| Id | Problema (diagnóstico) | Criterio | Tipo | Depende de | Estado |
|---|---|---|---|---|---|
| D-01 | P-01 Eliminar un videojuego deja partidas huérfanas | **CA-D01** DADO un juego con partidas, CUANDO lo elimino, ENTONCES sus partidas también se eliminan y no afectan a otros juegos (RN-14). | fix | — | Hecho |
| D-02 | P-02 No se puede editar una partida | **CA-D02.1** DADO una partida, CUANDO cambio su fecha, duración, avance o notas, ENTONCES se guardan los cambios con las mismas validaciones que al crearla. **CA-D02.2** DADO una partida, CUANDO intento cambiar el juego al que pertenece, ENTONCES se rechaza. **CA-D02.3** = CA-08.3. | fix | T-12 | Hecho |

### Se difiere

| Id | Problema | Motivo para diferir |
|---|---|---|
| D-03 | P-05 URL de respaldo de la API apunta a un backend inexistente | En Render el frontend usa `VITE_API_URL`; el fallback no se usa. Riesgo bajo, cambio fuera del alcance de E2. |
| D-04 | P-06 `npm test` del Proyecto 3 compila y prueba contra `dist/` | Funciona; los tests nuevos ya corren sobre `src/` con `tsx`. Migrar el test viejo no aporta a E2. |
| D-05 | P-07 Carpeta `frontend/backups/` versionada | No afecta al build ni al usuario; limpieza cosmética. |
| D-06 | P-08 `window.confirm` en la página de sesiones | Funciona; la UI nueva ya usa confirmación en línea. Se unifica en una épica de UI. |
| D-07 | P-09 Colores y medidas fijos en CSS existentes | Requiere revisar todas las páginas; E2 solo garantiza que el CSS nuevo use tokens. |
| D-08 | P-10 Orígenes CORS escritos en el código | Funciona con `CLIENT_URL`; mover a configuración no cambia el comportamiento. |
| D-09 | P-11 Fechas mostradas con la zona del navegador | La persona juega en Ecuador (PA-02); el cálculo de la semana ya usa la zona de Ecuador en el backend. |
| D-10 | Encabezado no cabe en 390 px y desborda toda la página (encontrado en la revisión de diseño de E2) | Ya existía en todas las páginas del Proyecto 3; arreglarlo es un rediseño de la navegación, fuera del alcance de E2. |
