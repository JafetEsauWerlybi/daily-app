import { hexToHsv, hsvToHex } from "@/lib/theme";
import { useMemo, useRef } from "react";
import { PanResponder, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

const WEDGES = 72; // 5° por cuña
// Radio mínimo (fracción) para no poder elegir un casi-blanco como acento.
const MIN_RADIUS = 0.25;
const MARKER_RADIUS = 11;

interface ColorWheelProps {
  size?: number;
  value: string; // #RRGGBB
  onChange: (hex: string) => void;
  // Avisa cuando el dedo toca / suelta la rueda (para frenar el scroll padre).
  onInteraction?: (active: boolean) => void;
}

// Rueda de color: el ángulo es el matiz y la distancia al centro la saturación
// (centro = blanco). Se dibuja con cuñas de matiz + un degradado radial blanco.
export function ColorWheel({
  size = 240,
  value,
  onChange,
  onInteraction,
}: ColorWheelProps) {
  const radius = size / 2;
  const wheelRadius = radius - MARKER_RADIUS - 2;

  const wedges = useMemo(() => {
    const step = 360 / WEDGES;
    return Array.from({ length: WEDGES }, (_, i) => {
      // Un poco de solape (+0.6°) para que no se vean hilos entre cuñas.
      const a1 = (i * step * Math.PI) / 180;
      const a2 = (((i + 1) * step + 0.6) * Math.PI) / 180;
      const x1 = radius + wheelRadius * Math.cos(a1);
      const y1 = radius + wheelRadius * Math.sin(a1);
      const x2 = radius + wheelRadius * Math.cos(a2);
      const y2 = radius + wheelRadius * Math.sin(a2);
      return {
        key: i,
        d: `M ${radius} ${radius} L ${x1} ${y1} A ${wheelRadius} ${wheelRadius} 0 0 1 ${x2} ${y2} Z`,
        fill: hsvToHex(i * step + step / 2, 1, 1),
      };
    });
  }, [radius, wheelRadius]);

  // Siempre la última versión de los callbacks (el PanResponder se crea una vez).
  const handlers = useRef({ onChange, onInteraction });
  handlers.current = { onChange, onInteraction };

  const pick = (x: number, y: number) => {
    const dx = x - radius;
    const dy = y - radius;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy) / wheelRadius, 1);
    const s = Math.max(dist, MIN_RADIUS);
    handlers.current.onChange(hsvToHex(angle, s, 1));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        handlers.current.onInteraction?.(true);
        pick(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderMove: (e) => {
        pick(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderRelease: () => handlers.current.onInteraction?.(false),
      onPanResponderTerminate: () => handlers.current.onInteraction?.(false),
    }),
  ).current;

  const { h, s } = hexToHsv(value);
  const markerAngle = (h * Math.PI) / 180;
  const markerDist = Math.max(s, MIN_RADIUS) * wheelRadius;
  const mx = radius + markerDist * Math.cos(markerAngle);
  const my = radius + markerDist * Math.sin(markerAngle);

  return (
    <View
      style={{ width: size, height: size }}
      {...panResponder.panHandlers}
      accessibilityLabel="Rueda de color"
    >
      {/* El SVG no recibe toques: así locationX/Y son siempre del contenedor. */}
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          <RadialGradient
            id="fade"
            cx={radius}
            cy={radius}
            r={wheelRadius}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {wedges.map((w) => (
          <Path key={w.key} d={w.d} fill={w.fill} />
        ))}
        <Circle cx={radius} cy={radius} r={wheelRadius} fill="url(#fade)" />
        <Circle
          cx={mx}
          cy={my}
          r={MARKER_RADIUS}
          fill={value}
          stroke="#ffffff"
          strokeWidth={3}
        />
        <Circle
          cx={mx}
          cy={my}
          r={MARKER_RADIUS + 1.5}
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}
