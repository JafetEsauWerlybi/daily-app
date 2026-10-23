import Constants from "expo-constants";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

// La librería es nativa: no existe en Expo Go. Se carga con require dentro de
// try/catch para que la app no se caiga ahí; el botón solo avisa que falta.
let GoogleSignin: typeof import("@react-native-google-signin/google-signin") | null =
  null;
try {
  GoogleSignin = require("@react-native-google-signin/google-signin");
} catch {
  console.warn(
    "[google] google-signin no está disponible en este entorno (¿Expo Go?). Usa el development build.",
  );
}

// Web client ID de Firebase Authentication → Google (app.json → expo.extra).
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId as
  | string
  | undefined;

let configured = false;

export type GoogleSignInResult = "success" | "cancelled";

export class GoogleSignInError extends Error {}

// Abre el selector de cuentas de Google y entra a Firebase con el idToken.
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!GoogleSignin) {
    throw new GoogleSignInError(
      "Google no está disponible en esta versión de la app",
    );
  }
  if (!WEB_CLIENT_ID) {
    throw new GoogleSignInError(
      "Falta configurar el Web client ID de Google en app.json",
    );
  }

  const { GoogleSignin: Signin, isSuccessResponse, isErrorWithCode, statusCodes } =
    GoogleSignin;

  if (!configured) {
    Signin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  }

  try {
    await Signin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await Signin.signIn();
    if (!isSuccessResponse(response)) return "cancelled";

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new GoogleSignInError("Google no devolvió un token de acceso");
    }
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return "success";
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return "cancelled";
      if (err.code === statusCodes.IN_PROGRESS) return "cancelled";
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleSignInError(
          "Se necesitan los servicios de Google Play para iniciar sesión",
        );
      }
    }
    throw err;
  }
}

// Cierra también la sesión de Google para que la próxima vez deje elegir cuenta.
export async function signOutFromGoogle() {
  if (!GoogleSignin || !configured) return;
  try {
    await GoogleSignin.GoogleSignin.signOut();
  } catch {
    // Si no había sesión de Google no pasa nada.
  }
}
