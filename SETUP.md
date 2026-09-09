# Setup Daily! App

## Completado ✅

- [x] Firebase configurado (Auth + Firestore)
- [x] Auth screens (Login, Register, Forgot Password)
- [x] 4 tabs principales (Hoy, Tablero, Calendario, Perfil)
- [x] Pantalla de tareas para Hoy
- [x] Contexto de autenticación
- [x] Hooks para manejar tareas

## Próximos pasos

### 1. Configurar Firestore Security Rules

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Tu proyecto → Firestore Database → Rules
3. Copia las reglas de `FIRESTORE_RULES.md`
4. Publish

### 2. Crear colección de usuarios (opcional)

Para guardar nombre y perfil, en Firestore crea una colección `users` cuando el usuario se registra. Se puede hacer desde el contexto de auth.

### 3. Probar la app

```bash
# En la carpeta fe-daily/daily-fe
npm start

# Luego elige:
# - i para iOS (si tienes Xcode)
# - a para Android (si tienes emulador)
# - w para Web (más rápido para testing)
```

### 4. Características por implementar

- [ ] **Hoy tab**: Toggle de tareas, modal de crear tarea
- [ ] **Tablero tab**: Filtros (Activas, Futuras, Recién completadas)
- [ ] **Calendario tab**: Vistas semana/mes/año, seleccionar días
- [ ] **Perfil tab**: Subpantallas (Notificaciones, Apariencia, Cuenta, etc.)
- [ ] Notificaciones push (Firebase Cloud Messaging)
- [ ] Sincronización de datos en tiempo real (ya está con Firestore)

## Firebase Config

La config ya está en `src/lib/firebase.ts`. Si necesitas cambiarla:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDHFdyzKpJcO9pVfTY9iXIhYZZJrXokWos",
  authDomain: "daily-app-80801.firebaseapp.com",
  projectId: "daily-app-80801",
  storageBucket: "daily-app-80801.firebasestorage.app",
  messagingSenderId: "345898052899",
  appId: "1:345898052899:web:ef1e755b59b977e8efb096",
};
```

## Estructura de carpetas

```
src/
├── app/
│   ├── (tabs)/          # Tabs principales
│   │   ├── hoy.tsx      # Pantalla de hoy
│   │   ├── tablero.tsx
│   │   ├── calendario.tsx
│   │   └── perfil.tsx
│   ├── auth/            # Pantallas de autenticación
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── index.tsx        # Redirect inicial
│   └── _layout.tsx      # Layout raíz
├── contexts/
│   └── auth-context.tsx # Contexto de auth
├── lib/
│   └── firebase.ts      # Configuración Firebase
├── hooks/
│   └── use-tasks.ts     # Hook para tareas
└── types/
    └── task.ts          # Tipos TypeScript
```

## Autenticación

- **Login**: Email + contraseña
- **Register**: Email + contraseña + nombre
- **Forgot Password**: 3 pasos (email → código → nueva contraseña)
- OAuth: Google y Apple (listos pero sin implementación completa)

## Datos en Firestore

### Colección: `tasks`

```javascript
{
  id: "auto-generated",
  userId: "user-id", // De Firebase Auth
  title: "Ir al gym",
  category: "Personal" | "Salud" | "Casa" | "Pareja",
  time: "14:30", // Optional
  done: false,
  completedAt: null, // O epoch ms si está completada
  dateStart: "2026-09-08", // Optional
  dateEnd: "2026-09-15", // Optional
  repeatDays: [0, 2, 4], // Optional, 0=Mon, 1=Tue, etc.
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

## Notas

- La app usa Expo Router para navegación
- Styles están en React Native (no Tailwind en este caso, aunque TailwindCSS está instalado para web si necesitas)
- Material Design / iOS style buttons/inputs según plataforma
- Dark mode es por defecto (Nocturne design system)

¡Listo para empezar a desarrollar! 🚀
