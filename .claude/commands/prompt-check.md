Evalúa la calidad del prompt del usuario (dado en $ARGUMENTS) antes de ejecutarlo. Umbral mínimo: 9/10.

Entrada: $ARGUMENTS

## Criterios (10 puntos, PASA/FALLA/N-A cada uno, score = promedio de los aplicables)

1. Objetivo claro — ¿se entiende el resultado final esperado? Mejora: pedir una frase tipo "quiero que X termine haciendo Y".
2. Alcance/límites — ¿dice qué tocar y qué no? Mejora: nombrar archivos/módulos explícitos y excluir el resto.
3. Contexto técnico previo — ¿describe el error o comportamiento actual vs esperado? Mejora: incluir el síntoma exacto, no algo vago.
4. Criterio de éxito verificable — ¿hay forma de saber cuándo terminó (test, ejemplo de output)? Mejora: agregar caso de prueba concreto.
5. Tono/urgencia — ¿es directivo y específico o ambiguo/pasivo? Mejora: usar verbos imperativos ("cambia", "agrega", "no toques").
6. Interpretación libre — ¿deja decisiones de diseño sin guía (naming, estructura, UI)? Mejora: decidirlas de antemano o decir "decide tú y explica por qué".
7. Restricciones de proceso — ¿recuerda reglas críticas del proyecto (no commits/builds automáticos, no simplificar flujos críticos)? Mejora: reafirmarlas si la tarea es sensible.
8. Tamaño de la tarea — ¿es atómica o mezcla varias tareas grandes no relacionadas? Mejora: dividir en pasos o pedir plan primero.
9. Huecos no mencionados — detecta lo que falta (rama, tests a correr, si afecta mobile+web, migraciones). Mejora: listar qué se asumió por defecto.
10. Formato de respuesta esperado — ¿dice cómo quiere la respuesta (diff, código directo, sin resúmenes)? Mejora: especificarlo si importa.

## Salida (texto plano, sin emojis, sin preamble)

```
Score: X.X/10
Reforzar: N (motivo corto), N (motivo corto)
No mencionado: N (qué se asumió), N (qué se asumió)
OK: N, N, N
```

## Decisión según score

- Score >= 9: muestra el bloque de salida y EJECUTA la tarea original de inmediato después, sin pedir confirmación. Si hubo puntos en "Reforzar" o "No mencionado" aunque pasó el umbral, muéstralos igual pero no bloquean la ejecución.
- Score < 9: muestra el bloque de salida y DETENTE. No ejecutes la tarea. Pregunta: "Score debajo de 9. ¿Ajusto el prompt o fuerzas la ejecución igual?"

## Reglas
- Sin emojis, sin preamble
- Máximo 1 línea por punto
- Solo estos 10 puntos, ninguno extra
- N/A si no aplica; no cuenta en el promedio
- Este comando es local a SACSProv2, no se replica a otros proyectos
