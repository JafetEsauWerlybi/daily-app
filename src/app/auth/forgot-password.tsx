import { useTheme } from "@/contexts/theme-context";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faEnvelopeCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "expo-router";

// Segundos antes de poder reenviar el correo.
const RESEND_SECONDS = 30;

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "El correo no es válido",
  "auth/user-not-found": "No encontramos una cuenta con ese correo",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet",
};

// Firebase manda un correo con un enlace para crear la nueva contraseña; no existe
// un flujo de código de 6 dígitos desde el cliente, por eso es un solo paso.
export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const { resetPassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Por favor ingresa tu correo");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(trimmed);
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err: any) {
      setError(
        ERROR_MESSAGES[err?.code] || err?.message || "No se pudo enviar el correo",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950 px-5"
      edges={["top", "left", "right", "bottom"]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-10 h-10 justify-center mb-5"
      >
        <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.white} />
      </TouchableOpacity>

      {sent ? (
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-slate-800 justify-center items-center mb-5">
            <FontAwesomeIcon
              icon={faEnvelopeCircleCheck}
              size={28}
              color={colors.accent}
            />
          </View>
          <Text
            className="text-2xl text-white mb-2 text-center"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Revisa tu correo
          </Text>
          <Text
            className="text-sm text-gray-300 opacity-60 text-center mb-8"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            Enviamos un enlace a {email.trim()} para crear una nueva contraseña.
            Si no lo ves, revisa la carpeta de spam.
          </Text>

          <TouchableOpacity
            className="bg-purple-500 rounded-lg py-3 px-12 items-center mb-4"
            onPress={() => router.back()}
          >
            <Text
              className="text-onaccent text-base"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              Volver a iniciar sesión
            </Text>
          </TouchableOpacity>

          {error !== "" && (
            <Text className="text-red-500 text-xs mb-3">{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || cooldown > 0}
            className={loading || cooldown > 0 ? "opacity-50" : ""}
          >
            <Text
              className="text-purple-400 text-sm text-center"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              {cooldown > 0 ? `Reenviar correo (${cooldown}s)` : "Reenviar correo"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View className="mb-8">
            <Text
              className="text-2xl text-white mb-2"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              Recupera tu cuenta
            </Text>
            <Text
              className="text-sm text-gray-300 opacity-60"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              Ingresa tu correo y te enviaremos un enlace para crear una nueva
              contraseña.
            </Text>
          </View>

          <View className="mb-4">
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Correo
            </Text>
            <TextInput
              className="bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700"
              placeholder="tu@email.com"
              placeholderTextColor={colors.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleSend}
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            />
          </View>

          {error !== "" && (
            <Text className="text-red-500 text-xs mb-3">{error}</Text>
          )}

          <TouchableOpacity
            className={`bg-purple-500 rounded-lg py-3 items-center mb-4 ${
              loading ? "opacity-60" : ""
            }`}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text
                className="text-onaccent text-base"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Enviar enlace
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
