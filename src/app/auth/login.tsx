import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "expo-router";
import { useLoading } from "@/contexts/loading-context";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { hide: hideLoading } = useLoading();
  const insets = useSafeAreaInsets();
  const { show: showLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Escuchar cambios en user para redirigir cuando esté autenticado
  useEffect(() => {
    if (user) {
      hideLoading();
      router.navigate("/(tabs)/hoy");
    }
  }, [user, router, hideLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      showLoading();
      // El cambio de user en auth-context dispara la redirección automáticamente en index.tsx
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        "auth/user-not-found": "Usuario no encontrado",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/invalid-email": "Email inválido",
        "auth/user-disabled": "Usuario deshabilitado",
        "auth/invalid-credential": "Email o contraseña incorrectos",
      };
      const errorMsg = errorMessages[err.code] || err.message || "Error al iniciar sesión";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-1 justify-between px-6">
        {/* Header */}
        <View>
          <Text
            className="text-4xl text-white mt-8 mb-20"
            style={{ fontFamily: "MomoTrustSans-Bold" }}
          >
            Daily!
          </Text>
          <Text
            className="text-2xl text-purple-400 mb-2"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Welcome!
          </Text>
          <Text
            className="text-sm text-gray-300 opacity-60 mb-7"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            Inicia sesión en Daily! para continuar.
          </Text>

          {/* Email Input */}
          <View className="mb-4">
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Email
            </Text>
            <TextInput
              className="bg-slate-800 rounded-lg px-3 py-2 text-gray-100 text-sm border border-gray-700"
              placeholder="tu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Contraseña
            </Text>
            <View className="flex-row items-center bg-slate-800 rounded-lg px-3 border border-gray-700">
              <TextInput
                className="flex-1 py-2 text-gray-100 text-sm"
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="pr-2"
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  size={16}
                  color="#9184d9"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error && <Text className="text-red-500 text-xs mb-2">{error}</Text>}

          {/* Login Button */}
          <TouchableOpacity
            className="bg-purple-500 rounded-lg py-3 px-12 items-center mt-1 mb-5 self-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className="text-white text-sm"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>
          {/* Forgot Password Link */}
          <Link href="/auth/forgot-password" asChild>
            <TouchableOpacity className="mb-4">
              <Text
                className="text-sm text-gray-300"
                style={{ fontFamily: "MomoTrustSans-Medium" }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </Link>
          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-700" />
            <Text className="mx-2 text-gray-500 text-xs">OR</Text>
            <View className="flex-1 h-px bg-gray-700" />
          </View>

          {/* Google Icon Button */}
          <View className="flex-row justify-center">
            <TouchableOpacity className="w-11 h-11 rounded-lg bg-slate-800 border border-gray-700 justify-center items-center">
              <FontAwesomeIcon icon={faGoogle} size={20} color="#9184d9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center items-center mb-6">
          <Text
            className="text-gray-500 text-xs"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            ¿No tienes cuenta?{" "}
          </Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <Text
                className="text-purple-400 text-xs"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Regístrate!
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
