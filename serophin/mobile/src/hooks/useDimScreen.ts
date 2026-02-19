import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import ScreenBrightness from "react-native-screen-brightness";

const getBrightness = Platform.OS === "android" ? () => ScreenBrightness.getAppBrightness() : () => ScreenBrightness.getBrightness();

const setBrightness = Platform.OS === "android" ? (b: number) => ScreenBrightness.setAppBrightness(b) : (b: number) => ScreenBrightness.setBrightness(b);

const ANIMATION_DURATION = 1000;
const ANIMATION_STEPS = 100;

const animateBrightness = async (from: number, to: number) => {
  const step = (to - from) / ANIMATION_STEPS;
  const delay = ANIMATION_DURATION / ANIMATION_STEPS;
  for (let i = 1; i <= ANIMATION_STEPS; i++) {
    await new Promise<void>((res) => setTimeout(res, delay));
    await setBrightness(from + step * i);
  }
};

export const useDimScreen = (active: boolean, brightness = 0.1) => {
  const originalRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!active) {
      return;
    }

    cancelledRef.current = false;

    const dim = async () => {
      try {
        const current = await getBrightness();
        originalRef.current = current;
        if (cancelledRef.current) {
          return;
        }
        if (Platform.OS === "ios") {
          await animateBrightness(current, brightness);
        } else {
          await setBrightness(brightness);
        }
      } catch (e) {
        console.warn("useDimScreen: failed to dim", e);
      }
    };

    dim();

    return () => {
      cancelledRef.current = true;
      if (originalRef.current !== null) {
        const target = originalRef.current;
        originalRef.current = null;
        if (Platform.OS === "ios") {
          getBrightness()
            .then((current) => animateBrightness(current, target))
            .catch(() => {});
        } else {
          setBrightness(target).catch(() => {});
        }
      }
    };
  }, [active, brightness]);
};
