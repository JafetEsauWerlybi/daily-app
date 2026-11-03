# Daily! (daily-fe)

App móvil de tareas personales: Expo 57 + React Native 0.86, Firebase (Auth + Firestore), Expo Router, NativeWind y TypeScript.

Pestañas: **Hoy**, **Tablero** (semana), **Calendario** (semana/mes/año), **Notas** y **Perfil** (notificaciones, apariencia, cuenta, privacidad, ayuda). Tareas con recurrencia y logs de cumplimiento por día, notificaciones locales, tema claro/oscuro con color de acento, Google Sign-In.

## Empezar

```bash
npm install
npx expo start        # requiere el development build en el teléfono (no funciona en Expo Go)
```

La app usa módulos nativos (`expo-notifications`, Google Sign-In), por lo que se corre con un APK de desarrollo compilado con EAS. Ver [SETUP.md](SETUP.md) para compilar, publicar las reglas de Firestore y la configuración de Firebase.

## Documentación

- [SETUP.md](SETUP.md) — puesta en marcha, estructura y modelo de datos
- [FIRESTORE_RULES.md](FIRESTORE_RULES.md) — reglas de seguridad de Firestore
- [.claude/CLAUDE.md](.claude/CLAUDE.md) — arquitectura, patrones, problemas resueltos y pendientes (referencia principal)
- `../../README.md` y `../../MOBILE_APP.md` — especificación de diseño y guía de implementación móvil
