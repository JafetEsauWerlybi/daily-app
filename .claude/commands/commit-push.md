Valida el repo git y, si todo pasa, resume los cambios en un título corto, los commitea y hace push a la rama actual.

Entrada (opcional, contexto extra del usuario): $ARGUMENTS

## PASO 1: PR-CHECK (validación previa, no continuar si falla)

Corre estas verificaciones en orden. Si alguna falla, DETENTE y muestra cuál falló y por qué — no sigas a los pasos siguientes.

1. **Repositorio existente**: `git rev-parse --is-inside-work-tree` — debe confirmar que estamos dentro de un repo git.
2. **Remoto configurado**: `git remote -v` — debe existir al menos un remoto (ej. `origin`).
3. **Rama actual y tracking**: `git branch --show-current` y `git status -sb` — identifica la rama activa y si tiene upstream configurado (si no tiene upstream, el push necesitará `-u origin <rama>`, avisar antes de hacerlo).
4. **Cambios existentes**: `git status --short` — debe haber al menos un archivo modificado/nuevo/borrado. Si no hay cambios, DETENTE y dilo, no hay nada que commitear.
5. **Permisos de escritura al remoto**: `git ls-remote --exit-code origin` (o el remoto detectado) — si falla por auth/permisos, DETENTE y explica que no hay permiso de push a ese remoto.
6. **Nada sensible en el diff**: revisa `git status` y `git diff --stat` — si aparece algún archivo tipo `.env`, `*.pem`, `credentials*`, `appsettings*.Development.json` con secretos, o similar, avisa antes de seguir (no lo excluyas automáticamente, pregunta).

Muestra un resumen corto de este PR-check:
```
PR-check: OK
Rama: <rama>
Remoto: <remoto>
Archivos con cambios: N
```
Si algo falló, en vez de "OK" pon "FALLÓ: <motivo>" y termina ahí.

## PASO 2: RESUMEN Y TÍTULO

Si el PR-check pasó, corre `git diff` (staged y no staged) y `git status --short` para entender los cambios reales — no inventes, basa el título en el diff real.

Genera un título simple de commit (imperativo, español, sin punto final, idealmente <70 caracteres) que resuma el cambio principal. Si $ARGUMENTS trae contexto del usuario, úsalo para afinar el título, no lo ignores.

Muestra el título propuesto y la lista de archivos a incluir, y pregunta: **"¿Confirmas este commit y push a la rama '<rama>'? (sí / ajusta el título / cancela)"**

No avances al PASO 3 sin una confirmación explícita del usuario en el chat.

## PASO 3: COMMIT Y PUSH (solo tras confirmación)

1. `git add` únicamente los archivos relevantes mostrados en el PASO 2 (nunca `git add -A` a ciegas si hay archivos sensibles detectados).
2. Commit con el título confirmado, terminando el mensaje con:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
3. Push a la rama actual (`git push`, o `git push -u origin <rama>` si no tiene upstream).
4. Confirma al usuario con el hash corto del commit y que el push fue exitoso.

## Reglas
- Nunca hagas push sin confirmación explícita del usuario en el chat, aunque el PR-check haya pasado.
- Nunca uses `--force`, `--no-verify`, ni saltes hooks.
- Si el PR-check falla en cualquier punto, no propongas título ni pidas confirmación de push — solo reporta el fallo.
- Sin emojis, sin preamble largo.
- Este comando es local a SACSProv2, no se replica a otros proyectos.
