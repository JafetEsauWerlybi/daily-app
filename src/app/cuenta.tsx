import { ConfirmModal } from "@/components/ConfirmModal";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PASSWORD_ERRORS: Record<string, string> = {
  "auth/wrong-password": "La contraseña actual es incorrecta",
  "auth/invalid-credential": "La contraseña actual es incorrecta",
  "auth/weak-password": "La nueva contraseña es muy débil",
  "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
  "auth/requires-recent-login": "Vuelve a iniciar sesión e inténtalo de nuevo",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text
        className="text-sm text-gray-300 mb-2"
        style={{ fontFamily: "MomoTrustSans-Medium" }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function CuentaScreen() {
  const { colors } = useTheme();
  const { user, hasPassword, updateDisplayName, changePassword, deleteAccount } =
    useAuth();

  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== (user?.displayName ?? "");

  const handleSaveName = async () => {
    if (!trimmedName) {
      setNameMessage({ ok: false, text: "Escribe tu nombre" });
      return;
    }
    setSavingName(true);
    setNameMessage(null);
    try {
      await updateDisplayName(trimmedName);
      setNameMessage({ ok: true, text: "Nombre actualizado" });
    } catch (err: any) {
      setNameMessage({
        ok: false,
        text: err?.message || "No se pudo actualizar el nombre",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ ok: false, text: "Completa todos los campos" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({
        ok: false,
        text: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ ok: false, text: "Las contraseñas no coinciden" });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ ok: true, text: "Contraseña actualizada" });
    } catch (err: any) {
      setPasswordMessage({
        ok: false,
        text:
          PASSWORD_ERRORS[err?.code] ||
          err?.message ||
          "No se pudo cambiar la contraseña",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    setDeleteError("");
    try {
      // Al borrarse la cuenta, el cambio de sesión te regresa al login.
      await deleteAccount(hasPassword ? deletePassword : undefined);
    } catch (err: any) {
      setDeleteError(
        PASSWORD_ERRORS[err?.code] ||
          err?.message ||
          "No se pudo eliminar la cuenta",
      );
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700";

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Cuenta" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Datos */}
          <Field label="Nombre">
            <TextInput
              className={inputClass}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.gray500}
              editable={!savingName}
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            />
          </Field>

          <Field label="Correo">
            <View className="bg-slate-800 rounded-lg px-3 py-2.5 border border-gray-700 opacity-60">
              <Text
                className="text-sm text-gray-100"
                style={{ fontFamily: "MomoTrustSans-Regular" }}
              >
                {user?.email}
              </Text>
            </View>
          </Field>

          {nameMessage && (
            <Text
              className={`text-xs mb-3 ${nameMessage.ok ? "text-gray-300" : "text-red-500"}`}
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              {nameMessage.text}
            </Text>
          )}

          <TouchableOpacity
            className={`bg-purple-500 rounded-lg py-3 items-center mb-10 ${
              savingName || !nameChanged ? "opacity-50" : ""
            }`}
            onPress={handleSaveName}
            disabled={savingName || !nameChanged}
          >
            {savingName ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text
                className="text-onaccent text-sm"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Guardar nombre
              </Text>
            )}
          </TouchableOpacity>

          {/* Contraseña */}
          <Text
            className="text-xl text-white mb-4"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Contraseña
          </Text>

          {hasPassword ? (
            <>
              <Field label="Contraseña actual">
                <TextInput
                  className={inputClass}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray500}
                  editable={!savingPassword}
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                />
              </Field>
              <Field label="Nueva contraseña">
                <TextInput
                  className={inputClass}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray500}
                  editable={!savingPassword}
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                />
              </Field>
              <Field label="Confirma la nueva contraseña">
                <TextInput
                  className={inputClass}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray500}
                  editable={!savingPassword}
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                />
              </Field>

              {passwordMessage && (
                <Text
                  className={`text-xs mb-3 ${passwordMessage.ok ? "text-gray-300" : "text-red-500"}`}
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {passwordMessage.text}
                </Text>
              )}

              <TouchableOpacity
                className={`bg-purple-500 rounded-lg py-3 items-center ${
                  savingPassword ? "opacity-60" : ""
                }`}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <Text
                    className="text-onaccent text-sm"
                    style={{ fontFamily: "MomoTrustSans-SemiBold" }}
                  >
                    Cambiar contraseña
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text
              className="text-sm text-gray-400"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              Tu cuenta entra con Google, así que no tiene una contraseña de
              Daily! que cambiar.
            </Text>
          )}

          {/* Eliminar cuenta */}
          <Text
            className="text-xl text-red-500 mt-12 mb-2"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Eliminar cuenta
          </Text>
          <Text
            className="text-sm text-gray-400 mb-4"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            Se borran para siempre tu cuenta, tus tareas, tus registros y tus
            notas. No se puede deshacer.
          </Text>

          {hasPassword && (
            <Field label="Tu contraseña">
              <TextInput
                className={inputClass}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.gray500}
                editable={!deleting}
                style={{ fontFamily: "MomoTrustSans-Regular" }}
              />
            </Field>
          )}

          {deleteError !== "" && (
            <Text
              className="text-xs text-red-500 mb-3"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              {deleteError}
            </Text>
          )}

          <TouchableOpacity
            className={`rounded-lg py-3 items-center border border-red-500 ${
              deleting || (hasPassword && !deletePassword) ? "opacity-50" : ""
            }`}
            onPress={() => setConfirmDelete(true)}
            disabled={deleting || (hasPassword && !deletePassword)}
          >
            {deleting ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text
                className="text-red-500 text-sm"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Eliminar mi cuenta
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmDelete}
        icon={faTrashCan}
        title="¿Eliminar tu cuenta?"
        message="Se borrarán todos tus datos y no podrás recuperarlos."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}
