import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'expo-router';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSendCode = async () => {
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Por favor completa el código');
      return;
    }
    // TODO: Verificar código con Firebase
    setStep('password');
    setError('');
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // TODO: Cambiar contraseña en Firebase
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/auth/login');
    }, 1000);
  };

  const BackButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="w-10 h-10 justify-center mb-5">
      <FontAwesomeIcon icon={faArrowLeft} size={20} color="#e9e9ed" />
    </TouchableOpacity>
  );

  if (step === 'email') {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 px-5" edges={['top', 'left', 'right', 'bottom']}>
        <BackButton onPress={() => router.back()} />

        <View className="mb-8">
          <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
            Recupera tu cuenta
          </Text>
          <Text className="text-sm text-gray-300 opacity-60" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
            Ingresa tu email o teléfono para recuperar tu contraseña.
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'MomoTrustSans-Medium' }}>
            Correo o teléfono
          </Text>
          <TextInput
            className="bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700"
            placeholder="tu@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
            style={{ fontFamily: 'MomoTrustSans-Regular' }}
          />
        </View>

        {error && <Text className="text-red-500 text-xs mb-3">{error}</Text>}

        <TouchableOpacity
          className={`bg-purple-500 rounded-lg py-3 items-center mb-4 ${loading ? 'opacity-60' : ''}`}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
              Enviar código
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'code') {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 px-5" edges={['top', 'left', 'right', 'bottom']}>
        <BackButton onPress={() => setStep('email')} />

        <View className="mb-8">
          <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
            Ingresa el código
          </Text>
          <Text className="text-sm text-gray-300 opacity-60" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
            Enviamos un código a {email}.
          </Text>
        </View>

        <View className="flex-row justify-between mb-8">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              className="w-[14%] h-12 bg-slate-800 rounded-lg text-center text-lg text-gray-100 border border-gray-700"
              placeholder="0"
              placeholderTextColor="#999"
              maxLength={1}
              value={digit}
              onChangeText={(text) => {
                const newCode = [...code];
                newCode[index] = text;
                setCode(newCode);
              }}
              keyboardType="number-pad"
              style={{ fontFamily: 'MomoTrustSans-SemiBold' }}
            />
          ))}
        </View>

        {error && <Text className="text-red-500 text-xs mb-3">{error}</Text>}

        <TouchableOpacity
          className={`bg-purple-500 rounded-lg py-3 items-center mb-4 ${loading ? 'opacity-60' : ''}`}
          onPress={handleVerifyCode}
          disabled={loading}
        >
          <Text className="text-white text-base" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
            Verificar código
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text
            className="text-purple-400 text-sm text-center"
            style={{ fontFamily: 'MomoTrustSans-Medium' }}
          >
            Reenviar código
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-5" edges={['top', 'left', 'right', 'bottom']}>
      <BackButton onPress={() => setStep('code')} />

      <View className="mb-8">
        <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
          Nueva contraseña
        </Text>
        <Text className="text-sm text-gray-300 opacity-60" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
          Crea una nueva contraseña para tu cuenta.
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'MomoTrustSans-Medium' }}>
          Nueva contraseña
        </Text>
        <TextInput
          className="bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700"
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!loading}
          style={{ fontFamily: 'MomoTrustSans-Regular' }}
        />
      </View>

      <View className="mb-2">
        <Text className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'MomoTrustSans-Medium' }}>
          Confirma la contraseña
        </Text>
        <TextInput
          className="bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700"
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          style={{ fontFamily: 'MomoTrustSans-Regular' }}
        />
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <Text className="text-purple-400 text-xs mt-1">Las contraseñas no coinciden.</Text>
        )}
      </View>

      {error && <Text className="text-red-500 text-xs mb-3 mt-2">{error}</Text>}

      <TouchableOpacity
        className={`bg-purple-500 rounded-lg py-3 items-center mt-4 ${loading ? 'opacity-60' : ''}`}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
            Cambiar contraseña
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
