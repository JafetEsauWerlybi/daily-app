import { useTheme } from "@/contexts/theme-context";
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/auth-context";
import { Link, useRouter } from "expo-router";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Igual que en login: al haber sesión se entra a la app.
  useEffect(() => {
    if (user) router.navigate("/(tabs)/hoy");
  }, [user, router]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || "No se pudo continuar con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register(email, password, name);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" style={{ paddingBottom: insets.bottom }}>
      <View className="flex-1 justify-between px-6">
        {/* Header */}
        <View>
          <Text className="text-4xl text-white mt-8 mb-7" style={{ fontFamily: "MomoTrustSans-Bold" }}>
            Daily!
          </Text>
          <Text className="text-2xl text-purple-400 mb-2" style={{ fontFamily: "MomoTrustSans-SemiBold" }}>
            Crea tu cuenta
          </Text>
          <Text className="text-sm text-gray-300 opacity-60 mb-5" style={{ fontFamily: "MomoTrustSans-Regular" }}>
            Únete a Daily! para comenzar a rastrear tus tareas.
          </Text>

          {/* Name Input */}
          <View className="mb-3">
            <Text className="text-sm text-gray-300 mb-2" style={{ fontFamily: "MomoTrustSans-Medium" }}>
              Nombre
            </Text>
            <TextInput
              className="bg-slate-800 rounded-lg px-3 py-2 text-gray-100 text-sm border border-gray-700"
              placeholder="Tu nombre"
              placeholderTextColor={colors.gray500}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          {/* Email Input */}
          <View className="mb-3">
            <Text className="text-sm text-gray-300 mb-2" style={{ fontFamily: "MomoTrustSans-Medium" }}>
              Email
            </Text>
            <TextInput
              className="bg-slate-800 rounded-lg px-3 py-2 text-gray-100 text-sm border border-gray-700"
              placeholder="tu@email.com"
              placeholderTextColor={colors.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View className="mb-3">
            <Text className="text-sm text-gray-300 mb-2" style={{ fontFamily: "MomoTrustSans-Medium" }}>
              Contraseña
            </Text>
            <View className="flex-row items-center bg-slate-800 rounded-lg px-3 border border-gray-700">
              <TextInput
                className="flex-1 py-2 text-gray-100 text-sm"
                placeholder="••••••••"
                placeholderTextColor={colors.gray500}
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
                  color={colors.accent}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error && <Text className="text-red-500 text-xs mb-2">{error}</Text>}

          {/* Register Button */}
          <TouchableOpacity
            className="bg-purple-500 rounded-lg py-3 items-center mt-1"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text className="text-onaccent text-base" style={{ fontFamily: "MomoTrustSans-SemiBold" }}>
                Crear cuenta
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-700" />
            <Text className="mx-2 text-gray-500 text-xs">OR</Text>
            <View className="flex-1 h-px bg-gray-700" />
          </View>

          {/* Google */}
          <View className="flex-row justify-center">
            <TouchableOpacity
              className={`w-11 h-11 rounded-lg bg-slate-800 border border-gray-700 justify-center items-center ${
                googleLoading || loading ? "opacity-60" : ""
              }`}
              onPress={handleGoogle}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <FontAwesomeIcon icon={faGoogle} size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center items-center mb-6">
          <Text className="text-gray-500 text-xs" style={{ fontFamily: "MomoTrustSans-Regular" }}>
            ¿Ya tienes cuenta?{" "}
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-purple-400 text-xs" style={{ fontFamily: "MomoTrustSans-SemiBold" }}>
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
