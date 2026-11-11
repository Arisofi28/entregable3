# Épicas — Diario de Progreso Gamer

| Épica | Pregunta que responde | Estado |
|---|---|---|
| E1 · Diario de progreso | ¿Qué estoy jugando, cuánto tiempo le dedico y qué tan avanzado voy? | Terminada (Proyecto 3) |
| E2 · Metas y rachas | ¿Estoy cumpliendo lo que me propuse esta semana y cuántos días seguidos llevo jugando? | En curso |

## E1 · Diario de progreso (Proyecto 3)

**Objetivo:** que la persona tenga un registro único de sus videojuegos y sesiones y vea su avance calculado.

**Alcance que cubre:**
- Biblioteca de videojuegos: crear, listar con filtro por estado, editar y eliminar.
- Logros embebidos por videojuego, marcables como obtenidos.
- Registro de partidas (fecha, duración, avance ganado, notas) y su eliminación.
- Resumen por videojuego: total de partidas, horas totales, última partida y avance actual.
- Interfaz Arcade Universe y despliegue en Render + MongoDB Atlas.

**Pendientes heredados:** ver `docs/diagnostico.md` (edición de partidas y partidas huérfanas se pagan en E2 como D-01 y D-02).

## E2 · Metas y rachas

**Objetivo:** que la persona fije una meta semanal por videojuego y vea en el detalle del juego si
la está cumpliendo, cuántos días seguidos lleva jugando y qué hitos de avance ha alcanzado.
**Métrica:** cumple su meta semanal al menos 3 de 4 semanas en un mes (PRD §3).

**Alcance que cubre:**
- Meta por videojuego (horas y días por semana), una activa como máximo, con historial.
- Hitos de avance dentro de la meta (hasta 5), cuyo estado se calcula con el avance actual.
- Progreso de la semana actual (lunes a domingo, hora de Ecuador): horas, porcentaje, días jugados.
- Racha actual y mejor racha.
- Sección de progreso semanal y formulario de meta en el detalle del juego.
- Política de borrado y de estado del juego extendida a las metas (RN-13, RN-14).

**No incluye:** notificaciones, recordatorios, metas compartidas, rankings ni gráficos históricos.

Detalle de historias, criterios y tickets: [`E2-metas-y-rachas.md`](E2-metas-y-rachas.md).
