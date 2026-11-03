# Offline real con React Native Firebase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la app (APK) permita crear/editar/borrar notas, crear tareas, marcarlas y consultarlas **sin internet, incluso cerrando y reabriendo la app**, y que todo se sincronice solo al volver la conexión.

**Architecture:** Hoy el proyecto usa el SDK web `firebase` (JS), cuyo Firestore en React Native solo tiene caché **en memoria** (sin IndexedDB). Se migra a `@react-native-firebase/{app,auth,firestore}` (SDK nativo de Android/iOS), que trae **caché en disco y cola de escrituras activadas por defecto**. Como Firestore nativo usa la sesión de Auth **nativa**, Auth también migra. La API modular de RN Firebase es casi idéntica a la del SDK web, así que el grueso del cambio son imports, más quitar los `await` de escrituras que hoy bloquean la UI sin internet.

**Tech Stack:** Expo 57.0.31, React Native 0.86.3 (New Architecture), `@react-native-firebase/app|auth|firestore` (línea **26.4.x**, ver Task 1), `@react-native-google-signin/google-signin` 16.1.5 (se conserva), EAS Build (development profile).

**Spec:** No hay documento de diseño aparte; los requisitos salen de la conversación del 2026-11-03 (el usuario eligió la "opción 1": React Native Firebase). Contexto previo: `.claude/CLAUDE.md` secciones 3, 11, 12 y 14.

## Global Constraints

- Leer la doc exacta de Expo 57 (https://docs.expo.dev/versions/v57.0.0/) antes de tocar config nativa (regla de `AGENTS.md`).
- Textos de UI en español de México; fuente `MomoTrustSans-*`; estilos con clases NativeWind y colores vía `useTheme().colors` (sin hex nuevos; el rojo de `ErrorBanner` ya existe).
- No pasar valores `undefined` a Firestore (omitir el campo).
- `npx expo install` actualiza muchos paquetes del SDK: revisar `git diff package.json` después de cada instalación.
- El proyecto **no tiene framework de tests** (sin jest). No se agrega uno (YAGNI): la verificación es `npx tsc --noEmit` + las pruebas manuales en el teléfono de las Tasks 6 y 7.
- Cambios nativos ⇒ **nuevo APK** (`npx eas-cli build --profile development --platform android`). El JS se recarga con Metro.
- No importar módulos nativos opcionales con `import` estático en el arranque (regla existente); RN Firebase es obligatorio para la app, por lo que aquí sí es import normal.
- Web queda fuera: RN Firebase no existe en web. La app es Android (iOS pendiente); los archivos `*.web.tsx` de la plantilla ya no se usan.
- Rama de trabajo: `feat/offline-rnfirebase`. Un commit por task.

## Hallazgos de la revisión del proyecto (por qué el plan es así)

1. `src/lib/firebase.ts` usa `getFirestore(app)` del SDK web → caché solo en memoria. Es la causa raíz.
2. Firestore nativo **no ve** la sesión de `firebase/auth` (JS). Migrar solo Firestore daría `permission-denied`. Hay que migrar Auth y Google Sign-In (`lib/google-auth.ts`, `contexts/auth-context.tsx`).
3. Todas las escrituras hacen `await` (`addDoc`, `setDoc`, `updateDoc`, `batch.commit`). En Firestore la promesa **solo se resuelve cuando el servidor confirma**; sin internet queda pendiente aunque el dato ya esté en la caché local. Sitios que se quedarían colgados offline:
   - `hoy.tsx` `handleQuickAdd`: espera `addTask` antes de limpiar el input.
   - `nota.tsx` `handleDelete`: espera `deleteNotes` antes de `router.back()`.
   - `notas.tsx` `handleDelete` / `handlePin`: esperan antes de limpiar la selección.
   - `use-tasks.ts` `deleteTask`: hace `getDocs` (lectura de servidor) de los logs antes de borrar.
4. `lib/firestore-error.ts` compara códigos como `"permission-denied"`; RN Firebase los entrega con prefijo (`"firestore/permission-denied"`). Hay que normalizarlos (se confirma en la Task 1).
5. Compatibilidad de Kotlin (**riesgo principal**): `@react-native-firebase` **27.x** exige Kotlin Gradle plugin ≥ 2.4.0, y RN 0.86.3 trae Kotlin **2.1.20** (`node_modules/react-native/gradle/libs.versions.toml`). Por eso el plan apunta a la **línea 26.4.x** y la Task 1 es un spike que lo valida con un build real antes de tocar código de la app. 26.x también exige New Architecture (RN 0.86 ya la trae obligatoria).
6. Se requiere `google-services.json` (hasta hoy no se usaba). La app `com.daily.app` ya está registrada en Firebase con el SHA-1 de EAS, solo falta descargar el archivo.
7. Las sesiones actuales viven en el almacenamiento del SDK JS: tras migrar, **cada usuario tendrá que iniciar sesión una vez**. Los datos de Firestore no cambian (mismas colecciones y reglas).
8. `serverTimestamp()` en escrituras offline aparece como `null` en el snapshot local hasta que el servidor responde. `Task.createdAt` ya se trata como "si ya es conocido" en `isTaskForDate`, y las notas usan `Date.now()`; no hay cambio necesario.
9. Con caché en disco, abrir la app sin internet entrega los datos guardados (el riesgo de que `syncTaskNotifications` cancele todo con lista vacía solo queda en el **primer** arranque offline de una instalación nueva, donde tampoco hay notificaciones programadas). Se comprueba en la Task 7.
10. `package.json` tiene `firebase ^12.18.0` como dependencia directa; RN Firebase trae su propia versión de `firebase`. Se elimina la directa para evitar dos copias.

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `package.json`, `package-lock.json` | Modify | Quitar `firebase`; añadir `@react-native-firebase/app\|auth\|firestore` (+ `expo-build-properties` solo si la Task 1 lo exige) |
| `app.json` | Modify | `android.googleServicesFile`, plugins de RN Firebase |
| `google-services.json` | Create | Config nativa de Firebase para `com.daily.app` (se versiona) |
| `src/lib/firebase.ts` | Rewrite | Exporta `auth` y `db` nativos (sin config JS) |
| `src/lib/firestore-error.ts` | Modify | Normalizar el prefijo `firestore/` del código |
| `src/lib/google-auth.ts` | Modify | Credencial/`signInWithCredential` de RN Firebase Auth |
| `src/contexts/auth-context.tsx` | Modify | Imports + `User` de RN Firebase Auth |
| `src/hooks/use-notes.ts` | Modify | Escrituras sin `await` bloqueante |
| `src/hooks/use-task-logs.ts` | Modify | Ídem |
| `src/hooks/use-tasks.ts` | Modify | Ídem + `deleteTask` sin lectura de servidor + `fromCache` |
| `src/app/(tabs)/hoy.tsx`, `src/app/(tabs)/notas.tsx`, `src/app/nota.tsx` | Modify | Quitar `await` de escrituras |
| `src/components/OfflineBanner.tsx` | Create | Aviso "Sin conexión" |
| `src/app/(tabs)/hoy.tsx`, `tablero.tsx`, `calendario.tsx`, `notas.tsx` | Modify | Mostrar el aviso |
| `.claude/CLAUDE.md`, `SETUP.md`, `G:\daily\MOBILE_APP.md` | Modify | Documentar el cambio |

---

### Task 1: Spike de compatibilidad (sin tocar código de la app)

Objetivo: comprobar con un build real que RN Firebase compila con Expo 57 / RN 0.86 / Kotlin 2.1.20 **antes** de migrar nada. Si falla, el resto del plan no aplica y se decide con el usuario.

**Files:**
- Modify: `package.json`, `package-lock.json`, `app.json`
- Create: `google-services.json`

**Interfaces:**
- Produces: la versión de RN Firebase validada (`<VER>`) que usan las demás tasks, y si hace falta `expo-build-properties` con `android.kotlinVersion`.

- [ ] **Step 1: Crear la rama**

```bash
git checkout -b feat/offline-rnfirebase
```

- [ ] **Step 2: Descargar `google-services.json`**

Firebase Console → Configuración del proyecto → Tus apps → app Android `com.daily.app` → "Descargar google-services.json". Guardarlo en la raíz de `fe-daily/daily-fe/` (junto a `app.json`). No es secreto (la API key de Firebase ya está en el código fuente), por eso se versiona. Confirmar que contiene `"package_name": "com.daily.app"`:

```bash
grep -n "package_name" google-services.json
```
Expected: `"package_name": "com.daily.app"`.

- [ ] **Step 3: Instalar RN Firebase (línea 26.4.x)**

```bash
npm install @react-native-firebase/app@~26.4.1 @react-native-firebase/auth@~26.4.1 @react-native-firebase/firestore@~26.4.1
npm uninstall firebase
git diff --stat package.json
```
Expected: solo cambian las líneas de esos paquetes y la de `firebase`. (`firebase` sigue llegando como dependencia interna de `@react-native-firebase/app`.) Este paso **rompe `tsc` a propósito** hasta la Task 2; no commitear aún.

- [ ] **Step 4: Registrar plugins y el archivo de servicios en `app.json`**

En `expo.android` agregar `"googleServicesFile": "./google-services.json"` y en `expo.plugins` agregar los plugins (conservar los existentes):

```json
"android": {
  "adaptiveIcon": { "...": "sin cambios" },
  "predictiveBackGestureEnabled": false,
  "package": "com.daily.app",
  "googleServicesFile": "./google-services.json"
},
"plugins": [
  "expo-router",
  ["expo-notifications", { "color": "#a855f7" }],
  "expo-image",
  "expo-splash-screen",
  "expo-web-browser",
  "@react-native-google-signin/google-signin",
  "@react-native-firebase/app",
  "@react-native-firebase/auth"
]
```
(`@react-native-firebase/firestore` **no** lleva plugin: no define `app.plugin.js` y ponerlo rompe `expo config`. Verificado.)

- [ ] **Step 5: Compilar el APK de prueba en EAS**

```bash
npx eas-cli build --profile development --platform android
```
Expected: build **exitoso**. El spike no necesita que la app funcione (el código aún importa `firebase/auth`, que ya no está instalado, así que **Metro fallará al abrir**); solo importa que compile el nativo.

Para que el spike pase por Metro sin migrar todo, no se instala el APK todavía: este paso solo valida compilación nativa.

- [ ] **Step 6: Si el build falla por Kotlin/KSP, aplicar la salida documentada**

Síntoma: errores de `Module was compiled with an incompatible version of Kotlin` o de KSP. Salida (requiere versión de Kotlin que SÍ soporte el SDK de Firebase de la línea 26; confirmar en `docs/migrating-to-v26` de RN Firebase y en la tabla `kspVersionsMap` de `node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle`):

```bash
npx expo install expo-build-properties
```
```json
["expo-build-properties", { "android": { "kotlinVersion": "<VERSION_SOPORTADA_POR_EXPO_57_Y_RNFB_26>" } }]
```
Volver a compilar. **Si no hay combinación que compile, DETENER el plan** y llevar al usuario el resultado (alternativas: opción 2 capa local propia, o la solución mínima de lectura offline con AsyncStorage).

- [ ] **Step 7: Registrar el resultado y commitear la config**

Anotar en el commit la versión validada. `tsc` aún no pasa; es esperado en esta rama intermedia.

```bash
git add package.json package-lock.json app.json google-services.json
git commit -m "Agregar React Native Firebase y google-services.json (config nativa)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cliente Firebase nativo y normalización de errores

**Files:**
- Rewrite: `src/lib/firebase.ts`
- Modify: `src/lib/firestore-error.ts`

**Interfaces:**
- Produces: `export const auth: Auth` y `export const db: Firestore` (mismos nombres que hoy; el resto del código no cambia sus imports `from "@/lib/firebase"`). Se elimina el `export default app`.
- Produces: `describeFirestoreError(err, fallback)` reconoce `"firestore/permission-denied"` igual que `"permission-denied"`.

- [ ] **Step 1: Reescribir `src/lib/firebase.ts`**

```ts
import { getAuth, useDeviceLanguage } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// SDK nativo: la config sale de google-services.json (app.json → android.googleServicesFile).
// La sesión de Auth y la caché de Firestore (en disco, con cola de escrituras pendientes)
// las gestiona el SDK nativo; no hace falta AsyncStorage ni initializeApp.
export const auth = getAuth();
useDeviceLanguage(auth);

export const db = getFirestore();
```

Antes de continuar confirmar que ningún archivo importa el `default` de `@/lib/firebase`:

```bash
grep -rn "import app from\|from '../lib/firebase'\|from \"@/lib/firebase\"" src
```
Expected: solo imports con nombre (`auth`, `db`).

- [ ] **Step 2: Normalizar el código en `src/lib/firestore-error.ts`**

Reemplazar la obtención del código:

```ts
export function describeFirestoreError(err: unknown, fallback: string): string {
  const rawCode =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  // RN Firebase entrega "firestore/permission-denied"; el SDK web "permission-denied".
  const code = rawCode.replace(/^firestore\//, "");
```
(El `switch` y los mensajes no cambian.)

- [ ] **Step 3: Verificar compilación de TypeScript de estos dos archivos**

Run: `npx tsc --noEmit 2>&1 | grep -E "lib/(firebase|firestore-error)"`
Expected: sin errores en esos dos archivos (los demás archivos aún fallan hasta las siguientes tasks).

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase.ts src/lib/firestore-error.ts
git commit -m "Usar cliente nativo de Firebase y normalizar códigos de error

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Auth y Google Sign-In con RN Firebase

**Files:**
- Modify: `src/lib/google-auth.ts`
- Modify: `src/contexts/auth-context.tsx`

**Interfaces:**
- Consumes: `auth`, `db` de `@/lib/firebase` (Task 2).
- Produces: `AuthContextType` **sin cambios** (mismas funciones y firmas), con `user: User | null` donde `User` es el de `@react-native-firebase/auth` (expone `uid`, `email`, `displayName`, `providerData`).

- [ ] **Step 1: `google-auth.ts` — imports**

Reemplazar las líneas 2-7:

```ts
import {
  AuthCredential,
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import { auth } from "@/lib/firebase";
```
(El resto del archivo no cambia: `GoogleAuthProvider.credential(idToken)` y `signInWithCredential(auth, credential)` tienen la misma firma.)

- [ ] **Step 2: `auth-context.tsx` — imports de Auth y Firestore**

Reemplazar las líneas 2-25 por:

```ts
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import { auth, db } from '../lib/firebase';
```

- [ ] **Step 3: Dejar de esperar escrituras de perfil que no necesitan confirmación**

`register` y `updateDisplayName` hacen `await setDoc` del documento `users/{uid}`; sin internet esas funciones **no se pueden ejecutar de todos modos** (`createUser…` y `updateProfile` requieren red), así que se dejan como están. `loginWithGoogle` hace `await getDoc(ref)` (lectura): el login ya exigió red, no cambia.

Solo hay que revisar que `register` use `new Date()` para `createdAt` (ya lo hace; el SDK nativo lo convierte a `Timestamp`).

- [ ] **Step 4: Compilar tipos**

Run: `npx tsc --noEmit 2>&1 | grep -E "auth-context|google-auth"`
Expected: sin errores. Si TypeScript indica que `useDeviceLanguage`, `type User` o algún nombre no se exporta de `@react-native-firebase/auth`, abrir `node_modules/@react-native-firebase/auth/lib/index.d.ts`, usar el nombre exacto exportado y registrar el ajuste en el commit.

- [ ] **Step 5: Revisar los mapas de códigos de error de pantallas**

```bash
grep -n "auth/" src/app/auth/login.tsx src/app/auth/forgot-password.tsx src/app/cuenta.tsx
```
Expected: los códigos `auth/...` (`auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`, `auth/email-already-in-use`, `auth/weak-password`, `auth/requires-recent-login`, …) tienen el **mismo formato** en RN Firebase; no cambian. Confirmarlo en el dispositivo en la Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/lib/google-auth.ts src/contexts/auth-context.tsx
git commit -m "Migrar Auth y Google Sign-In a React Native Firebase

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Hooks de datos — imports y escrituras sin bloqueo

**Files:**
- Modify: `src/hooks/use-notes.ts`, `src/hooks/use-task-logs.ts`, `src/hooks/use-tasks.ts`
- Modify: `src/app/(tabs)/hoy.tsx:81-105`, `src/app/(tabs)/notas.tsx:160-170`, `src/app/nota.tsx:140-147`

**Interfaces:**
- Produces: las funciones de escritura pasan de `async … => Promise<void>` a **síncronas `=> void`**: `saveNote`, `setPinned`, `deleteNotes`, `setCompleted`, `deleteTask`, `updateTaskEnd`, `addTask`. El error de la promesa (p. ej. `permission-denied`) sigue llegando por `error`/`clearError`.
- Produces: `useTasks` devuelve además `fromCache: boolean` (Task 5).

Regla de oro de esta task: **la promesa de una escritura de Firestore solo se resuelve al confirmar el servidor**. Nunca se espera con `await` desde la UI; se lanza y se atrapa el rechazo.

- [ ] **Step 1: `use-notes.ts` — cambiar import y escrituras**

Import: `} from "firebase/firestore";` → `} from "@react-native-firebase/firestore";`. Reemplazar las tres funciones de escritura (líneas 55-95):

```ts
  // Crea o actualiza (merge). `createdAt` solo se manda al crear.
  // No se espera la promesa: sin internet solo se resuelve al volver la conexión,
  // pero el cambio ya está en la caché local y la lista se actualiza al instante.
  const saveNote = (id: string, fields: NoteFields, createdAt?: number) => {
    if (!userId) return;
    setDoc(
      doc(db, "users", userId, "notes", id),
      {
        ...fields,
        ...(createdAt !== undefined ? { createdAt } : {}),
        updatedAt: Date.now(),
      },
      { merge: true },
    ).catch((err) => setError(describeFirestoreError(err, "Error saving note")));
  };

  const setPinned = (ids: string[], pinned: boolean) => {
    if (!userId || ids.length === 0) return;
    const batch = writeBatch(db);
    // Fijar no cambia la fecha de edición: la nota conserva su lugar entre las demás.
    ids.forEach((id) =>
      batch.update(doc(db, "users", userId, "notes", id), { pinned }),
    );
    batch
      .commit()
      .catch((err) => setError(describeFirestoreError(err, "Error updating notes")));
  };

  const deleteNotes = (ids: string[]) => {
    if (!userId || ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(db, "users", userId, "notes", id)));
    batch
      .commit()
      .catch((err) => setError(describeFirestoreError(err, "Error deleting notes")));
  };
```

- [ ] **Step 2: `use-task-logs.ts`**

Import: `} from "firebase/firestore";` → `} from "@react-native-firebase/firestore";`. Reemplazar `setCompleted` (líneas 72-89):

```ts
  // Sin await: offline la promesa queda pendiente hasta reconectar (ver use-notes).
  const setCompleted = (taskId: string, day: string, completed: boolean) => {
    if (!userId) return;
    setDoc(doc(db, "users", userId, "taskLogs", logId(taskId, day)), {
      taskId,
      date: day,
      completed,
      completedAt: completed ? Date.now() : null,
      updatedAt: serverTimestamp(),
    }).catch((err) =>
      setError(describeFirestoreError(err, "Error updating task log")),
    );
  };
```

- [ ] **Step 3: `use-tasks.ts` — imports, `deleteTask`, `updateTaskEnd`, `addTask`**

Import: `} from "firebase/firestore";` → `} from "@react-native-firebase/firestore";` y agregar `getDocsFromCache` a la lista (quitar `getDocs`). Reemplazar las tres funciones (líneas 70-118):

```ts
  // Borra la tarea junto con los logs de cumplimiento que haya en la caché local.
  // Se lee de la caché (no del servidor) para que funcione sin internet: un log que
  // no esté en caché queda huérfano, y es inofensivo porque los logs solo se buscan
  // por tarea + día de una tarea existente.
  const deleteTask = (taskId: string) => {
    const logsQuery = userId
      ? query(
          collection(db, "users", userId, "taskLogs"),
          where("taskId", "==", taskId),
        )
      : null;
    (logsQuery ? getDocsFromCache(logsQuery).catch(() => null) : Promise.resolve(null))
      .then((logs) => {
        const batch = writeBatch(db);
        logs?.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, "tasks", taskId));
        return batch.commit();
      })
      .catch((err) => setError(describeFirestoreError(err, "Error deleting task")));
  };

  // Corta la vigencia de la tarea: deja de ocurrir después de `dateEnd`.
  const updateTaskEnd = (taskId: string, dateEnd: string) => {
    updateDoc(doc(db, "tasks", taskId), {
      dateEnd,
      updatedAt: serverTimestamp(),
    }).catch((err) => setError(describeFirestoreError(err, "Error updating task")));
  };

  const addTask = (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    // Firestore rechaza valores `undefined` (campos opcionales sin llenar).
    const cleanData = Object.fromEntries(
      Object.entries(taskData).filter(([, v]) => v !== undefined),
    );
    addDoc(collection(db, "tasks"), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => setError(describeFirestoreError(err, "Error adding task")));
  };
```

- [ ] **Step 4: Quitar los `await` de los llamadores**

`src/app/(tabs)/hoy.tsx` (`handleQuickAdd` y `handleAddTaskSubmit`): quitar `async` y `await`:

```ts
  const handleQuickAdd = () => {
    if (!newTaskText.trim() || !user) return;

    addTask({
      userId: user.uid,
      title: newTaskText,
      category: "Personal",
      dateStart: todayStr,
    });
    setNewTaskText("");
  };
```
```ts
  const handleAddTaskSubmit = (data: AddTaskData) => {
    if (!user) return;

    addTask({
      userId: user.uid,
      title: data.title,
      category: data.category,
      time: data.time,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      repeatDays: data.repeatDays,
    });
    setNewTaskText("");
  };
```
`src/app/(tabs)/notas.tsx`:

```ts
  const handleDelete = () => {
    setConfirmDelete(false);
    deleteNotes(selectedIds);
    setSelectedIds([]);
  };

  const handlePin = () => {
    setPinned(selectedIds, !allSelectedPinned);
    setSelectedIds([]);
  };
```
`src/app/nota.tsx` (`handleDelete`):

```ts
  const handleDelete = () => {
    setConfirmDelete(false);
    deleted.current = true;
    const id = noteIdRef.current;
    if (id && lastSaved.current !== "") deleteNotes([id]);
    router.back();
  };
```

- [ ] **Step 5: Verificar tipos y que no quede `firebase/` en el código**

Run: `npx tsc --noEmit`
Expected: sin errores.
Run: `grep -rn "from ['\"]firebase" src`
Expected: sin resultados.
Run: `grep -rn "await \(addTask\|saveNote\|setPinned\|deleteNotes\|setCompleted\|deleteTask\|updateTaskEnd\)" src`
Expected: sin resultados.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "Migrar datos a Firestore nativo y no bloquear la UI esperando al servidor

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Aviso de "Sin conexión"

Sin esto el usuario no sabe por qué un cambio "tarda" en verse en otro dispositivo. Se usa la metadata del snapshot (`fromCache`), sin agregar NetInfo.

**Files:**
- Create: `src/components/OfflineBanner.tsx`
- Modify: `src/hooks/use-tasks.ts`
- Modify: `src/app/(tabs)/hoy.tsx`, `tablero.tsx`, `calendario.tsx` (junto a cada `ErrorBanner`)

**Interfaces:**
- Produces: `useTasks(...)` incluye `fromCache: boolean`; `<OfflineBanner fromCache={boolean} />`.

- [ ] **Step 1: `use-tasks.ts` — exponer `fromCache`**

Agregar estado `const [fromCache, setFromCache] = useState(false);`, suscribir con metadata y devolverlo:

```ts
      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          const tasksData: Task[] = [];
          snapshot.forEach((doc) => {
            tasksData.push({ id: doc.id, ...doc.data() } as Task);
          });
          setTasks(tasksData);
          setFromCache(snapshot.metadata.fromCache);
          setLoading(false);
          setSyncing(false);
        },
        (err) => { /* sin cambios */ },
      );
```
y en el `return {…}` agregar `fromCache,`.

Nota: con `includeMetadataChanges` el callback también se dispara cuando solo cambia la metadata (p. ej. al confirmarse una escritura); `setTasks` recibe un arreglo equivalente, lo que provoca un render extra inofensivo. `use-task-notifications` depende de `tasks` por identidad, así que **se re-sincronizan las notificaciones** una vez más tras cada confirmación del servidor; es barato (ventana de 14 días) y aceptable.

- [ ] **Step 2: Crear `src/components/OfflineBanner.tsx`**

```tsx
import { useTheme } from "@/contexts/theme-context";
import { faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

const DELAY_MS = 2500;

// Aviso discreto cuando los datos vienen de la caché local (sin conexión con el
// servidor). Se espera DELAY_MS para no parpadear en el arranque normal, donde el
// primer snapshot también llega "desde caché" unos instantes.
export function OfflineBanner({ fromCache }: { fromCache: boolean }) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!fromCache) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [fromCache]);

  if (!show) return null;

  return (
    <View className="mx-5 mt-3 flex-row items-center rounded-lg border border-gray-700 bg-slate-800 px-3 py-2.5">
      <FontAwesomeIcon icon={faCloudArrowDown} size={14} color={colors.gray500} />
      <Text
        className="flex-1 mx-3 text-xs text-gray-300"
        style={{ fontFamily: "MomoTrustSans-Medium" }}
      >
        Sin conexión. Tus cambios se guardan en el teléfono y se sincronizarán al reconectar.
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Mostrarlo en Hoy, Tablero y Calendario**

En cada pantalla, desestructurar `fromCache` de `useTasks(...)` y agregar justo antes del `<ErrorBanner …/>`:

```tsx
      <OfflineBanner fromCache={fromCache} />
```
con `import { OfflineBanner } from "@/components/OfflineBanner";`. En `hoy.tsx` la llamada es `useTasks(user?.uid)` (líneas ~34-42); en `tablero.tsx` y `calendario.tsx` buscar `useTasks(` con `grep -n "useTasks(" src/app/\(tabs\)/*.tsx`.

(La pestaña Notas usa `useNotes`, que no expone metadata; queda sin aviso — YAGNI. Si se quiere, replicar el mismo patrón en `use-notes.ts`.)

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "Mostrar aviso cuando los datos vienen de la caché sin conexión

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Build nuevo y verificación online

**Files:** ninguno (verificación).

- [ ] **Step 1: Compilar el APK de desarrollo e instalarlo**

```bash
npx eas-cli build --profile development --platform android
```
Instalar el APK. Luego `npx expo start -c`.

- [ ] **Step 2: Confirmar el formato de los códigos de error (supuesto del plan)**

Con la app conectada, provocar un error de Auth (contraseña incorrecta) y uno de Firestore si es posible; revisar con `console.warn(err.code)` temporal en `login.tsx` y `describeFirestoreError`. Expected: `auth/…` y `firestore/…`. Si el prefijo de Firestore fuera otro, ajustar el `replace` de la Task 2. Quitar el `console.warn` temporal antes del commit.

- [ ] **Step 3: Pasada funcional online (checklist)**

Marcar cada punto:
- [ ] Login con correo y contraseña; con contraseña mala muestra el mensaje en español de siempre.
- [ ] Login y registro con Google (primera vez crea `users/{uid}`).
- [ ] Recuperar contraseña envía el correo.
- [ ] Cuenta: cambiar nombre, cambiar contraseña, eliminar cuenta (usar una cuenta de prueba).
- [ ] Hoy: quick-add con Enter, "+" con modal, marcar/desmarcar.
- [ ] Tablero y Calendario: ver tareas, marcar, acciones (finalizar, cerrar día, eliminar).
- [ ] Notas: crear, editar (autoguardado), fijar, color, eliminar, selección múltiple.
- [ ] Notificaciones de prueba y reprogramación al crear una tarea con hora.
- [ ] Reglas de Firestore sin cambios y funcionando (incluida `notes`, **publicarlas si aún no**).

- [ ] **Step 4: Commit de cualquier ajuste surgido**

```bash
git add -A && git commit -m "Ajustes tras verificación online

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
(omitir si no hubo cambios)

---

### Task 7: Verificación offline en el teléfono (matriz)

**Files:** ninguno (verificación). Usar modo avión (apagar también Wi-Fi). Hacer cada prueba con el APK ya sincronizado una vez online.

- [ ] **Step 1: Offline con la app abierta**

Modo avión ON. Expected:
- [ ] Crear una tarea (quick-add y modal): aparece de inmediato y el input se limpia.
- [ ] Marcar/desmarcar una tarea: cambia al instante.
- [ ] Crear, editar, fijar y borrar notas: funciona; al borrar desde el editor regresa a la lista sin quedarse colgado.
- [ ] Calendario: finalizar/cerrar día/eliminar tarea futura funciona sin colgarse.
- [ ] Tras ~3 s aparece el aviso "Sin conexión…" en Hoy/Tablero/Calendario.

- [ ] **Step 2: Cerrar y reabrir la app sin internet (el caso que hoy falla)**

Con modo avión aún ON: cerrar la app desde multitarea y abrirla.
- [ ] Sigue con la sesión iniciada.
- [ ] Las tareas, logs y notas **creados offline y los de antes** siguen ahí.
- [ ] Las notificaciones programadas **no desaparecieron** (probar con una tarea con hora en pocos minutos; también `sendTestNotification`).

- [ ] **Step 3: Reconectar**

Modo avión OFF.
- [ ] El aviso desaparece.
- [ ] En Firebase Console aparecen las tareas/notas/logs creados offline (`tasks`, `users/{uid}/notes`, `users/{uid}/taskLogs`).
- [ ] Cerrar sesión e iniciar de nuevo en **otro** dispositivo o reinstalar muestra esos datos.

- [ ] **Step 4: Casos límite a anotar (no necesariamente bloqueantes)**

- [ ] Instalación nueva + primer arranque **sin** internet: sin sesión no hay datos (esperado; el login requiere red).
- [ ] Editar la misma nota en dos dispositivos offline: gana la última escritura que llegue al servidor (comportamiento esperado de Firestore; aceptado por ser app de dos personas).
- [ ] Una escritura rechazada por reglas estando offline (p. ej. reglas sin publicar) falla **al reconectar**, no al escribir: debe aparecer el `ErrorBanner` con el mensaje de permisos.

- [ ] **Step 5: Si algo falla**

Registrar el caso, el comportamiento observado y los logs de Metro; corregir en una task nueva antes de documentar.

---

### Task 8: Documentación

**Files:**
- Modify: `.claude/CLAUDE.md`, `SETUP.md`, `G:\daily\MOBILE_APP.md`, `G:\daily\README.md` (solo si cambió algún comportamiento visible: aviso de sin conexión)

- [ ] **Step 1: `.claude/CLAUDE.md`**

- Stack: reemplazar `Firebase: 12.18.0 (@firebase/auth 1.13.5, @firebase/firestore)` por `React Native Firebase 26.4.x (app, auth, firestore; SDK nativo)` y quitar `AsyncStorage … (para persistencia de auth)` → solo "preferencias locales".
- Sección 3 ("Firebase Auth con Persistencia Real"): reescribir: la sesión y la caché de Firestore ya no pasan por `initializeAuth`/`getReactNativePersistence`; las gestiona el SDK nativo. Mantener el "No hacer".
- Sección 14: ya **sí** se usa `google-services.json` (en la raíz, referenciado en `app.json`); el flujo `idToken → signInWithCredential` es el mismo pero con `@react-native-firebase/auth`.
- Nueva subsección (17): **Modo offline** — Firestore nativo con caché en disco; las escrituras NO se esperan con `await` (la promesa solo se resuelve al confirmar el servidor); `deleteTask` lee los logs de caché; `OfflineBanner`/`fromCache`; códigos `firestore/…` normalizados; sesión nueva obligatoria tras la migración.
- Tabla "Problemas Resueltos": filas para (a) caché solo en memoria del SDK web en RN, (b) `await` de escrituras colgado sin internet, (c) RN Firebase 27 exige Kotlin ≥ 2.4 y RN 0.86 trae 2.1.20 → usar 26.4.x.
- Estructura de carpetas: agregar `OfflineBanner.tsx`; "Próximos Pasos" y "Última Sesión" actualizados.

- [ ] **Step 2: `SETUP.md` y `MOBILE_APP.md`**

`SETUP.md`: sección de configuración de Firebase → explicar `google-services.json`; quitar el bloque `firebaseConfig` del SDK web. `MOBILE_APP.md` ("Persistence & real functionality"): reemplazar la nota de "offline-first local DB (Firestore's own cache is used)" por el comportamiento real y la limitación del primer arranque.

- [ ] **Step 3: Commit y cierre de la rama**

```bash
git add -A
git commit -m "Documentar modo offline con React Native Firebase

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Luego usar `superpowers:finishing-a-development-branch` para integrar a `main`.

---

## Self-Review

- **Cobertura:** causa raíz (caché memoria) → Tasks 1-2; sesión nativa → 3; `await` colgados (4 sitios del hallazgo 3) → Task 4 steps 1-4; códigos de error → Task 2 + verificación Task 6; Kotlin → Task 1 con salida de emergencia; notificaciones con lista vacía → Task 7 step 2; avisos de UI → Task 5; docs → Task 8. Sin huecos conocidos.
- **Placeholders:** el único valor abierto es `<VERSION_SOPORTADA_POR_EXPO_57_Y_RNFB_26>` en Task 1 step 6, que **no se puede conocer sin el build** y está condicionado al fallo; el paso indica dónde confirmarlo.
- **Consistencia de tipos:** `saveNote/setPinned/deleteNotes/setCompleted/deleteTask/updateTaskEnd/addTask` pasan todas a `void` (Task 4) y todos sus llamadores se actualizan (hoy, notas, nota; `calendario.tsx` y `tablero.tsx` ya las llaman sin `await`, comprobado con grep). `fromCache` se define en Task 5 step 1 y se consume en steps 2-3.
- **Supuestos no verificados (marcados para verificar en el dispositivo):** prefijo `firestore/` en los códigos; nombres exactos exportados por `@react-native-firebase/auth` (`useDeviceLanguage`, `type User`); que `getDocsFromCache` exista en la línea 26 con ese nombre; compilación con Kotlin 2.1.20.
