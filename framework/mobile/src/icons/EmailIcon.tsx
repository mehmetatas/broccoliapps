import Svg, { Path, Rect } from "react-native-svg";

type EmailIconProps = {
  size?: number;
  color?: string;
};

export const EmailIcon = ({ size = 20, color = "currentColor" }: EmailIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Rect x={2} y={4} width={20} height={16} rx={2} />
      <Path d="M22 7L13.03 12.7a1.94 1.94 0 01-2.06 0L2 7" />
    </Svg>
  );
};
