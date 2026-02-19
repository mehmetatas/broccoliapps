import { useKeepAwake } from "@sayem314/react-native-keep-awake";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "../hooks/useSerophinTheme";

const KeepAwakeActivator = () => {
  useKeepAwake();
  return null;
};

type Props = {
  hapticsEnabled: boolean;
};

export const KeepAwakeNotice = ({ hapticsEnabled }: Props) => {
  const { colors } = useTheme();

  if (!hapticsEnabled) {
    return null;
  }

  return (
    <>
      <KeepAwakeActivator />
      <Text style={[styles.notice, { color: colors.textPrimary }]}>Keep screen unlocked for haptic feedback</Text>
    </>
  );
};

const styles = StyleSheet.create({
  notice: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    marginTop: 12,
  },
});
