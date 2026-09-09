import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "expo-router";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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

          {/* Register Button */}
          <TouchableOpacity
            className="bg-purple-500 rounded-lg py-3 items-center mt-1"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base" style={{ fontFamily: "MomoTrustSans-SemiBold" }}>
                Crear cuenta
              </Text>
            )}
          </TouchableOpacity>
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
