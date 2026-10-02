# Daily! App — Guía de Desarrollo & Lecciones Aprendidas

## 📱 Descripción General
**Daily!** es una aplicación móvil de tareas personales construida con React Native 0.86.3, Expo 57.0.21, Firebase (Auth + Firestore), TypeScript, y Expo Router. Incluye autenticación real, gestión de tareas en tiempo real, y navegación robusta por pestañas.

---

## 🛠️ Stack & Versiones (Actualizado)

```
React Native: 0.86.3
Expo: 57.0.21
Firebase: 12.18.0 (@firebase/auth 1.13.5, @firebase/firestore)
Expo Router: Latest (file-based routing)
NativeWind: Latest (Tailwind CSS para React Native)
TypeScript: Latest
FontAwesome: @fortawesome/react-native-fontawesome + @fortawesome/free-solid-svg-icons + @fortawesome/free-brands-svg-icons
AsyncStorage: @react-native-async-storage/async-storage 2.2.0 (para persistencia de auth)
SafeAreaContext: react-native-safe-area-context (NO usar SafeAreaView de react-native)
StatusBar: expo-status-bar (para manejo transparente de barra de estado)
WheelPicker: @quidone/react-native-wheel-picker (incluye código nativo opcional en el paquete, pero funciona sin rebuild nativo vía Expo Go — usado para date/time pickers tipo rueda)
```

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
- Add Task Modal: vigencia por defecto hoy → +1 año, día de hoy preseleccionado y "Guardar" deshabilitado sin días; hora de notificación por defecto 08:00 solo si se marca "¿Quieres notificación?".
- Botón de sincronizar (Tablero): `refresh()` de `use-tasks` y `use-task-logs` re-suscribe los `onSnapshot` (Firestore ya es en tiempo real; el botón solo fuerza re-lectura).

**No repetir:** no volver a poner `done` en `Task`; no escribir logs de "no completada" para días pasados (se derivan); no cambiar los días/vigencia de una tarea sin considerar que el historial pasado se recalcula (el estado `missed` depende del calendario actual de la tarea).

### 9. **Calendario (Semana / Mes / Año)**
**Estructura:** `calendario.tsx` orquesta; los componentes viven en `src/components/calendar/` (`CalendarModeSwitch`, `WeekStrip`, `MonthGrid`, `YearGrid`, `DayCell`, `DayTaskList`). Reusa `isTaskForDate`, `useTasks`, `useTaskLogs`, `TaskRow` y `TaskDetailsModal` (sección 8). Los nombres de meses/días están en `src/constants/dates.ts` (Tablero aún tiene su propia copia).
- **Estado:** `mode`, `anchor` (fecha que define el periodo visible) y `selectedDay`. **Siempre abre en Semana con hoy seleccionado.** Botón "Hoy" aparece al alejarse.
- **Navegación:** flechas ±1 semana/mes/año. En Mes, deslizar a los lados cambia de mes (`PanResponder` de RN, sin librerías; solo toma el gesto si es claramente horizontal). Tocar el nombre del mes abre Año; tocar una tarjeta de Año abre ese Mes. Tocar un día de un mes vecino lo selecciona y navega a ese mes.
- **Mes:** `getMonthGrid` devuelve solo las semanas necesarias (4–6 filas, lunes primero) con días vecinos atenuados — **no** una cuadrícula fija de 6 filas (se recortó para no mostrar semanas de más del mes siguiente). La altura cambia entre meses.
- **Indicadores por día** (`DayCell`): pasado y hoy → punto rojo + nº sin completar y punto verde + nº completadas; futuro → un punto azul + nº de tareas. No se dibuja un punto con conteo 0. Colores suaves (`#e58b8b`, `#7fcf9f`, `#7ba7ee`).
- **Selección:** el día seleccionado pinta de morado todo el contenedor de la fecha (número y conteos dentro); hoy no seleccionado se marca con el número en morado. Las celdas no llevan borde.
- **Logs:** Semana/Mes se suscriben al rango visible (primer→último día mostrado); Año solo cuenta tareas (`countTasksInMonth`) y no necesita logs.
- **Lista del día:** mismas reglas que Tablero (pasado solo lectura; hoy y futuro editables).

**No repetir (estilos):**
- **No usar clases arbitrarias de NativeWind para tamaño de fuente** (`text-[7px]`, `text-[5px]`…): no se aplican y el texto sale al tamaño por defecto. Usar `style={{ fontSize }}` (con `lineHeight`) como en `COUNT_FONT_SIZE` de `DayCell.tsx`. Los valores arbitrarios de espaciado sí funcionaron (`py-[19px]`).
- **No poner `flex-1` en el contenedor interno de una celda de alto automático:** su alto base pasa a 0, queda en el `minHeight` y el contenido (los conteos) se sale del fondo de color. Dejar que el contenedor mida lo que mide su contenido.

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
- **NO usar:** custom tailwind config colors (no funciona reliablemente en RN); usar colores estándar Tailwind

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
│   └── explore.tsx              (Template - puede deletarse)
├── components/
│   ├── ConfirmModal.tsx
│   ├── LoadingScreen.tsx
│   ├── AddTaskModal.tsx         (Overlay View + wheel pickers, ver sección "Add Task Modal")
│   ├── TaskDetailsModal.tsx     (Detalle de solo lectura de una ocurrencia; mismo patrón de overlay)
│   ├── TaskRow.tsx              (Fila compartida Hoy/Tablero/Calendario: círculo + título + chips; estados completed/pending/missed)
│   ├── calendar/                (CalendarModeSwitch, WeekStrip, MonthGrid, YearGrid, DayCell, DayTaskList)
│   └── [otros componentes...]
├── constants/
│   ├── categories.ts            (TASK_CATEGORIES, CATEGORY_COLORS — compartido entre Hoy y AddTaskModal)
│   └── dates.ts                 (MONTHS, DAY_NAMES, WEEKDAY_LETTERS — lunes primero)
├── contexts/
│   ├── auth-context.tsx         (onAuthStateChanged, login, register, logout)
│   ├── loading-context.tsx      (Global spinner overlay)
│   └── navigation-history-context.tsx  (Historial de tabs)
├── hooks/
│   ├── use-back-handler.ts      (useFocusEffect + BackHandler)
│   ├── use-tasks.ts             (Firestore real-time tasks, addTask/deleteTask, refresh/syncing)
│   ├── use-task-logs.ts         (Logs de cumplimiento por rango de fechas: isCompleted/setCompleted/refresh)
│   └── [otros hooks...]
├── lib/
│   ├── firebase.ts              (initializeAuth con AsyncStorage)
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
| `@gorhom/bottom-sheet` no visible en Android + conflicto worklets | Peer-dep de reanimated/worklets sin resolución única + sheet no renderiza en Android | Modal nativo `<Modal>` + `Animated.Value` propio | No instalar librerías de bottom-sheet sin verificar antes en dispositivo real |
| Wheel picker "pegado" (no gira) | `TouchableWithoutFeedback` envolvía todo el sheet, compitiendo por el gesto con el `ScrollView` interno del picker | Backdrop y sheet como hermanos, sheet sin `Touchable` envolvente | No envolver contenido con `ScrollView`/gestos dentro de un `TouchableWithoutFeedback` |
| `<Modal>` nativo tarda ~2s en abrir (Android) | Cada apertura crea una ventana/Dialog nativa nueva | `View` absoluta (overlay JS) + `BackHandler` manual | No usar `<Modal>` de react-native para sheets de uso frecuente |
| Wheel picker en gris sin datos tras un toggle | Picker montado mientras su contenedor tenía `display:"none"` → layout de tamaño 0 nunca recalculado | Montaje perezoso en el primer open de cada campo (`dateEverOpened`/`timeEverOpened`), nunca mientras está oculto | No montar componentes de lista/rueda dentro de un contenedor `display:"none"` |
| Apertura de wheel picker lenta (varios segundos) | `Intl.DateTimeFormat('es-MX', ...)` lento en su primer uso en Hermes (ICU bajo demanda) | Precalentar el mismo `Intl.DateTimeFormat` en background 400ms después de abrir el modal | No asumir que `Intl` es barato la primera vez que se usa un locale no-inglés en Hermes |
| Wheel de fecha resta un día al mover mes/año | La librería hace `new Date("YYYY-MM-DD")`, que JS parsea como UTC; se corre un día en zonas UTC-negativas | Pasar `` `${dateStr}T00:00:00` `` (fecha-hora sin zona = hora local por spec) | No usar el truco `"YYYY/MM/DD"` (slashes) — Hermes lo parsea como `Invalid Date` y rompe la librería con `RangeError` |
| Teclado tapa el input de Hoy en Android | `KeyboardAvoidingView` depende de `windowSoftInputMode` nativo, que Expo Go no aplica | Listener manual `Keyboard.addListener` + `marginBottom` dinámico | No confiar en `KeyboardAvoidingView` dentro de Expo Go |
| `addDoc` falla al guardar tareas con campos opcionales vacíos | Firestore rechaza valores `undefined` (`time`, fechas, `repeatDays` sin llenar) | `addTask` filtra las entradas `undefined` antes de `addDoc` | No pasar objetos con `undefined` a Firestore; omitir el campo |
| Tarea semanal aparece en días que no son suyos / se queda marcada | Un solo `done` en la tarea no sirve para tareas repetitivas | Logs de cumplimiento por tarea+día (sección 8) | No volver a guardar `done`/`completedAt` en `Task` |

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

1. **Validación de fechas del Add Task Modal** — ya se guarda en Firestore, pero nada impide Fin < Inicio (con repetición la tarea nunca aparecería)
2. **Verificar en dispositivo real** — los fixes de performance/timezone del Add Task Modal (`T00:00:00`, precalentamiento de `Intl`) y todo lo de Hoy/Tablero/logs se validó por lectura de código + `tsc`, no en el Samsung A15 físico
3. **Mostrar errores de Firestore en UI** — `use-tasks` y `use-task-logs` guardan `error` pero ninguna pantalla lo muestra
4. **Unificar `MONTHS`/`DAY_NAMES`** — Tablero y Hoy aún tienen su propia copia; usar `src/constants/dates.ts`
5. **Implementar Profile sub-screens** — Notificaciones, Apariencia, Cuenta, Privacidad, Ayuda
6. **OAuth Google & Apple** — Botones de login ya existen, falta integración
7. **Programar notificación local real** para la hora seleccionada en Add Task (hoy solo se guarda el campo `time`, no se agenda con `expo-notifications`)
8. **Firebase Cloud Messaging** — Push notifications
9. **Firestore Security Rules** — Publicar reglas de seguridad (incluir `users/{uid}/taskLogs`: lectura/escritura solo del dueño)
10. **Testing en dispositivos reales** — Verificar en Android + iOS físicos

---

## 📝 Comandos Útiles

```bash
# Limpiar caché y reiniciar
npx expo start -c

# Ver logs en vivo
npx expo start --localhost

# Builds
eas build --platform android --local
eas build --platform ios --local

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

## 📌 Última Sesión: 2026-10-02 (segunda parte)

**Logros (guardado de tareas, Hoy y Tablero semanal con logs de cumplimiento):**
✅ Add Task Modal: checkbox "¿Quieres notificación?" — el wheel de hora solo aparece (y `time` solo se guarda) si está marcado; hora por defecto 08:00
✅ Add Task Modal: `onSubmit` descomentado y conectado a Firestore (`addTask`); `addTask` ya filtra campos `undefined` (Firestore los rechaza)
✅ Add Task Modal: vigencia por defecto hoy → +1 año, día de hoy preseleccionado en "Días", y "Guardar" deshabilitado sin al menos un día
✅ Hoy: solo muestra las ocurrencias de hoy; las completadas siguen visibles (atenuadas, tachadas) para poder desmarcarlas; solo el círculo marca, tocar la fila abre `TaskDetailsModal`
✅ Tablero: semana en curso (lunes→domingo) con secciones plegables por día (hoy y futuros abiertos, pasados cerrados), botón de sincronizar, días pasados de solo lectura
✅ Modelo nuevo de cumplimiento: logs por tarea+día (ver sección 8); la tarea ya no tiene `done`/`completedAt`

✅ Calendario: Semana / Mes / Año con indicadores por día (rojo/verde en pasado y hoy, azul en futuro), selección con contenedor morado, deslizar para cambiar de mes, tocar el mes para ver el año, lista del día con las reglas de Tablero (ver sección 9)
✅ Ajustes de estilo del Calendario hechos con feedback en dispositivo: celdas sin borde, más espacio entre fechas, mes con solo las semanas necesarias, año con tarjetas que llenan el alto
✅ Bugs encontrados: `text-[Npx]` no aplica el tamaño de fuente y `flex-1` en el contenedor interno de la celda dejaba los conteos fuera del fondo (ambos en "No repetir" de la sección 9)

**Pendiente inmediato:** las **reglas de Firestore** para `users/{uid}/taskLogs` (sin ellas puede fallar al guardar; el error solo queda en `error` del hook, no se muestra en UI) y validar Fin ≥ Inicio en el modal. El Calendario sí se ha ido viendo en el celular durante los ajustes de estilo, pero el guardado/lectura de logs y los fixes anteriores del modal siguen sin confirmarse en el Samsung A15.

**Próxima sesión:** publicar reglas de Firestore, validar fechas del modal, luego Perfil (sub-pantallas) y notificaciones locales.

---

**Escrito por:** Claude Sonnet 5  
**Fecha:** 2026-10-02  
**Proyecto:** Daily! Task Manager
