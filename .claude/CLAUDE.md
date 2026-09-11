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
WheelPicker: @quidone/react-native-wheel-picker (JS puro, sin código nativo — usado para date/time pickers tipo rueda)
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

### 6. **Add Task Modal (CRÍTICO — no usar librerías de bottom-sheet)**
**Problema:** Se intentó usar `@gorhom/bottom-sheet` (con `GestureHandlerRootView` + `BottomSheetModalProvider` en `_layout.tsx` raíz) para el modal de "Nueva tarea". Dos fallas:
1. Conflicto de peer-deps: `react-native-reanimated@4.5.1` (el que realmente queda instalado) pide `react-native-worklets@0.10.x`, pero `@gorhom/bottom-sheet` + npm intentaban resolver `reanimated` a `4.6.0`, que pide `worklets@0.12.x` — y `expo-modules-core` (parte del propio SDK 57) exige `worklets@0.10.x`. No hay combinación que satisfaga a los tres a la vez sin `--legacy-peer-deps`.
2. Aun instalando con `--legacy-peer-deps`, el `BottomSheetModal` no se hacía visible en Android (probado en Samsung A15) — ni con `enableDynamicSizing={false}` ni ajustando snapPoints.

**Solución:** Modal nativo de React Native (`<Modal transparent animationType="none">`) + `Animated.Value` propio para el slide-up/fade, mismo patrón que `ConfirmModal.tsx`. Backdrop y sheet son **hermanos** (no padre/hijo) dentro de un `View` — el backdrop tiene su propio `TouchableWithoutFeedback onPress={handleClose}`, y el sheet NO está envuelto por ningún `Touchable`.

**No repetir:** No envolver el contenido scrolleable del sheet (ni sus wheel pickers) dentro de un `TouchableWithoutFeedback` — la negociación de gesto de "tap" de ese componente compite con el gesto de scroll/drag de listas internas (`ScrollView`, wheel pickers) y las deja "pegadas" sin responder al arrastre.

**Wheel pickers (fecha/hora):** se usa `@quidone/react-native-wheel-picker` (`DatePicker` para fecha, `WheelPicker` para hora/minuto) — es JS puro, sin módulos nativos, así que no reintroduce el problema de peer-deps de `worklets`. Props clave para tamaño: `itemHeight` (alto de cada fila, default 48) y `visibleItemCount` (filas visibles, default 5) — en este proyecto se usan `PICKER_ITEM_HEIGHT = 34` y `PICKER_VISIBLE_ITEMS = 3` (declaradas en `AddTaskModal.tsx`) para que las ruedas no se vean sobredimensionadas.

**Scroll del contenido:** el modal completo puede exceder la pantalla al abrir un wheel picker. Se envuelve el bloque de campos (Título → Días) en un `ScrollView` normal (sin librería), dejando el handle+título fijos arriba y los botones Cancelar/Guardar fijos abajo (fuera del `ScrollView`). El `ScrollView` interno de los wheel pickers de `@quidone` convive bien anidado dentro de este `ScrollView` exterior (ambos son `ScrollView` nativos estándar, no hay competencia de `Touchable` de por medio).

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
- **AddTaskModal** (`src/components/AddTaskModal.tsx`): Modal nativo (mismo patrón que ConfirmModal) con `ScrollView` interno y wheel pickers de `@quidone/react-native-wheel-picker` para fecha/hora. Ver sección "Add Task Modal (CRÍTICO)" arriba.

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
│   │   ├── tablero.tsx          (Board - placeholder, con useBackHandler)
│   │   ├── calendario.tsx       (Calendar - placeholder, con useBackHandler)
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
│   ├── AddTaskModal.tsx         (Modal nativo + wheel pickers, ver sección "Add Task Modal")
│   └── [otros componentes...]
├── constants/
│   └── categories.ts            (TASK_CATEGORIES, CATEGORY_COLORS — compartido entre Hoy y AddTaskModal)
├── contexts/
│   ├── auth-context.tsx         (onAuthStateChanged, login, register, logout)
│   ├── loading-context.tsx      (Global spinner overlay)
│   └── navigation-history-context.tsx  (Historial de tabs)
├── hooks/
│   ├── use-back-handler.ts      (useFocusEffect + BackHandler)
│   ├── use-tasks.ts             (Firestore real-time tasks, incluye addTask)
│   └── [otros hooks...]
├── lib/
│   └── firebase.ts              (initializeAuth con AsyncStorage)
├── types/
│   └── task.ts                  (Task interface)
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

1. **Validación de datos del Add Task Modal** — actualmente `handleSave` solo hace `console.log` (el `onSubmit` real está comentado en `AddTaskModal.tsx`), falta validar campos y reconectar a `addTask`
2. **Implementar Tablero** — 3 checkboxes (filtro) + secciones de tareas por estado
3. **Implementar Calendario** — Vista semanal/mensual/anual
4. **Implementar Profile sub-screens** — Notificaciones, Apariencia, Cuenta, Privacidad, Ayuda
5. **OAuth Google & Apple** — Botones de login ya existen, falta integración
6. **Programar notificación local real** para la hora seleccionada en Add Task (hoy solo se guarda el campo `time`, no se agenda con `expo-notifications`)
7. **Firebase Cloud Messaging** — Push notifications
8. **Firestore Security Rules** — Publicar reglas de seguridad
9. **Testing en dispositivos reales** — Verificar en Android + iOS físicos

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

## 📌 Última Sesión: 2026-09-11

**Logros:**
✅ Add Task Modal implementado (`src/components/AddTaskModal.tsx`) — Título, Etiqueta, Rango de fechas, Hora de notificación, Días de repetición + "Todos los días"
✅ Wheel pickers de fecha/hora con `@quidone/react-native-wheel-picker` (JS puro, sin módulos nativos)
✅ Probado y descartado `@gorhom/bottom-sheet` (conflicto de peer-deps + no visible en Android) — ver sección "Add Task Modal (CRÍTICO)"
✅ Scroll interno del modal (ScrollView) con botones de acción fijos, sin romper el gesto de los wheel pickers
✅ `src/constants/categories.ts` extraído para compartir colores/categorías entre Hoy y AddTaskModal

**Pendiente inmediato:** `handleSave` en `AddTaskModal.tsx` actualmente solo hace `console.log` — el `onSubmit` real a Firestore está comentado a la espera de la tarea de validación de datos.

**Próxima sesión:** Validación de datos del modal, reconectar `onSubmit`, luego Tablero y Calendario.

---

**Escrito por:** Claude Sonnet 5  
**Fecha:** 2026-09-11  
**Proyecto:** Daily! Task Manager
