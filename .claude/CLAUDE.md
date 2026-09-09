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
```

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
│   └── [otros componentes...]
├── contexts/
│   ├── auth-context.tsx         (onAuthStateChanged, login, register, logout)
│   ├── loading-context.tsx      (Global spinner overlay)
│   └── navigation-history-context.tsx  (Historial de tabs)
├── hooks/
│   ├── use-back-handler.ts      (useFocusEffect + BackHandler)
│   ├── use-tasks.ts             (Firestore real-time tasks)
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

1. **Implementar Tablero** — 3 checkboxes (filtro) + secciones de tareas por estado
2. **Implementar Calendario** — Vista semanal/mensual/anual
3. **Implementar Profile sub-screens** — Notificaciones, Apariencia, Cuenta, Privacidad, Ayuda
4. **OAuth Google & Apple** — Botones de login ya existen, falta integración
5. **Firebase Cloud Messaging** — Push notifications
6. **Firestore Security Rules** — Publicar reglas de seguridad
7. **Testing en dispositivos reales** — Verificar en Android + iOS físicos

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

## 📌 Última Sesión: 2026-09-09

**Logros:**
✅ Implementado historial de navegación real (pila cronológica)
✅ Modal personalizado para confirmación de salida (ConfirmModal)
✅ SafeArea + StatusBar arreglado (contenido ya no bajo barra de estado)
✅ Homologación visual completa (NativeWind + Momo + FontAwesome en todas las pantallas)
✅ Firebase persistencia de auth (AsyncStorage)
✅ Back button handler con historial robusta

**Próxima sesión:** Implementar Tablero (board), Calendario, y OAuth.

---

**Escrito por:** Claude Haiku 4.5  
**Fecha:** 2026-09-09  
**Proyecto:** Daily! Task Manager
