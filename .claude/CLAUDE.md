# Daily! App — Guía de Desarrollo & Lecciones Aprendidas

## 📱 Descripción General
**Daily!** es una aplicación móvil de tareas personales construida con React Native 0.86.3, Expo 57.0.21, Firebase (Auth + Firestore), TypeScript, y Expo Router. Incluye autenticación real, gestión de tareas en tiempo real, y navegación robusta por pestañas.

---

## 🛠️ Stack & Versiones (Actualizado)

```
React Native: 0.86.3
Expo: ~57.0.31 (expo install subió los parches del SDK 57; expo-router ~57.0.29)
Firebase: 12.18.0 (@firebase/auth 1.13.5, @firebase/firestore)
Expo Router: Latest (file-based routing)
NativeWind: Latest (Tailwind CSS para React Native)
TypeScript: Latest
FontAwesome: @fortawesome/react-native-fontawesome + @fortawesome/free-solid-svg-icons + @fortawesome/free-brands-svg-icons
AsyncStorage: @react-native-async-storage/async-storage 2.2.0 (para persistencia de auth)
SafeAreaContext: react-native-safe-area-context (NO usar SafeAreaView de react-native)
StatusBar: expo-status-bar (para manejo transparente de barra de estado)
WheelPicker: @quidone/react-native-wheel-picker (incluye código nativo opcional en el paquete, pero funciona sin rebuild nativo vía Expo Go — usado para date/time pickers tipo rueda)
Notificaciones: expo-notifications ~57.0.24 (locales; NO funciona en Expo Go de Android, ver sección 11)
Dev build: expo-dev-client ~57.0.20 + EAS Build (eas.json con perfiles development/preview/production)
Google Sign-In: @react-native-google-signin/google-signin ^16 (nativo, solo en dev build; idToken → Firebase signInWithCredential)
```

**Entorno de ejecución: development build, ya NO Expo Go.** Desde que se agregó `expo-notifications` la app se corre con un APK de desarrollo (compilado con EAS, ver "Comandos Útiles"), no con Expo Go. Se sigue usando `npx expo start` y Fast Refresh igual; solo hay que recompilar el APK cuando cambian dependencias nativas, plugins o permisos de `app.json`, o la versión de Expo/RN. Mucha documentación de abajo menciona "Expo Go" por haberse escrito antes; el comportamiento de JS descrito sigue vigente.

**NO instalados (probados y revertidos):** `@gorhom/bottom-sheet`, `@react-native-community/datetimepicker`. Ver sección "Problemas Resueltos" abajo antes de volver a intentarlos.

**Regla crítica:** Leer docs exactas a la versión de Expo en https://docs.expo.dev/versions/v57.0.0/

---

## 📐 Arquitectura & Patrones

### 1. **SafeArea & Status Bar (CRÍTICO)**
**Problema:** Contenido se superponía con hora/batería en Android.

**Solución:**
- Usar `SafeAreaView` SIEMPRE desde `react-native-safe-area-context`, NO de `react-native`
- Envolver app entera con `<SafeAreaProvider>` en `_layout.tsx`
- Usar `edges={['top','left','right']}` (o 4 lados según pantalla)
- Incluir `<StatusBar style="light" translucent backgroundColor="transparent" />` de `expo-status-bar` en root layout

```tsx
// CORRECTO:
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView className="flex-1 bg-slate-950" edges={['top','left','right']}>
  {/* contenido */}
</SafeAreaView>
```

### 2. **Historial de Navegación & Back Button**
**Problema:** Botón físico de atrás no recordaba el historial real (solo navegaba entre 4 tabs máximo).

**Solución:**
- `NavigationHistoryProvider`: pila cronológica completa (no unique-tabs), con límite MAX_HISTORY_LENGTH=50
- `useBackHandler(screenName)`: usa `useFocusEffect` de expo-router (no `useEffect`), registra visita al tab activo
- Retorna `{exitModalVisible, confirmExit, cancelExit}` para modal personalizado
- Agregar `useBackHandler('tabName')` a TODOS los tab screens

```tsx
// Cada tab screen:
const { exitModalVisible, confirmExit, cancelExit } = useBackHandler('hoy');

// Renderizar modal:
<ConfirmModal
  visible={exitModalVisible}
  title="¿Seguro que quieres salir?"
  onConfirm={confirmExit}
  onCancel={cancelExit}
/>
```

### 3. **Firebase Auth con Persistencia Real**
**Problema:** Auth no persistía entre reinicios de app.

**Solución:**
```tsx
// src/lib/firebase.ts
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
```

**NO hacer:** Intentar silenciar warnings con `console.warn` interceptor (Firebase resolverá el warning solo con AsyncStorage instalado).

### 4. **Global Loading Overlay**
**Problema:** LoadingScreen quedaba invisible pero bloqueaba touches (opacity._value nunca llegaba a 0 exacto).

**Solución crítica:**
```tsx
if (!visible) return null; // SIEMPRE retornar null cuando no es visible
```

Esta línea es OBLIGATORIA al inicio del render para remover el componente completamente del árbol de React.

### 5. **Navegación de Auth**
- Login/Logout disparan cambios en el user del context
- `useEffect` independientes en `login.tsx` e `index.tsx` escuchan cambios de user y redirigen
- `showLoading()` antes de login, se auto-oculta cuando entra el usuario o falla
- NO usar `router.replace()` (causa flash blanco); usar `router.navigate()`

### 6. **Add Task Modal (CRÍTICO — no usar librerías de bottom-sheet, no usar `<Modal>` nativo)**
**Problema 1:** Se intentó usar `@gorhom/bottom-sheet` (con `GestureHandlerRootView` + `BottomSheetModalProvider` en `_layout.tsx` raíz) para el modal de "Nueva tarea". Dos fallas:
1. Conflicto de peer-deps: `react-native-reanimated@4.5.1` (el que realmente queda instalado) pide `react-native-worklets@0.10.x`, pero `@gorhom/bottom-sheet` + npm intentaban resolver `reanimated` a `4.6.0`, que pide `worklets@0.12.x` — y `expo-modules-core` (parte del propio SDK 57) exige `worklets@0.10.x`. No hay combinación que satisfaga a los tres a la vez sin `--legacy-peer-deps`.
2. Aun instalando con `--legacy-peer-deps`, el `BottomSheetModal` no se hacía visible en Android (probado en Samsung A15) — ni con `enableDynamicSizing={false}` ni ajustando snapPoints.

**Solución 1:** Modal nativo de React Native (`<Modal transparent animationType="none">`) + `Animated.Value` propio para el slide-up/fade, mismo patrón que `ConfirmModal.tsx`. Backdrop y sheet como **hermanos** (no padre/hijo).

**Problema 2 (encontrado después, CRÍTICO):** El `<Modal>` nativo de React Native tardaba **~2 segundos en abrir** en Android (probado en Samsung A15). Causa: cada vez que `visible` pasa a `true`, `<Modal>` crea una ventana/Dialog nativa nueva (round-trip al hilo nativo) — ese costo de creación de ventana es independiente de qué tan liviano sea el contenido JS.

**Solución 2 (estado actual):** Se reemplazó `<Modal>` por una `View` absoluta (`position: absolute` cubriendo toda la pantalla, `zIndex`/`elevation` para quedar encima), controlada 100% en JS. Un estado `mounted` renderiza el overlay solo mientras está visible o animando su cierre (`Animated.parallel(...).start(() => setMounted(false))` al cerrar). Como ya no hay `onRequestClose` nativo, se agregó un `BackHandler.addEventListener('hardwareBackPress', ...)` manual (solo activo mientras `visible`) para seguir cerrando con el botón físico atrás.

**No repetir (gestos):** No envolver el contenido scrolleable del sheet (ni sus wheel pickers) dentro de un `TouchableWithoutFeedback` — la negociación de gesto de "tap" de ese componente compite con el gesto de scroll/drag de listas internas (`ScrollView`, wheel pickers) y las deja "pegadas" sin responder al arrastre. Backdrop y sheet deben seguir siendo hermanos, cada uno con su propio `Touchable`/ausencia de él.

**No repetir (`<Modal>` nativo):** No volver a usar `<Modal>` de `react-native` para este sheet — aunque sea más simple, el costo de apertura en Android lo hace inviable para una interacción tan frecuente como "agregar tarea".

**Wheel pickers (fecha/hora) — 3 bugs adicionales encontrados y resueltos, todos en `AddTaskModal.tsx`:**
Se usa `@quidone/react-native-wheel-picker` (`DatePicker` para fecha, `WheelPicker` para hora/minuto). El paquete incluye carpetas nativas (`android/ios/cpp`) pero funciona sin rebuild nativo en Expo Go. Props clave para tamaño: `itemHeight` (alto de cada fila, default 48) y `visibleItemCount` (filas visibles, default 5) — en este proyecto se usan `PICKER_ITEM_HEIGHT = 34` y `PICKER_VISIBLE_ITEMS = 3`.

1. **Montaje anticipado = picker en gris sin datos.** Montar `DatePicker`/`WheelPicker` apenas abre el modal (antes de que el usuario toque el campo), dentro de un contenedor `display: "none"` (porque el campo aún no está activo), hace que el componente mida su layout con tamaño cero y nunca lo vuelve a recalcular cuando luego se muestra — queda congelado en gris sin texto. **Solución:** montar cada picker perezosamente, exactamente la primera vez que el usuario abre ese campo (`dateEverOpened` / `timeEverOpened`, seteados dentro de `openDatePicker`/`toggleTimePicker`), en el mismo render en que el contenedor pasa a `display: "flex"`. Una vez montado, queda montado (no se desmonta en cada toggle posterior, solo se oculta/muestra con `display`), para no reintroducir el problema de remount-por-toggle (ver punto 2).
2. **Remontar en cada toggle = lento.** Si en cambio se usa render condicional (`{activo && <DatePicker/>}`) que desmonta/remonta el picker cada vez que el usuario cierra y reabre el campo, cada montaje repite el trabajo costoso del punto 3 (Intl). **Solución:** una vez `dateEverOpened`/`timeEverOpened` es `true`, no vuelve a `false` hasta `resetForm()` — el componente persiste montado y solo cambia de visible a oculto vía `style={{ display }}`.
3. **`Intl.DateTimeFormat('es-MX', ...)` lento en Hermes.** La librería construye ~12 instancias de `Intl.DateTimeFormat` (nombres de mes) cada vez que `DatePicker` monta por primera vez en la sesión. La primera construcción de un formatter con un locale no-inglés es muy lenta en Hermes (carga de datos ICU bajo demanda) — varios segundos. **Mitigación:** se agregó un `useEffect` en `AddTaskModal` que, 400ms después de montar el modal (antes de que el usuario toque nada), precalienta ese mismo `Intl.DateTimeFormat('es-MX', ...)` en segundo plano, para que el costo ya esté pagado cuando el usuario sí abre el picker. No elimina el costo, solo lo mueve fuera del camino crítico.
4. **Corrimiento de un día al cambiar mes/año (bug de zona horaria).** La librería hace `new Date(date)` internamente (`DatePickerValueProvider.tsx`) sobre el string `"YYYY-MM-DD"` que le pasamos. JS parsea un string de fecha-sola ISO como **medianoche UTC**; al convertir a hora local en una zona horaria negativa (México, UTC-6) el día se recorre uno hacia atrás, y la librería lo compara mal al recalcular tras mover el wheel de mes/año. **Solución:** se le pasa `` `${dateStr}T00:00:00` `` (con hora, sin offset) en vez del string pelado — una fecha-hora sin zona horaria SÍ se interpreta como hora local por el estándar ECMA-262, a diferencia de una fecha sola. **No repetir:** NO usar el truco de reemplazar `-` por `/` (`"YYYY/MM/DD"`) para forzar hora local — es un formato no estándar que Hermes parsea como `Invalid Date` (a diferencia de V8/Node, donde sí funciona), y ese `NaN` termina usándose para construir un array interno de la librería, causando `RangeError: invalid array length`. El sufijo `T00:00:00` es la única forma probada que funciona en Hermes.

**Botón "+" en Hoy:** ya no hace quick-add directo cuando el input tiene texto — siempre abre este modal (con el título precargado desde el input de quick-add). El quick-add directo sigue existiendo, pero solo vía Enter (`onSubmitEditing`) en el input de `hoy.tsx`.

**Scroll del contenido:** el modal completo puede exceder la pantalla al abrir un wheel picker. Se envuelve el bloque de campos (Título → Días) en un `ScrollView` normal (sin librería), dejando el handle+título fijos arriba y los botones Cancelar/Guardar fijos abajo (fuera del `ScrollView`). El `ScrollView` interno de los wheel pickers de `@quidone` convive bien anidado dentro de este `ScrollView` exterior (ambos son `ScrollView` nativos estándar, no hay competencia de `Touchable` de por medio).

### 7. **Teclado tapa el input de "Agregar tarea" en Android (Expo Go)**
**Problema:** En `hoy.tsx`, al enfocar el `TextInput` de "Agrega una nueva tarea...", el teclado tapaba el input y el botón `+`, sin reajustar el layout.

**Por qué `KeyboardAvoidingView` no sirvió:** `KeyboardAvoidingView` depende de que Android redimensione la ventana nativa (`windowSoftInputMode` del manifiesto). Ese ajuste es configuración nativa — en Expo Go corres dentro del host de Expo, así que el manifiesto de la app nunca se aplica, y `KeyboardAvoidingView` queda sin efecto.

**Solución:** listener manual de teclado en `hoy.tsx` — `Keyboard.addListener('keyboardDidShow'/'keyboardDidHide', ...)` guarda la altura del teclado en estado (`keyboardHeight`), aplicada como `style={{ marginBottom: keyboardHeight }}` en la barra de input. Esto es JS puro, no depende de configuración nativa, y funciona igual en Expo Go que en un build nativo.

**No repetir:** No asumir que `KeyboardAvoidingView` funcionará solo porque es la API "oficial" de RN para esto — en Expo Go, cualquier solución que dependa de `windowSoftInputMode`/manifiesto nativo no tiene efecto.

### 8. **Ocurrencias de tareas y logs de cumplimiento (Hoy / Tablero)**
**Problema:** un solo `done` en la tarea no sirve para tareas que se repiten (se queda marcada de una semana a otra).

**Solución:**
- `Task` ya **no** tiene `done`/`completedAt`. Cada realización es un log en Firestore `users/{uid}/taskLogs/{taskId}_{YYYY-MM-DD}` (id determinista = un doc por tarea y día) con `{taskId, date, completed, completedAt, updatedAt}`. Marcar escribe `completed: true`; desmarcar, `completed: false`. Se consulta solo por rango de `date` (un campo → sin índice compuesto; por eso es subcolección bajo `users/{uid}` y no colección raíz con `userId`).
- **Cuándo cae una tarea en un día** (`isTaskForDate` en `src/lib/task-schedule.ts`): con `repeatDays` → días dentro de `dateStart..dateEnd` cuyo weekday (0=Lun..6=Dom) esté en `repeatDays`; sin `repeatDays` → solo `dateStart` (tarea individual; el quick-add de Hoy usa `dateStart` = hoy). Tareas viejas sin `dateStart` usan el día de `createdAt` si ya es conocido.
- **Estado de una ocurrencia** (`getOccurrenceStatus`): `completed` (log con `completed: true`), `pending` (hoy/futuro sin log), `missed` (día pasado sin log). **"No completada" se calcula, no se guarda** — no hay procesos ni Cloud Functions que escriban días perdidos.
- **Días pasados son de solo lectura**: hoy y días futuros sí se pueden marcar/desmarcar.
- Add Task Modal: abre con una sola fecha (tarea de un día: guarda solo `dateStart`, sin `dateEnd` ni `repeatDays`). El checkbox "¿Tarea recurrente?" muestra el campo Fin (mismo wheel, vigencia por defecto hoy → +1 año) y los "Días que se realizará" (día de hoy preseleccionado; mientras haya exactamente 1 día marcado, ese día sigue al weekday de la fecha de inicio al mover su wheel; con 2 o más ya no se toca); "Guardar" se deshabilita solo si es recurrente y no hay días; hora de notificación por defecto 08:00 solo si se marca "¿Quieres notificación?".
- Botón de sincronizar (Tablero): `refresh()` de `use-tasks` y `use-task-logs` re-suscribe los `onSnapshot` (Firestore ya es en tiempo real; el botón solo fuerza re-lectura).

**No repetir:** no volver a poner `done` en `Task`; no escribir logs de "no completada" para días pasados (se derivan); no cambiar los días/vigencia de una tarea sin considerar que el historial pasado se recalcula (el estado `missed` depende del calendario actual de la tarea).

### 9. **Calendario (Semana / Mes / Año)**
**Estructura:** `calendario.tsx` orquesta; los componentes viven en `src/components/calendar/` (`CalendarModeSwitch`, `WeekStrip`, `MonthGrid`, `YearGrid`, `DayCell`, `DayTaskList`). Reusa `isTaskForDate`, `useTasks`, `useTaskLogs`, `TaskRow` y `TaskDetailsModal` (sección 8). Los nombres de meses/días están en `src/constants/dates.ts` (Tablero y Hoy aún tienen su propia copia).
- **Estado:** `mode`, `anchor` (fecha que define el periodo visible) y `selectedDay`. **Siempre abre en Semana con hoy seleccionado.** Botón "Hoy" aparece al alejarse.
- **Navegación:** flechas ±1 semana/mes/año. En Mes, deslizar a los lados cambia de mes (`PanResponder` de RN, sin librerías; solo toma el gesto si es claramente horizontal). Tocar el nombre del mes abre Año; tocar una tarjeta de Año abre ese Mes. Tocar un día de un mes vecino lo selecciona y navega a ese mes.
- **Qué día queda seleccionado al navegar** (`pickDayInMonth`): flechas en Semana mueven `anchor` y `selectedDay` ±7 días; en Mes pasan al mismo día del mes destino (ajustado a su último día, p. ej. 31 → 30) o a hoy si el destino es el mes actual; en Año solo cambia el año, no `selectedDay`. Al cambiar de modo a Semana/Mes, `anchor` pasa a ser `selectedDay`. Tocar una tarjeta de Año selecciona hoy (si es el mes actual) o el día 1.
- **Mes:** `getMonthGrid` devuelve solo las semanas necesarias (4–6 filas, lunes primero) con días vecinos atenuados — **no** una cuadrícula fija de 6 filas (se recortó para no mostrar semanas de más del mes siguiente). La altura cambia entre meses. **Scroll vertical:** en Mes, cuadrícula + lista del día van dentro de un solo `ScrollView` (`DayTaskList` con `scrollable={false}`); un mes de 6 filas ocupa casi toda la pantalla y la lista quedaba sin espacio. Header, selector y flechas quedan fijos. En Semana la lista conserva su propio `ScrollView`.
- **Indicadores por día** (`DayCell`): pasado y hoy → punto rojo + nº sin completar y punto verde + nº completadas; futuro → un punto azul + nº de tareas. No se dibuja un punto con conteo 0. Colores suaves (`#e58b8b`, `#7fcf9f`, `#7ba7ee`).
- **Selección:** el día seleccionado pinta de morado todo el contenedor de la fecha (número y conteos dentro); hoy no seleccionado se marca con el número en morado. Las celdas no llevan borde.
- **Logs:** Semana/Mes se suscriben al rango visible (primer→último día mostrado); Año solo cuenta tareas (`countTasksInMonth`) y no necesita logs.
- **Lista del día:** mismas reglas que Tablero (pasado solo lectura; hoy y futuro editables).
- **Acciones en el detalle (solo Calendario, Semana y Mes):** `TaskDetailsModal` recibe `actions` opcionales (Hoy y Tablero no las pasan). Se arman en `buildActions` de `calendario.tsx`; días pasados no tienen acciones. **Hoy:** "Finalizar hoy" (solo tareas con `repeatDays`; pone `dateEnd` = hoy) y "Marcar/Quitar como completada". **Futuro:** "Cerrar este día" (solo pone `dateEnd` = ese día, inclusivo; **no** escribe log ni marca el día como completado), "Eliminar tarea" (si `dateStart` > hoy o no existe, borra la tarea y sus logs; si ya empezó, pone `dateEnd` = día anterior para conservar historial) y "Marcar/Quitar como completada". Finalizar/Cerrar/Eliminar y toda acción de día futuro piden confirmación con `ConfirmModal` (prop `icon` opcional); marcar hoy no. `use-tasks` expone `updateTaskEnd` y `deleteTask` (este último borra también `users/{uid}/taskLogs` con `taskId` igual).

**No repetir (estilos):**
- **No usar clases arbitrarias de NativeWind para tamaño de fuente** (`text-[7px]`, `text-[5px]`…): no se aplican y el texto sale al tamaño por defecto. Usar `style={{ fontSize }}` (con `lineHeight`) como en `COUNT_FONT_SIZE` de `DayCell.tsx`. Los valores arbitrarios de espaciado sí funcionaron (`py-[19px]`).
- **No poner `flex-1` en el contenedor interno de una celda de alto automático:** su alto base pasa a 0, queda en el `minHeight` y el contenido (los conteos) se sale del fondo de color. Dejar que el contenedor mida lo que mide su contenido.

### 10. **Apariencia (tema claro/oscuro + color de acento)**
**Qué hay:** pantalla `src/app/apariencia.tsx` (ruta de stack en raíz, se abre desde Perfil → Apariencia): selector Oscuro/Claro, rueda de color (`ColorWheel`, SVG + `PanResponder`, sin librerías nuevas), vista previa y "Restablecer valores". Se guarda **solo en el dispositivo** (AsyncStorage, clave `daily.appearance.v1`, `{mode, accent}`), no en Firestore.

**Cómo funciona (no cambiar clase por clase):**
- `tailwind.config.ts` remapea los colores que ya usaba la app (`slate-950/900/800`, `gray-100…800`, `white`, `purple-400/500`) a variables CSS `--c-*` (`rgb(var(--c-x) / <alpha-value>)`). Las clases existentes cambian solas con el tema. Defaults (oscuro) en `src/global.css`.
- `src/lib/theme.ts` (`buildTheme(mode, accent)`) define las paletas oscura/clara y deriva del acento: `accent` (= `purple-500`), `accentText` (= `purple-400`, más claro en oscuro / más oscuro en claro), `onAccent` (blanco u oscuro según luminancia) y `accentSoft`.
- `src/contexts/theme-context.tsx` (`AppThemeProvider`, `useTheme()`): carga/guarda la preferencia, aplica `vars(theme.vars)` de `nativewind` en un `View` raíz y no pinta nada hasta leer AsyncStorage (evita destello). `_layout.tsx` usa `useTheme` para `StatusBar` y el tema de navegación.
- Para colores que no pasan por clases (iconos, `placeholderTextColor`, `ActivityIndicator`, tab bar, estilos del wheel picker) usar `const { colors } = useTheme()` — **no hardcodear hex**.
- Clases nuevas: `text-onaccent` / `bg-…` para texto **sobre fondo de acento** (botones, día seleccionado, ✓ de checkbox); `text-pure` = blanco fijo para texto sobre colores que no cambian (etiquetas de categoría, toast). `text-white` es el texto principal y en claro es casi negro.

**Valor por defecto:** acento `#a855f7` (el `bg-purple-500` real de Tailwind que ya se veía). Los iconos que antes usaban `#9184d9` ahora usan el acento.

**No repetir:**
- No volver a poner `text-white` sobre un fondo de acento: en claro quedaría oscuro sobre oscuro/claro según el acento; usar `text-onaccent`.
- No agregar hex fijos de fondo/texto en componentes nuevos; usar las clases remapeadas o `useTheme().colors`.
- Cambios en `tailwind.config.ts`/`global.css` requieren reiniciar Metro con caché limpia (`npx expo start -c`).

### 11. **Notificaciones locales (expo-notifications + development build)**
**Problema 1 (CRÍTICO):** en **Expo Go para Android** (desde SDK 53) falta el módulo nativo `ExpoTopicSubscriptionModule`, y `import "expo-notifications"` lanza al evaluarse. Como `auth-context` importaba `lib/notifications`, tumbó **toda** la app (síntoma: `Cannot find native module 'ExpoTopicSubscriptionModule'` y "Route ... is missing the required default export" en todas las rutas). Todas las 57.x traen el mismo archivo; bajar de versión no ayuda. La doc dice que las locales "siguen disponibles", pero el import no sobrevive en Go.

**Solución:** (a) `src/lib/notifications.ts` carga el módulo con `require` dentro de `try/catch` (`let Notifications = null`), así en Expo Go solo sale un `WARN` y las notificaciones quedan apagadas; (b) para probarlas de verdad se usa un **development build** con EAS (APK).

**Cómo funciona:**
- `syncTaskNotifications(tasks)` cancela todo y reprograma **solo los próximos 14 días** (`WINDOW_DAYS`) con triggers tipo `DATE` y `identifier` `{taskId}_{YYYY-MM-DD}`, usando `isTaskForDate` (respeta `repeatDays`, `dateEnd` y tareas de un día). Máximo 60 (`MAX_SCHEDULED`; iOS conserva 64). No se usan triggers semanales porque no respetan `dateEnd`.
- `NotificationSync` (sin UI, montado en `(tabs)/_layout.tsx`) → `useTaskNotifications`: re-sincroniza al cambiar las tareas y al volver la app a primer plano (así la ventana avanza). Abre su propia suscripción `useTasks`.
- Permisos: se piden solo si hay alguna tarea con `time`. En Android primero se crea el canal `tasks` (Android 13+ no muestra el prompt sin canal). Si el permiso quedó denegado (`canAskAgain: false`) sale un `Alert` una vez por sesión con botón "Abrir ajustes".
- `logout` en `auth-context` llama `cancelTaskNotifications()`.
- Plugin en `app.json`: `["expo-notifications", { "color": "#a855f7" }]` (requiere nuevo binario).

**No repetir:** no importar `expo-notifications` con `import` estático en un módulo que cargue la app al arrancar; no asumir que Expo Go sirve para notificaciones en Android; no usar triggers semanales/repetitivos para tareas con vigencia.

### 12. **Errores de Firestore en la UI**
- `src/lib/firestore-error.ts` (`describeFirestoreError`) traduce `permission-denied`, `unavailable`, `unauthenticated` y `failed-precondition` a mensajes en español.
- `use-tasks` y `use-task-logs` usan ese helper en todos sus `catch`/callbacks de `onSnapshot`, y exponen `clearError`; `refresh()` también limpia el error.
- `src/components/ErrorBanner.tsx` (aviso rojo cerrable con X) se muestra bajo el header en Hoy, Tablero y Calendario con `tasksError ?? logsError`.
- Add Task Modal valida Fin ≥ Inicio (`endBeforeStart`): borde rojo en Fin, mensaje y "Guardar" deshabilitado; `handleSave` también lo verifica.
- Reglas de Firestore: `FIRESTORE_RULES.md`. **`users/{uid}` no cubre sus subcolecciones**, por eso `users/{uid}/taskLogs` lleva su propio `match`; `tasks` tiene `update` que impide cambiar `userId`.

### 13. **Sub-pantallas de Perfil**
Rutas de stack en raíz (`src/app/notificaciones.tsx`, `cuenta.tsx`, `privacidad.tsx`, `ayuda.tsx`, junto a `apariencia.tsx`), registradas en `_layout.tsx` y abiertas desde `MENU_ITEMS` de `perfil.tsx` (`route: Href`). Comparten `ScreenHeader` (flecha + título).
- **Notificaciones:** `NotificationSettingsProvider` (`contexts/notification-settings-context.tsx`, AsyncStorage `daily.notifications.v1`, `{enabled, defaultTime}`) montado dentro de `AuthProvider`. `enabled=false` → `useTaskNotifications` cancela todo. `defaultTime` reemplaza el `08:00` fijo de `AddTaskModal`. La pantalla muestra el permiso del sistema (`getNotificationPermission`/`requestNotificationPermission`, "Abrir ajustes" si está bloqueado) y `sendTestNotification` (5 s). El wheel de hora se monta solo al abrirse (render condicional, nunca dentro de `display:none`).
- **Cuenta:** `auth-context` expone `updateDisplayName` (`updateProfile` + `users/{uid}.name`), `changePassword` (reautentica con la contraseña actual) y `hasPassword` (provider `password`). `updateProfile` muta el mismo `user`, por eso un contador interno fuerza el re-render. Cuentas de Google no ven el formulario de contraseña. `register` ahora también guarda `displayName`.
- **Privacidad y Ayuda:** informativas (FAQ en acordeón, versión de `expo-constants`).
- **Olvidé mi contraseña** (`auth/forgot-password.tsx`): ahora **un solo paso** (correo → `sendPasswordResetEmail`, pantalla de éxito, reenvío con espera de 30 s). Firebase no ofrece flujo de código de 6 dígitos desde el cliente; no volver a ese diseño.

### 14. **Google OAuth (development build)**
- `src/lib/google-auth.ts`: `signInWithGoogle()` (configura con `webClientId`, `hasPlayServices`, `signIn`, `GoogleAuthProvider.credential(idToken)`, `signInWithCredential`); devuelve `"success" | "cancelled"`. Carga la librería con `require` en `try/catch` (no existe en Expo Go). `auth-context.loginWithGoogle` crea `users/{uid}` solo si no existe; `logout` también cierra la sesión de Google.
- El **Web client ID** vive en `app.json → expo.extra.googleWebClientId` (no en `.env`: EAS no sube archivos ignorados por git). No es secreto.
- Configuración externa que ya está hecha: Google habilitado en Firebase Auth; app Android `com.daily.app` registrada en Firebase con el **SHA-1 del keystore de EAS** (`npx eas-cli credentials`, las credenciales por defecto se comparten entre perfiles). No se usa `google-services.json`.
- **Pendiente al publicar en Play Store:** agregar también el SHA-1 de la firma de Google Play (App Signing), si no, Google Sign-In falla en la versión publicada.
- Solo el login tiene botón de Google; entrar con Google ya crea la cuenta.

### 15. **Ícono de la app**
Fuente: SVG del usuario (calendario morado `#8B5CF6` sobre negro, insignia verde con palomita). Se generaron con `sharp` (instalado en una carpeta temporal, no en el proyecto): `icon.png` 1024 sin esquinas redondeadas, `android-icon-foreground.png` (transparente, dentro de la zona segura), `android-icon-background.png` (negro), `android-icon-monochrome.png` (recortes en los días), `favicon.png` y `splash-icon.png`. `app.json`: `adaptiveIcon.backgroundColor` `#000000` + `monochromeImage`. El ícono de iOS (`assets/expo.icon`) sigue siendo el de la plantilla. Cambiar el ícono requiere nuevo APK.

---

## 🎨 Estilos & Tipografía (HOMOLOGACIÓN REQUERIDA)

### Fuentes (Momo Trust Sans)
**Archivos:** `assets/fonts/MomoTrustSans-{Regular,Medium,SemiBold,Bold}.ttf`

**Carga en _layout.tsx:**
```tsx
await Font.loadAsync({
  'MomoTrustSans-Regular': require('../../assets/fonts/MomoTrustSans-Regular.ttf'),
  'MomoTrustSans-Medium': require('../../assets/fonts/MomoTrustSans-Medium.ttf'),
  'MomoTrustSans-SemiBold': require('../../assets/fonts/MomoTrustSans-SemiBold.ttf'),
  'MomoTrustSans-Bold': require('../../assets/fonts/MomoTrustSans-Bold.ttf'),
});
```

**Uso:**
```tsx
<Text style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>Título</Text>
```

### Colores & NativeWind
- **Usar:** clases Tailwind de NativeWind (bg-slate-950, text-gray-300, border-gray-700, etc.)
- **Acento:** #9184d9 (purple-500 en Tailwind)
- **Fondo principal:** #161826 (slate-950)
- **Colores de tema:** los nombres estándar de Tailwind que usa la app están remapeados a variables del tema (ver sección 10); los valores de abajo son los del tema oscuro por defecto. Fondo real de pantallas = `slate-950` de Tailwind (`#020617`); `#161826` solo es la tab bar.

**Paleta:**
```
Fondo: bg-slate-950 (#161826)
Input/Cards: bg-slate-800
Bordes: border-gray-700
Texto principal: text-white
Texto secundario: text-gray-300 / text-gray-400
Acento: text-purple-400 / bg-purple-500
Error: text-red-500
```

### Tipografía + Estilos por Componente

| Componente | Tailwind + Momo |
|---|---|
| Títulos h1 | `text-3xl text-white` + `MomoTrustSans-SemiBold` |
| Títulos h2 | `text-2xl text-purple-400` + `MomoTrustSans-SemiBold` |
| Subtítulos | `text-sm text-gray-300` + `MomoTrustSans-Regular` |
| Labels | `text-sm text-gray-300 mb-2` + `MomoTrustSans-Medium` |
| Body text | `text-sm text-gray-100` + `MomoTrustSans-Regular` |
| Buttons | `bg-purple-500 rounded-lg py-3` + `MomoTrustSans-SemiBold` |
| Inputs | `bg-slate-800 border border-gray-700 rounded-lg px-3 py-2` + `MomoTrustSans-Regular` |

### Wheel Pickers (fecha/hora — `@quidone/react-native-wheel-picker`)
Esta librería no acepta clases NativeWind directamente en sus items (renderiza su propio `ScrollView` interno), así que su estilo se define con objetos de estilo planos, homologados a la paleta del proyecto:

```tsx
const PICKER_ITEM_HEIGHT = 34;   // alto de cada fila (default de la librería: 48)
const PICKER_VISIBLE_ITEMS = 3;  // filas visibles a la vez (default de la librería: 5)

const pickerItemTextStyle = {
  color: '#e9e9ed',                  // mismo tono que --color-text
  fontFamily: 'MomoTrustSans-Medium',
  fontSize: 15,
};
const pickerOverlayStyle = {
  backgroundColor: 'rgba(145, 132, 217, 0.12)', // acento #9184d9 con opacidad baja
  borderRadius: 8,
};
```

El contenedor (`View`) que envuelve cada wheel sí usa NativeWind normal: `bg-slate-800 border border-gray-700 rounded-lg py-0.5`.

---

## 🎭 Componentes & Iconografía (FontAwesome)

### Tab Bar Icons
```tsx
import { faListCheck, faTableCellsLarge, faCalendarDays, faUser } from '@fortawesome/free-solid-svg-icons';

// Hoy: faListCheck
// Tablero: faTableCellsLarge
// Calendario: faCalendarDays
// Perfil: faUser
```

### Iconos Comunes
| Uso | Icon |
|---|---|
| Plus (agregar) | `faPlus` |
| Check (completado) | `faCheck` |
| Eye/Eye-slash (ver/ocultar) | `faEye` / `faEyeSlash` |
| Back/Atrás | `faArrowLeft` |
| Chevron right | `faChevronRight` |
| Settings | `faUserGear` / `faShieldHalved` / `faPalette` |
| Logout | `faRightFromBracket` |
| Google | `faGoogle` (free-brands-svg-icons) |

### Componentes Reutilizables
- **ConfirmModal** (`src/components/ConfirmModal.tsx`): Modal personalizado con animación, sin usar Alert nativo
- **LoadingScreen** (`src/components/LoadingScreen.tsx`): Spinner animado + "Cargando..." pulsante
- **AddTaskModal** (`src/components/AddTaskModal.tsx`): overlay `View` absoluta (no `<Modal>` nativo, ver sección "Add Task Modal (CRÍTICO)") con `ScrollView` interno y wheel pickers de `@quidone/react-native-wheel-picker` para fecha/hora, montados perezosamente por campo.
- **TaskRow** (`src/components/TaskRow.tsx`) y **TaskDetailsModal** (`src/components/TaskDetailsModal.tsx`): fila y detalle compartidos por Hoy y Tablero.

---

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── _layout.tsx              (Root: SafeAreaProvider, StatusBar, providers)
│   ├── index.tsx                (Splash screen + redirect logic)
│   ├── (tabs)/
│   │   ├── _layout.tsx          (Tabs navigator + tab bar styling)
│   │   ├── hoy.tsx              (Today tasks - con useBackHandler)
│   │   ├── tablero.tsx          (Semana en curso lun→dom, secciones plegables por día, botón sync, con useBackHandler)
│   │   ├── calendario.tsx       (Semana/Mes/Año con indicadores por día y lista del día, con useBackHandler)
│   │   └── perfil.tsx           (Profile + logout, con useBackHandler)
│   ├── auth/
│   │   ├── _layout.tsx          (Auth stack navigator)
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx  (3 steps: email → code → password)
│   ├── apariencia.tsx           (Tema claro/oscuro + rueda de color de acento; ver sección 10)
│   ├── notificaciones.tsx / cuenta.tsx / privacidad.tsx / ayuda.tsx  (Sub-pantallas de Perfil, sección 13)
│   └── explore.tsx              (Template - puede deletarse)
├── components/
│   ├── ConfirmModal.tsx
│   ├── LoadingScreen.tsx
│   ├── ColorWheel.tsx           (Rueda de color SVG + PanResponder, usada en Apariencia)
│   ├── AddTaskModal.tsx         (Overlay View + wheel pickers, ver sección "Add Task Modal")
│   ├── TaskDetailsModal.tsx     (Detalle de solo lectura de una ocurrencia; mismo patrón de overlay)
│   ├── TaskRow.tsx              (Fila compartida Hoy/Tablero/Calendario: círculo + título + chips; estados completed/pending/missed)
│   ├── ErrorBanner.tsx          (Aviso rojo cerrable para errores de Firestore, ver sección 12)
│   ├── ScreenHeader.tsx         (Flecha + título de las sub-pantallas de Perfil, sección 13)
│   ├── NotificationSync.tsx     (Sin UI; mantiene las notificaciones locales al día, ver sección 11)
│   ├── calendar/                (CalendarModeSwitch, WeekStrip, MonthGrid, YearGrid, DayCell, DayTaskList)
│   └── [otros componentes...]
├── constants/
│   ├── categories.ts            (TASK_CATEGORIES, CATEGORY_COLORS — compartido entre Hoy y AddTaskModal)
│   └── dates.ts                 (MONTHS, DAY_NAMES, WEEKDAY_LETTERS — lunes primero)
├── contexts/
│   ├── auth-context.tsx         (onAuthStateChanged, login, register, logout)
│   ├── loading-context.tsx      (Global spinner overlay)
│   ├── notification-settings-context.tsx (enabled + hora sugerida, AsyncStorage)
│   ├── theme-context.tsx        (AppThemeProvider/useTheme: modo + acento, AsyncStorage, vars de NativeWind)
│   └── navigation-history-context.tsx  (Historial de tabs)
├── hooks/
│   ├── use-back-handler.ts      (useFocusEffect + BackHandler)
│   ├── use-tasks.ts             (Firestore real-time tasks, addTask/deleteTask, refresh/syncing)
│   ├── use-task-logs.ts         (Logs de cumplimiento por rango de fechas: isCompleted/setCompleted/refresh/clearError)
│   ├── use-task-notifications.ts (Sincroniza notificaciones locales: al cambiar tareas y al volver a primer plano)
│   └── [otros hooks...]
├── lib/
│   ├── theme.ts                 (Paletas claro/oscuro, buildTheme, utilidades hex/hsv)
│   ├── firebase.ts              (initializeAuth con AsyncStorage)
│   ├── firestore-error.ts       (describeFirestoreError: códigos de Firestore → mensajes en español)
│   ├── google-auth.ts           (signInWithGoogle/signOutFromGoogle, carga tolerante, sección 14)
│   ├── notifications.ts         (Carga tolerante de expo-notifications, canal, permisos, syncTaskNotifications/cancelTaskNotifications)
│   └── task-schedule.ts         (isTaskForDate, getWeekDays, getMonthGrid, countDay, countTasksInMonth, addDays, getOccurrenceStatus, logId, toDateStr)
├── types/
│   └── task.ts                  (Task, TaskLog, OccurrenceStatus)
├── global.css                   (Tailwind imports)
└── [config files...]
```

---

## 🔧 Configuraciones Críticas

### babel.config.js
```js
presets: [
  ["babel-preset-expo", { jsxImportSource: "nativewind" }],
  "nativewind/babel",
]
```

### metro.config.js
```js
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './src/global.css' });
```

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/assets/*": ["./assets/*"]  // Importante para fuentes
    }
  }
}
```

### app.json
```json
{
  "expo": {
    "userInterfaceStyle": "dark",
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true }
  }
}
```

---

## 🐛 Problemas Resueltos & No Repetir

| Problema | Causa | Solución | No Repetir |
|---|---|---|---|
| Contenido bajo barra de estado | SafeAreaView de react-native | Usar react-native-safe-area-context | Siempre verificar origen del import |
| LoadingScreen bloquea touches invisible | Opacity no llega a 0 exacto | `if (!visible) return null;` | Remover del árbol siempre |
| Back button sin historial | MRU logic colapsaba stack | Pila cronológica, MAX_HISTORY=50 | No eliminar duplicados, solo evitar consecutivos |
| Auth no persiste entre reinicios | Falta AsyncStorage | initializeAuth + getReactNativePersistence | Instalar siempre con `expo install` |
| Toast sin definir | Limpieza incompleta de código viejo | Revisar usos antes de remover | Grep el nombre antes de eliminar |
| Emojis inconsistentes | Mezcla emoji + IconFont | Todos con FontAwesome | Definir paleta visual antes |
| Fuentes no se cargan | Ruta relativa mal (`@/assets/`) | Ruta relativa desde _layout (`../../assets/`) | Probar font load antes de commit |
| Navigator.replace() flash blanco | Reemplazo inmediato de stack | Usar router.navigate() | Prefer navigate over replace |
| `@gorhom/bottom-sheet` no visible en Android + conflicto worklets | Peer-dep de reanimated/worklets sin resolución única + sheet no renderiza en Android | Primero `<Modal>` nativo + `Animated.Value` propio (luego reemplazado por overlay `View`, ver fila de `<Modal>` abajo y sección 6) | No instalar librerías de bottom-sheet sin verificar antes en dispositivo real |
| Wheel picker "pegado" (no gira) | `TouchableWithoutFeedback` envolvía todo el sheet, compitiendo por el gesto con el `ScrollView` interno del picker | Backdrop y sheet como hermanos, sheet sin `Touchable` envolvente | No envolver contenido con `ScrollView`/gestos dentro de un `TouchableWithoutFeedback` |
| `<Modal>` nativo tarda ~2s en abrir (Android) | Cada apertura crea una ventana/Dialog nativa nueva | `View` absoluta (overlay JS) + `BackHandler` manual | No usar `<Modal>` de react-native para sheets de uso frecuente |
| Wheel picker en gris sin datos tras un toggle | Picker montado mientras su contenedor tenía `display:"none"` → layout de tamaño 0 nunca recalculado | Montaje perezoso en el primer open de cada campo (`dateEverOpened`/`timeEverOpened`), nunca mientras está oculto | No montar componentes de lista/rueda dentro de un contenedor `display:"none"` |
| Apertura de wheel picker lenta (varios segundos) | `Intl.DateTimeFormat('es-MX', ...)` lento en su primer uso en Hermes (ICU bajo demanda) | Precalentar el mismo `Intl.DateTimeFormat` en background 400ms después de abrir el modal | No asumir que `Intl` es barato la primera vez que se usa un locale no-inglés en Hermes |
| Wheel de fecha resta un día al mover mes/año | La librería hace `new Date("YYYY-MM-DD")`, que JS parsea como UTC; se corre un día en zonas UTC-negativas | Pasar `` `${dateStr}T00:00:00` `` (fecha-hora sin zona = hora local por spec) | No usar el truco `"YYYY/MM/DD"` (slashes) — Hermes lo parsea como `Invalid Date` y rompe la librería con `RangeError` |
| Teclado tapa el input de Hoy en Android | `KeyboardAvoidingView` depende de `windowSoftInputMode` nativo, que Expo Go no aplica | Listener manual `Keyboard.addListener` + `marginBottom` dinámico | No confiar en `KeyboardAvoidingView` dentro de Expo Go |
| `addDoc` falla al guardar tareas con campos opcionales vacíos | Firestore rechaza valores `undefined` (`time`, fechas, `repeatDays` sin llenar) | `addTask` filtra las entradas `undefined` antes de `addDoc` | No pasar objetos con `undefined` a Firestore; omitir el campo |
| Tarea semanal aparece en días que no son suyos / se queda marcada | Un solo `done` en la tarea no sirve para tareas repetitivas | Logs de cumplimiento por tarea+día (sección 8) | No volver a guardar `done`/`completedAt` en `Task` |
| App entera falla con `Cannot find native module 'ExpoTopicSubscriptionModule'` | `import "expo-notifications"` lanza en Expo Go de Android (SDK 53+) y se importaba al arrancar | `require` en `try/catch` en `lib/notifications.ts` + development build con EAS | No usar import estático de `expo-notifications` en el arranque; Expo Go no sirve para notificaciones |
| Nunca pidió permiso de notificaciones ni avisó nada | El módulo ni cargaba (fila anterior) y los fallos de sync solo iban a `console.warn` | Logs `[notif]` y `Alert` si el permiso está denegado | No dejar fallos de funciones en segundo plano sin rastro visible |
| `expo install <paquete>` subió muchos paquetes | Alinea todo el SDK 57 a sus últimos parches (expo 57.0.21 → 57.0.31, etc.) | Revisar `git diff package.json` tras cada `expo install` | No asumir que instalar un paquete solo agrega ese paquete |
| Google Sign-In falla con `DEVELOPER_ERROR` / config | Falta la app Android o el SHA-1 del keystore en Firebase, o `googleWebClientId` vacío | App `com.daily.app` + SHA-1 de `eas credentials` en Firebase; Web client ID en `app.json → extra` | No usar `.env` para el client ID (EAS no sube archivos ignorados); al publicar agregar el SHA-1 de Play App Signing |
| Flujo "código de 6 dígitos" para recuperar contraseña | Firebase solo envía enlace por correo desde el cliente | Un solo paso con `sendPasswordResetEmail` | No reintroducir pasos de código/nueva contraseña dentro de la app |
| Tareas/logs no se guardan o no se leen (silencioso) | Las reglas de `users/{uid}` no cubren la subcolección `taskLogs` | `match /taskLogs/{logId}` explícito (ver `FIRESTORE_RULES.md`) | Las reglas de un documento no bajan a sus subcolecciones |

---

## ✅ Checklist para Nuevas Pantallas

- [ ] Importar `SafeAreaView` desde `react-native-safe-area-context`
- [ ] Usar `edges={['top','left','right']}` (o 4 lados)
- [ ] Agregar `useBackHandler('screenName')` si es un tab
- [ ] Usar clases NativeWind + Momo font (NO StyleSheet)
- [ ] Reemplazar emojis por FontAwesome icons
- [ ] Probar en Android real (status bar, notches, safe areas)
- [ ] Verificar que inputs/buttons usen Momo font
- [ ] No importar `StatusBar` de react-native (ya está en root)

---

## 🚀 Próximos Pasos Pendientes

1. **Pulir notificaciones locales** — no avisar de tareas ya completadas hoy (requiere logs) y abrir la tarea al tocar la notificación (`data.taskId`). Las notificaciones ya llegan en el dev build y los logs `[notif]` de diagnóstico ya se quitaron
2. **Verificar en dispositivo real** — el usuario confirmó en el dev build: notificaciones, Perfil (4 sub-pantallas), Google Sign-In y recuperar contraseña. Sin confirmar explícitamente: Apariencia y los fixes de wheel/timezone del Add Task Modal
3. **Unificar `MONTHS`/`DAY_NAMES`** — Tablero y Hoy aún tienen su propia copia; usar `src/constants/dates.ts`
4. **Perfil: lo que falta** — eliminar cuenta/datos (Cuenta/Privacidad) y contacto de soporte en Ayuda; botón de Google también en Registro
5. **OAuth Apple** (iOS) — Google ya está (sección 14)
6. **Firebase Cloud Messaging** — Push notifications (necesita el dev build, no Expo Go)
7. **Build de uso diario** — el APK `development` depende de Metro en la PC; para usarla sin PC compilar `preview` (o `production` cuando toque publicar)
8. **Testing en dispositivos reales** — Verificar en iOS físico (Android ya se corre en dev build)

---

## 📝 Comandos Útiles

```bash
# Limpiar caché y reiniciar
npx expo start -c

# Ver logs en vivo
npx expo start --localhost

# Builds (EAS en la nube, no requiere Android Studio; login con `npx eas-cli login`, proyecto vinculado con `npx eas-cli init`)
npx eas-cli build --profile development --platform android   # dev build: necesita `npx expo start` en la PC
npx eas-cli build --profile preview --platform android       # APK autónomo (JS empaquetado) para uso diario
# Recompilar solo si cambian deps nativas, plugins/permisos de app.json o versión de Expo/RN; el código JS se recarga con Metro

# Linter/Format
npx prettier --write src/

# TypeScript check
npx tsc --noEmit
```

---

## 👤 Preferencias del Usuario (de esta sesión)

- **Lenguaje:** Spanish (México) — no usar tono argentino
- **Librerías actualizadas:** Preferencia por latest, sin deprecaciones
- **Estilos modernos:** NativeWind + Momo font, NO StyleSheet + emojis
- **Consistencia:** Homologar todos los componentes antes de implementar nuevas features
- **Testing:** Probar en dispositivos reales (no solo emulador)
- **Documentación:** Este CLAUDE.md debe ser referencia para futuras sesiones

---

## 📌 Última Sesión: 2026-10-23

**Logros:**
✅ Add Task Modal: validación Fin ≥ Inicio (borde rojo, mensaje, Guardar deshabilitado) (sección 12)
✅ Errores de Firestore visibles: `ErrorBanner` en Hoy/Tablero/Calendario + mensajes en español + `clearError` en los hooks (sección 12)
✅ `FIRESTORE_RULES.md` corregido: regla explícita para `users/{uid}/taskLogs`, `update`/`delete` en `tasks`
✅ Notificaciones locales: ventana de 14 días con triggers de fecha, sincronizadas al cambiar tareas y al volver a primer plano; cancelación al cerrar sesión (sección 11)
✅ Se descubrió que Expo Go de Android no soporta `expo-notifications`; se hizo la carga tolerante y se migró a **development build con EAS** (`eas.json`, `expo-dev-client`). Las notificaciones llegan en el APK
✅ Perfil: Notificaciones (ajustes + prueba), Cuenta (nombre y contraseña), Privacidad y Ayuda (sección 13)
✅ Recuperar contraseña real con enlace por correo (un solo paso)
✅ Google Sign-In con Firebase en el dev build (sección 14); ícono de la app desde el SVG del usuario (sección 15)

**Pendiente inmediato:** pulir notificaciones (no avisar de completadas, abrir la tarea al tocar).

**Ojo:** `npx expo install` subió los parches de todo el SDK 57 (revisar `package.json` al commitear). El APK `development` necesita Metro corriendo; para uso diario sin PC compilar `preview`.

**Próxima sesión:** pulir notificaciones, luego un build `preview` para uso diario sin PC, y los pendientes de Perfil (eliminar cuenta) / Apple.

---

**Escrito por:** Claude Sonnet 5.5  
**Fecha:** 2026-10-23  
**Proyecto:** Daily! Task Manager
