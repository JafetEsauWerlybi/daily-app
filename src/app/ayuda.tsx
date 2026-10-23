import { ScreenHeader } from "@/components/ScreenHeader";
import { useTheme } from "@/contexts/theme-context";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import Constants from "expo-constants";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FAQ: { question: string; answer: string }[] = [
  {
    question: "¿Cómo creo una tarea?",
    answer:
      "En Hoy toca el botón + (se abre el formulario con el título que ya hayas escrito) o escribe el título y presiona Enter para agregarla directo para hoy.",
  },
  {
    question: "¿Cómo hago que una tarea se repita?",
    answer:
      "En el formulario activa «¿Tarea recurrente?». Elige la fecha de inicio, la de fin y los días de la semana en que se realizará.",
  },
  {
    question: "¿Qué significa «no completada»?",
    answer:
      "Es una tarea de un día que ya pasó y no marcaste. Se calcula sola, no se guarda. Los días pasados son de solo lectura.",
  },
  {
    question: "¿Cómo finalizo o elimino una tarea?",
    answer:
      "En Calendario, abre la tarea de hoy o de un día futuro. Ahí puedes finalizarla, cerrar ese día o eliminarla. Si la tarea ya empezó, se conserva su historial.",
  },
  {
    question: "No me llegan los recordatorios",
    answer:
      "Revisa en Perfil → Notificaciones que estén activadas y permitidas, y usa «Enviar notificación de prueba». La tarea debe tener activada la opción «¿Quieres notificación?». Se programan los próximos 14 días cada vez que abres la app.",
  },
  {
    question: "¿Puedo cambiar los colores de la app?",
    answer:
      "Sí. En Perfil → Apariencia eliges tema claro u oscuro y el color de acento.",
  },
  {
    question: "Olvidé mi contraseña",
    answer:
      "En la pantalla de inicio de sesión toca «¿Olvidaste tu contraseña?». Te enviaremos un correo con un enlace para crear una nueva.",
  },
];

export default function AyudaScreen() {
  const { colors } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Ayuda" />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-sm text-gray-300 mb-3"
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          Preguntas frecuentes
        </Text>

        <View className="gap-2">
          {FAQ.map((item, index) => {
            const open = openIndex === index;
            return (
              <View key={item.question} className="bg-slate-800 rounded-lg">
                <TouchableOpacity
                  className="px-4 py-3.5 flex-row items-center justify-between"
                  onPress={() => setOpenIndex(open ? null : index)}
                  activeOpacity={0.7}
                >
                  <Text
                    className="flex-1 pr-3 text-sm text-white"
                    style={{ fontFamily: "MomoTrustSans-Medium" }}
                  >
                    {item.question}
                  </Text>
                  <FontAwesomeIcon
                    icon={open ? faChevronUp : faChevronDown}
                    size={12}
                    color={colors.gray500}
                  />
                </TouchableOpacity>
                {open && (
                  <Text
                    className="px-4 pb-4 text-xs text-gray-300"
                    style={{ fontFamily: "MomoTrustSans-Regular", lineHeight: 18 }}
                  >
                    {item.answer}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {version && (
          <Text
            className="text-xs text-gray-500 text-center mt-8"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            Daily! versión {version}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
