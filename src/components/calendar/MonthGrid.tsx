import { WEEKDAY_LETTERS } from "@/constants/dates";
import { DayCounts, MonthCell, toDateStr } from "@/lib/task-schedule";
import { useRef } from "react";
import { PanResponder, Text, View } from "react-native";
import { DayCell } from "./DayCell";

const SWIPE_DISTANCE = 50;

interface MonthGridProps {
  cells: MonthCell[]; // semanas completas (múltiplo de 7)
  getCounts: (date: Date) => DayCounts;
  selectedStr: string;
  todayStr: string;
  onSelect: (cell: MonthCell) => void;
  // 1 = mes siguiente (deslizar a la izquierda), -1 = mes anterior.
  onSwipe: (direction: 1 | -1) => void;
}

export function MonthGrid({
  cells,
  getCounts,
  selectedStr,
  todayStr,
  onSelect,
  onSwipe,
}: MonthGridProps) {
  // El PanResponder se crea una vez; el ref evita closures viejas.
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  const panResponder = useRef(
    PanResponder.create({
      // Solo toma el gesto si es claramente horizontal, para no pelear con taps/scroll.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderRelease: (_, g) => {
        if (g.dx <= -SWIPE_DISTANCE) onSwipeRef.current(1);
        else if (g.dx >= SWIPE_DISTANCE) onSwipeRef.current(-1);
      },
    }),
  ).current;

  const rows = Array.from({ length: cells.length / 7 }, (_, r) =>
    cells.slice(r * 7, r * 7 + 7),
  );

  return (
    <View className="px-2" {...panResponder.panHandlers}>
      <View className="flex-row mb-1">
        {WEEKDAY_LETTERS.map((letter, i) => (
          <View key={i} className="flex-1 items-center">
            <Text
              className="text-xs text-gray-400"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              {letter}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} className="flex-row">
          {row.map((cell) => (
            <DayCell
              key={toDateStr(cell.date)}
              date={cell.date}
              counts={getCounts(cell.date)}
              todayStr={todayStr}
              selected={toDateStr(cell.date) === selectedStr}
              dimmed={!cell.inMonth}
              onPress={() => onSelect(cell)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
