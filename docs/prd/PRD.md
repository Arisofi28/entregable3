# PRD — Diario de Progreso Gamer (Arcade Universe)

Versión 2 · 2026-11-11 · Incluye E1 (existente) y **E2 · Metas y rachas** (nueva).
Fuente: ficha de hechos del cliente. Lo que no está en la ficha aparece como supuesto o punto abierto.

## 1. Problema

La persona registra sus videojuegos y partidas y ya sabe qué juega, cuánto tiempo le dedica y
qué tan avanzada va (E1). Pero **no sabe si está jugando lo que se propuso ni si es constante**:
juega mucho un fin de semana y luego abandona el juego dos semanas.

## 2. Usuarios

Una sola persona: la misma que registra sus videojuegos y partidas en el Diario. No hay cuentas
ni varios usuarios.

## 3. Objetivo y métrica de éxito

- **Objetivo E2:** que la persona pueda fijar una meta por videojuego y ver, en el detalle del
  juego, cómo va esta semana, cuántos días seguidos lleva jugando y qué hitos ha alcanzado.
- **Métrica:** en un mes, la persona cumple su meta semanal **al menos 3 de 4 semanas**.
  Una semana se considera cumplida según RN-15.

## 4. Alcance

### E1 · Diario de progreso (existente)
- Registrar, editar y eliminar videojuegos con sus logros.
- Registrar y eliminar partidas; ver el resumen (partidas, horas, última partida, avance actual).

### E2 · Metas y rachas (nueva)
- Fijar una meta activa por videojuego: horas por semana y días por semana.
- Agregar a la meta una lista corta de hitos de avance (por ejemplo «Llegar al 50 %»).
- Editar la meta activa y desactivarla; las metas anteriores se conservan como historial.
- Ver en el detalle del juego el progreso de la semana actual: horas frente a la meta, días
  jugados frente a los días objetivo, racha actual, mejor racha y estado de cada hito.
- El progreso se actualiza cuando se registra, edita o elimina una partida.

## 5. No-alcance

Notificaciones, recordatorios, metas compartidas entre usuarios, rankings y gráficos históricos.
Tampoco: cuentas de usuario, varias metas activas por juego, metas globales (de todos los juegos).

## 6. Reglas de negocio

### Hechos de la ficha
- **RN-01** Cada videojuego puede tener como máximo **una meta activa**.
- **RN-02** Una meta define horas por semana (más de 0 y hasta 100) y días por semana (entero de 1 a 7).
- **RN-03** Una meta tiene como máximo **5 hitos**; cada hito tiene una descripción y un porcentaje objetivo de 1 a 100.
- **RN-04** La semana va de **lunes a domingo, en hora de Ecuador**. «Esta semana» es la que contiene el día de hoy.
- **RN-05** La racha son **días consecutivos con al menos una partida** de ese videojuego.
- **RN-06** Un hito está alcanzado cuando el **avance actual del juego** (el del resumen de E1) es mayor o igual que su porcentaje objetivo.

### Huecos de la ficha resueltos
| Id | Hueco | Decisión |
|---|---|---|
| **RN-07** | Racha y día de hoy | Si hoy aún no hay partida pero ayer sí, **la racha sigue viva**: se cuenta hasta ayer. Solo se rompe cuando termina un día completo sin jugar. Motivo: el día de hoy no ha terminado; mostrar 0 a las 8 a. m. desanima sin razón. |
| **RN-08** | Varias partidas el mismo día | Cuentan como **un solo día jugado** (para los días de la semana y para la racha). Las horas sí se suman todas. |
| **RN-09** | Partida que cruza la medianoche | Pertenece **completa al día en que empezó** (hora de Ecuador), con todos sus minutos. Motivo: es predecible y coincide con la fecha que la persona registra. |
| **RN-10** | Cambio de meta a mitad de semana | El porcentaje de la semana se calcula **siempre con la meta activa en el momento de consultar**. No se guarda una «meta de la semana». |
| **RN-11** | Meta superada | El porcentaje de horas **no se limita**: 7 h con meta de 5 h es **140 %**. Visualmente la barra se llena hasta el final y se muestra el número real. |
| **RN-12** | Hito ya alcanzado y luego baja el avance | El estado del hito **no se guarda: se calcula** cada vez con el avance actual. Registrar una partida nunca reduce el avance (cada partida suma avance); si el avance baja porque se edita o elimina una partida, el hito **deja de estar alcanzado**. |
| **RN-13** | Videojuego completado o abandonado | **No puede tener meta activa.** Crear una meta para un juego completado o abandonado se rechaza con un mensaje claro. Si un juego con meta activa pasa a completado o abandonado, su meta se **desactiva automáticamente** (queda en el historial). Un juego pausado sí puede tener meta. |
| **RN-14** | Eliminar un videojuego con meta | Se eliminan **también todas sus metas** (la activa y las históricas, con sus hitos) y todas sus partidas. No queda información huérfana. |

### Huecos adicionales encontrados con el agente
| Id | Hueco | Decisión |
|---|---|---|
| **RN-15** | ¿Qué es «cumplir la meta semanal»? (lo pide la métrica) | La semana está cumplida cuando las horas de la semana **alcanzan** las horas objetivo **y** los días jugados alcanzan los días objetivo. |
| **RN-16** | Partidas con fecha futura | No cuentan para la semana, los días jugados ni la racha hasta que llega su fecha. |
| **RN-17** | Desactivar una meta | Es definitivo: una meta desactivada no se reactiva ni se edita; para volver a tener meta se crea una nueva. La meta desactivada se conserva en el historial. |
| **RN-18** | Mejor racha | Es la racha más larga de todo el historial, **incluida la actual**. Nunca es menor que la racha actual. |
| **RN-19** | Juego sin meta activa | Igual se muestran horas, días jugados, rachas e indicación de que no hay meta, invitando a crear una. No hay porcentaje de horas ni hitos. |
| **RN-20** | Hitos con el mismo porcentaje u orden | Se permiten; se muestran ordenados de menor a mayor porcentaje objetivo. Una meta puede no tener hitos. |
| **RN-21** | Cambiar el videojuego de una meta | No se permite: una meta pertenece siempre al juego con el que se creó. |

## 7. Supuestos

- S-01 Una sola persona usa la aplicación; no hay autenticación (igual que en E1).
- S-02 El avance de cada partida es el **avance ganado en esa sesión**, como definió E1; el avance actual es su suma limitada a 100 %.
- S-03 La fecha y hora de una partida es el momento en que **empezó**.
- S-04 «Hoy» es siempre el día actual en Ecuador, aunque el dispositivo de la persona tenga otra zona horaria.
- S-05 Horas por semana admite decimales (por ejemplo 2,5 h).

## 8. Puntos abiertos

- PA-01 **Historial de semanas cumplidas.** La métrica (3 de 4 semanas) necesita conocer semanas pasadas, pero los gráficos históricos están fuera de alcance y RN-10 no guarda la meta de cada semana. En E2 solo se muestra si **la semana actual** está cumplida; medir la métrica mensual queda para una épica futura. Justificación: el cliente excluyó explícitamente el histórico.
- PA-02 **Zona horaria del registro.** El formulario de partidas usa la hora del navegador; si la persona viaja fuera de Ecuador, una partida podría caer en otro día. Se asume que juega en Ecuador (deuda D-09).
