---
name: update-project-docs
description: Use when the user asks to update the project documentation with recent implementation changes (e.g. "actualiza la documentación con los cambios que implementamos"), after a feature/fix session on Daily!, before starting a new unrelated feature, or when docs mention a library/approach that was later reverted or replaced
---

# Update Project Docs (Daily!)

## Overview
Daily!'s docs drift from the real implementation during a session: a library gets tried and reverted, a field's UI changes, a modal gets rebuilt twice. This skill updates exactly the 3 project doc files to match what's *actually* in the code — no more, no less.

## The 3 files (know which language/audience each is)
- `G:\daily\fe-daily\daily-fe\.claude\CLAUDE.md` — Spanish, "lecciones aprendidas" / architecture doc for future Claude sessions. Has a "Problemas Resueltos & No Repetir" table, stack list, Estructura de Carpetas, Próximos Pasos, Última Sesión.
- `G:\daily\MOBILE_APP.md` — English, platform implementation guidance (prototype → native mapping).
- `G:\daily\README.md` — English, design-spec handoff doc (per-screen field-by-field spec).

## Process
1. **Diff reality vs docs.** Grep the docs for library/API names they currently claim (`grep -in "<libname>" README.md MOBILE_APP.md`). Cross-check against `package.json` (`grep <libname> package.json`) — if a doc claims a library that's not installed, it was reverted; find what actually replaced it by reading the real component file.
2. **Check for disabled/commented code** in the touched files (e.g. a `console.log` swapped in for a real submit call). If found, tell the user explicitly — don't silently "fix" it and don't silently document it as if it were finished. Report it, then document the doc update as reflecting current (possibly incomplete) state.
3. **Scope strictly to what was touched this session.** Do not edit README.md/MOBILE_APP.md sections describing screens/features that were not part of the implementation work (e.g. Tablero, Calendario, Profile sub-screens) even if they look outdated for unrelated reasons — that's a different task.
4. **Update README.md / MOBILE_APP.md**: rewrite only the specific bullets/fields that changed. Preserve the doc's existing voice (English, spec-style for README, guidance-style for MOBILE_APP).
5. **Update CLAUDE.md**:
   - Stack list: add/remove libraries actually installed/removed.
   - "Problemas Resueltos & No Repetir" table: add a row for anything that was tried and reverted (library conflicts, gesture bugs, etc.) — this table is what prevents repeating the same failed approach next session.
   - Arquitectura & Patrones: add a numbered subsection if a non-obvious pattern was established (same Problema/Solución/No repetir format as existing entries).
   - Estructura de Carpetas: add new files/folders.
   - Próximos Pasos Pendientes: remove finished items, add newly-discovered pending work (including the disabled-code flag from step 2 if relevant).
   - Última Sesión: replace with today's date, bullet list of what was actually done, and what's pending immediately next.
6. **Report to the user** what was updated in each file and flag anything from step 2.

## Common mistakes
- Documenting a reverted library as if it's still recommended (check package.json, not just memory of the conversation).
- Touching Tablero/Calendario sections "while you're in there" — stay scoped to what was implemented.
- Treating `console.log`-stubbed code as a finished feature in the docs.
