# Setup Daily! App

## Completado ✅

- [x] Firebase configurado con React Native Firebase (Auth + Firestore nativos, modo offline)
- [x] Auth screens (Login, Register, Olvidé mi contraseña) con Google Sign-In
- [x] 5 tabs principales (Hoy, Tablero, Calendario, Notas, Perfil)
- [x] Tareas con recurrencia y logs de cumplimiento
- [x] Contexto de autenticación, hooks de tareas, logs y notas
- [x] Notificaciones locales (development build con EAS)
- [x] Sub-pantallas de Perfil (Notificaciones, Apariencia, Cuenta, Privacidad, Ayuda)

## Próximos pasos

### 1. Publicar las reglas de Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Tu proyecto → Firestore Database → Rules
3. Copia las reglas de `FIRESTORE_RULES.md` (cubren `tasks`, `users/{uid}`, `users/{uid}/taskLogs` y `users/{uid}/notes`; las reglas de un documento **no** bajan a sus subcolecciones)
4. Publish

> **Pendiente:** las reglas de `notes` aún hay que publicarlas; sin ellas la pestaña Notas muestra error de permisos.

### 2. Probar la app

La app ya **no** corre en Expo Go (`expo-notifications` y Google Sign-In necesitan código nativo). Se usa un development build:

```bash
# En la carpeta fe-daily/daily-fe
npx expo start            # Metro; abre el APK de desarrollo en el teléfono
npx expo start -c         # con caché limpia (necesario al cambiar tailwind.config.ts / global.css)

# Compilar el APK en la nube (login con `npx eas-cli login`)
npx eas-cli build --profile development --platform android   # necesita Metro en la PC
npx eas-cli build --profile preview --platform android       # APK autónomo para uso diario
```

Recompilar solo cuando cambian dependencias nativas, plugins/permisos de `app.json` o la versión de Expo/RN; el código JS se recarga con Metro.

### 3. Características pendientes

- [x] **Hoy**: toggle de tareas, modal de crear tarea
- [x] **Tablero**: semana en curso con secciones plegables por día y logs de cumplimiento
- [x] **Calendario**: vistas semana/mes/año, indicadores por día, lista del día y acciones de tarea
- [x] **Notas**: pestaña independiente de las tareas (lista, búsqueda, fijar, colores, editor con autoguardado)
- [x] **Perfil**: las 5 sub-pantallas
- [x] Notificaciones locales de tareas
- [ ] Probar la pestaña Notas en el teléfono
- [ ] Login con Apple (iOS)
- [ ] Notificaciones push (Firebase Cloud Messaging)
- [ ] Contacto de soporte en Ayuda (falta definir correo)
- [ ] Al publicar en Play Store: agregar el SHA-1 de Play App Signing en Firebase (Google Sign-In)

## Firebase Config

La app usa **React Native Firebase** (SDK nativo), no el paquete web `firebase`. La configuración sale de `google-services.json` en la raíz del proyecto (descargado de Firebase Console, Configuración del proyecto, app Android `com.daily.app`) y está referenciado en `app.json → expo.android.googleServicesFile`. Los plugins `@react-native-firebase/app` y `@react-native-firebase/auth` van en `app.json`; `firestore` no lleva plugin. `src/lib/firebase.ts` solo exporta `auth` y `db`.

Cambiar `google-services.json` o los plugins requiere recompilar el APK.

### Modo offline

Firestore nativo guarda los datos en disco y mantiene una cola de escrituras: se puede crear, marcar y editar sin internet, incluso cerrando la app, y se sincroniza al reconectar. Sigue necesitando internet: login/registro/Google, recuperar o cambiar contraseña, eliminar cuenta y el primer arranque en un teléfono nuevo. En el APK de desarrollo, Perfil → "Simular sin internet" permite probarlo sin apagar el Wi-Fi que usa Metro.

## Estructura de carpetas

```
src/
├── app/
│   ├── (tabs)/          # hoy, tablero, calendario, notas, perfil
│   ├── auth/            # login, register, forgot-password (un solo paso)
│   ├── apariencia.tsx, notificaciones.tsx, cuenta.tsx, privacidad.tsx, ayuda.tsx  # sub-pantallas de Perfil
│   ├── nota.tsx         # editor de nota
│   ├── index.tsx        # Redirect inicial
│   └── _layout.tsx      # Layout raíz (providers)
├── components/          # AddTaskModal, TaskRow, TaskDetailsModal, ConfirmModal, calendar/, NoteCard, ...
├── constants/           # categories, dates, note-colors
├── contexts/            # auth, loading, theme, notification-settings, navigation-history
├── hooks/               # use-tasks, use-task-logs, use-notes, use-task-notifications, use-back-handler
├── lib/                 # firebase, google-auth, notifications, task-schedule, theme, firestore-error, note-format
└── types/               # task.ts, note.ts
```

Detalle completo en `.claude/CLAUDE.md`.

## Autenticación

- **Login / Registro**: email + contraseña, o Google (nativo, solo en el development build)
- **Olvidé mi contraseña**: un solo paso — `sendPasswordResetEmail` envía un enlace por correo (Firebase no ofrece código de 6 dígitos desde el cliente)
- **Cuenta**: cambiar nombre y contraseña, eliminar cuenta (reautenticación + borrado de datos)
- Apple: pendiente

## Datos en Firestore

### Colección: `tasks`

```javascript
{
  id: "auto-generated",
  userId: "user-id", // De Firebase Auth
  title: "Ir al gym",
  category: "Personal" | "Salud" | "Casa" | "Pareja",
  time: "14:30", // Optional (hora de notificación)
  dateStart: "2026-09-08", // Optional; sin repeatDays es el único día de la tarea
  dateEnd: "2026-09-15", // Optional; solo con repeatDays
  repeatDays: [0, 2, 4], // Optional, 0=Lun .. 6=Dom
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

La tarea **ya no** tiene `done`/`completedAt`; el cumplimiento va por día en los logs.

### Subcolección: `users/{uid}/taskLogs/{taskId}_{YYYY-MM-DD}`

```javascript
{ taskId, date: "2026-09-08", completed: true, completedAt: 1757300000000, updatedAt }
```

"No completada" se calcula (día pasado + tarea programada + sin log completado); no se guarda.

### Subcolección: `users/{uid}/notes/{noteId}`

```javascript
{ title, body, color, pinned, createdAt, updatedAt } // epoch ms
```

### Documento: `users/{uid}`

Perfil del usuario (`name`, etc.), creado al registrarse o al entrar con Google por primera vez.

## Notas

- La app usa Expo Router para navegación
- Estilos con NativeWind (clases Tailwind) + fuente Momo Trust Sans; los colores pasan por variables del tema, no hex fijos
- Tema oscuro por defecto; en Perfil → Apariencia se cambia a claro y se elige el color de acento (solo en el dispositivo)

Convenciones, problemas resueltos y "no repetir" están en `.claude/CLAUDE.md`.
