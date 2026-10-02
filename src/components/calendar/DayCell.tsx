import { DayCounts, toDateStr } from "@/lib/task-schedule";
import { Text, TouchableOpacity, View } from "react-native";

// Tonos suaves para no competir con el número del día.
const RED = "#e58b8b";
const GREEN = "#7fcf9f";
const BLUE = "#7ba7ee";
const COUNT_FONT_SIZE = 12;

function Indicator({
  color,
  count,
  onAccent,
}: {
  color: string;
  count: number;
  // El número se aclara cuando la celda está seleccionada (fondo morado).
  onAccent: boolean;
}) {
  return (
    <View className="flex-row items-center mx-1">
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <Text
        className={`ml-0.5 ${onAccent ? "text-white/80" : "text-gray-500"}`}
        // fontSize inline: la clase arbitraria `text-[Npx]` no se aplicaba y el
        // número salía al tamaño por defecto, recortado por el contenedor.
        style={{
          fontFamily: "MomoTrustSans-Medium",
          fontSize: COUNT_FONT_SIZE,
          lineHeight: COUNT_FONT_SIZE + 2,
        }}
      >
        {count}
      </Text>
    </View>
  );
}

interface DayCellProps {
  date: Date;
  counts: DayCounts;
  todayStr: string;
  selected: boolean;
  // Días de meses vecinos en la vista Mes.
  dimmed?: boolean;
  letter?: string;
  onPress: () => void;
}

export function DayCell({
  date,
  counts,
  todayStr,
  selected,
  dimmed = false,
  letter,
  onPress,
}: DayCellProps) {
  const day = toDateStr(date);
  const isToday = day === todayStr;
  const isFuture = day > todayStr;
  const rest = counts.total - counts.done;

  return (
    // El TouchableOpacity solo da el área táctil y la separación entre celdas;
    // el borde y las esquinas viven en el View interno.
    <TouchableOpacity
      className="flex-1 px-1 py-[19px]"
      style={{ opacity: dimmed ? 0.3 : 1 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className={`items-center py-2 rounded-2xl ${
          selected ? "bg-purple-500" : ""
        }`}
        style={{ minHeight: 58 }}
      >
        {letter && (
          <Text
            className={`text-xs mb-1 ${selected ? "text-white" : "text-gray-400"}`}
            style={{ fontFamily: "MomoTrustSans-Medium" }}
          >
            {letter}
          </Text>
        )}
        <View className="h-8 items-center justify-center">
          <Text
            className={
              selected
                ? "text-white"
                : isToday
                  ? "text-purple-400"
                  : "text-gray-100"
            }
            style={{ fontFamily: "MomoTrustSans-Medium", fontSize: 14 }}
          >
            {date.getDate()}
          </Text>
        </View>
        <View
          className="flex-row items-center justify-center mt-1"
          style={{ minHeight: 12 }}
        >
          {isFuture ? (
            counts.total > 0 && (
              <Indicator
                color={BLUE}
                count={counts.total}
                onAccent={selected}
              />
            )
          ) : (
            <>
              {rest > 0 && (
                <Indicator color={RED} count={rest} onAccent={selected} />
              )}
              {counts.done > 0 && (
                <Indicator
                  color={GREEN}
                  count={counts.done}
                  onAccent={selected}
                />
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
