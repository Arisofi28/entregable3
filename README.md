
# ARCADE UNIVERSE
## Entregable 3 — Diario de Progreso Gamer

Aplicación web full-stack para gestionar videojuegos,
registrar sesiones de juego, administrar logros y
visualizar el progreso calculado.

## Objetivo

La aplicación responde tres preguntas:

- ¿Qué videojuegos estoy jugando?
- ¿Cuánto tiempo les he dedicado?
- ¿Qué porcentaje de avance tengo actualmente?

## Identidad visual

Arcade Universe combina una biblioteca de videojuegos
luminosa y colorida con una sección Checkpoint oscura,
con detalles neón y estética arcade.

Se inspira en videojuegos de plataformas y utiliza
elementos gráficos originales.

## Tecnologías

Backend:
- Node.js
- Express
- TypeScript
- Mongoose
- MongoDB Atlas

Frontend:
- React
- TypeScript
- Vite
- React Router
- CSS
- Lucide Icons

Despliegue:
- Render
- MongoDB Atlas

## Modelo Videojuego

Campos:

- nombre: String obligatorio
- plataforma: PC, PlayStation, Xbox, Switch, Movil
- genero: accion, rol, estrategia, puzzle,
  deportes, otro
- estado: jugando, pausado, completado, abandonado
- logros: subdocumentos con nombre y obtenido
- createdAt: Date
- updatedAt: Date

## Modelo Partida

Campos:

- videojuego: ObjectId, ref Videojuego
- fecha: Date obligatoria
- duracionMinutos: Number, mayor que 0
- porcentajeAvance: Number, entre 0 y 100
- notas: String opcional
- createdAt: Date
- updatedAt: Date

## Justificación de las relaciones

### Logros embebidos

Los logros están embebidos dentro de Videojuego
porque son una lista pequeña y se consultan
junto con el juego.

### Partidas referenciadas

Las partidas pertenecen a una colección independiente
porque pueden aumentar continuamente y consultarse
sin recuperar todo el documento Videojuego.

## Resumen calculado

GET /api/videojuegos/:id/resumen

totalPartidas = cantidad de partidas

horasTotales = suma(duracionMinutos) / 60

ultimaPartida = fecha de la sesión más reciente

porcentajeAvanceActual = suma del avance ganado en
todas las sesiones del videojuego, limitada a 100%.

Si dos partidas tienen la misma fecha se aplicará
un criterio determinista de desempate.

Si no existen partidas:

- totalPartidas: 0
- horasTotales: 0
- ultimaPartida: null
- porcentajeAvanceActual: 0

El cálculo se realizará en la capa de servicio.

Cada `Partida.porcentajeAvance` representa el avance ganado durante esa
sesión. Los registros existentes no se modifican automáticamente: si se
guardaron como porcentajes absolutos, deben revisarse y recrearse o migrarse
manualmente a incrementos por sesión antes de usarlos con esta semántica.

## Arquitectura

Backend:
Rutas -> Controladores -> Servicios -> Modelos

Frontend:
Páginas -> Servicios API -> Backend

## Manejo de errores

400: validaciones e identificadores incorrectos
404: recurso o referencia inexistente
500: error inesperado

Se implementarán requestId, logger y
errorHandler centralizado.

## Ejecución local

### Backend

cd backend
npm install
npm run dev

http://localhost:3000/api/health

### Frontend

cd frontend
npm install
npm run dev

http://localhost:5173

## Variables de entorno

Backend:
- PORT
- MONGODB_URI
- CLIENT_URL
- NODE_ENV



Despliege Front: https://entregable3-frontend.onrender.com/

Despliege Back: https://entregable3-1v2.onrender.com

GitHub https://github.com/Arisofi28/entregable3

Video Youtube. Prueba. https://youtu.be/b7lNVFGCRm8
