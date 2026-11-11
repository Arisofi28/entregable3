---
name: nueva-spec
description: Crea una spec nueva en docs/specs/ a partir de un ticket del backlog, con reglas DEBE / NO DEBE, tabla criterio → verificación y tabla ticket → archivos.
argument-hint: "<id-ticket o épica> <nombre-corto>"
disable-model-invocation: true
---

# /nueva-spec

Crea `docs/specs/<nombre-corto>.md` para: $ARGUMENTS

## Pasos

1. Lee `AGENTS.md`, el PRD (`docs/prd/`) y el backlog (`docs/backlog/`). Localiza las historias,
   criterios (DADO / CUANDO / ENTONCES) y tickets que cubre la spec. Si no existen, detente y
   pide que se escriban primero: no se inventa producto.
2. Escribe la spec con estas secciones, en este orden:
   - **Contexto**: épica, historias y tickets que cubre (por id).
   - **Contrato**: endpoints, formas de datos o componentes. Sin código de implementación.
   - **Reglas**: lista numerada `R-xx` con **DEBE** / **NO DEBE**. Cada regla de negocio del PRD
     que aplique aparece aquí, citando su id (`RN-xx`).
   - **Tabla criterio → verificación**: `| Criterio | Regla | Verificación (test, curl o revisión) |`.
     Todo criterio verificable sin base de datos se verifica con un test automatizado.
   - **Tabla ticket → archivos**: `| Ticket | Archivos que crea o modifica |`.
   - **Fuera de alcance**.
3. No escribas código. La spec se commitea sola, antes del código:
   `docs(E2): spec <nombre-corto>`.
4. Muestra un resumen con los criterios que quedaron sin verificación automática.
