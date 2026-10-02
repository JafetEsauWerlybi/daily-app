import { WEEKDAY_LETTERS } from "@/constants/dates";
import { DayCounts, toDateStr } from "@/lib/task-schedule";
import { View } from "react-native";
import { DayCell } from "./DayCell";

interface WeekStripProps {
  days: Date[];
  getCounts: (date: Date) => DayCounts;
  selectedStr: string;
  todayStr: string;
  onSelect: (date: Date) => void;
}

export function WeekStrip({
  days,
  getCounts,
  selectedStr,
  todayStr,
  onSelect,
}: WeekStripProps) {
  return (
    <View className="flex-row px-1">
      {days.map((date, i) => (
        <DayCell
          key={toDateStr(date)}
          date={date}
          letter={WEEKDAY_LETTERS[i]}
          counts={getCounts(date)}
          todayStr={todayStr}
          selected={toDateStr(date) === selectedStr}
          onPress={() => onSelect(date)}
        />
      ))}
    </View>
  );
}
