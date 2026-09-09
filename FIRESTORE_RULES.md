# Firestore Security Rules

Estos son las reglas de seguridad que debes configurar en Firebase Console para proteger tus datos.

## Pasos para agregar las reglas:

1. Ve a Firebase Console → Tu proyecto
2. Firestore Database → Rules (pestaña)
3. Reemplaza el contenido con las siguientes reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden leer/escribir sus propias tareas
    match /tasks/{taskId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Los usuarios solo pueden leer/escribir sus propios datos de perfil
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Denegar acceso a todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Explicación:

- **tasks**: Cada usuario solo puede ver y modificar sus propias tareas (donde `userId` coincide con su `auth.uid`)
- **users**: Cada usuario solo puede ver y modificar su propio perfil
- El resto está bloqueado

## Después de agregar las reglas:

1. Clickea "Publish" para aplicar las reglas
2. Listo, ahora la app está asegurada

## Importante:

- Siempre verifica que `userId` en tus tareas sea igual al `auth.uid` del usuario autenticado
- Estas reglas son restrictivas — solo el dueño de los datos puede verlos/modificarlos
