# Firestore Security Rules

Estas son las reglas de seguridad que debes configurar en Firebase Console para proteger tus datos.

## Pasos para agregar las reglas:

1. Ve a Firebase Console → Tu proyecto
2. Firestore Database → Rules (pestaña)
3. Reemplaza el contenido con las siguientes reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tareas: cada usuario solo accede a las suyas (campo userId == auth.uid)
    match /tasks/{taskId} {
      allow read, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      // update: debe ser el dueño y no puede cambiar el userId
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId
        && request.resource.data.userId == resource.data.userId;
    }

    // Perfil del usuario
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Logs de cumplimiento: users/{uid}/taskLogs/{taskId}_{YYYY-MM-DD}
      // Las reglas de un documento NO bajan a sus subcolecciones, por eso va aparte.
      match /taskLogs/{logId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Denegar acceso a todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Explicación:

- **tasks**: cada usuario solo puede ver y modificar sus propias tareas. `update` además impide reasignar la tarea a otro `userId`; `delete` lo usa la acción "Eliminar tarea".
- **users/{uid}**: cada usuario solo accede a su propio perfil.
- **users/{uid}/taskLogs**: los logs de cumplimiento (marcar/desmarcar tareas). Sin esta regla la app falla al marcar tareas y el calendario no muestra completadas.
- El resto está bloqueado.

## Después de agregar las reglas:

1. Clickea "Publish" para aplicar las reglas
2. Si algo falla, la app muestra un aviso rojo en Hoy, Tablero y Calendario con el motivo (p. ej. "No tienes permiso…")

## Importante:

- `deleteTask` consulta `users/{uid}/taskLogs` por `taskId` y los borra en lote junto con la tarea; la regla de `taskLogs` lo permite porque el dueño tiene lectura y escritura.
- Estas reglas son restrictivas: solo el dueño de los datos puede verlos/modificarlos.
