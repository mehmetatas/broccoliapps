import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

type AnimatedCellProps = {
  exiting: boolean;
  onExitDone: () => void;
  children: ReactElement;
  duration?: number;
};

export const AnimatedCell = ({ exiting, onExitDone, children, duration = 250 }: AnimatedCellProps) => {
  const progress = useRef(new Animated.Value(1)).current;
  const measuredHeight = useRef(0);
  const [collapsing, setCollapsing] = useState(false);

  useEffect(() => {
    if (exiting && !collapsing) {
      setCollapsing(true);
      Animated.timing(progress, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onExitDone();
        }
      });
    } else if (!exiting && collapsing) {
      setCollapsing(false);
      progress.setValue(1);
    }
  }, [exiting, collapsing, progress, onExitDone, duration]);

  return (
    <Animated.View
      onLayout={(e) => {
        if (!collapsing) {
          measuredHeight.current = e.nativeEvent.layout.height;
        }
      }}
      style={
        collapsing
          ? {
              height: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, measuredHeight.current],
              }),
              opacity: progress,
              overflow: "hidden" as const,
            }
          : undefined
      }
    >
      {children}
    </Animated.View>
  );
};
