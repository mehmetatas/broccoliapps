import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Car,
  Check,
  CreditCard,
  Gift,
  Heart,
  Home,
  LucideIcon,
  PieChart,
  PiggyBank,
  Plane,
  Settings,
  ShoppingCart,
  Sparkles,
  Trash2,
  Tv,
  Utensils,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { getCategories } from "../storage/categories";
import {
  deleteSpendRecord,
  getRecentSpendRecords,
  saveSpendRecord,
} from "../storage/spendRecords";
import { useTheme } from "../theme/ThemeContext";
import { SpendRecord } from "../types/spendRecord";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const STEP_THRESHOLD = SCREEN_HEIGHT * 0.03;
const SWIPE_DELETE_THRESHOLD = SCREEN_WIDTH * 0.5;
const RECENT_SPENDS_LIMIT = 10;

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

function triggerHaptic() {
  ReactNativeHapticFeedback.trigger("selection", hapticOptions);
}

function triggerSuccessHaptic() {
  ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);
}

const SUCCESS_COLOR = "#4CAF50";

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${month} ${day}, ${weekday}`;
}

function getStepValue(amount: number): number {
  if (amount < 10) {
    return 1;
  }
  if (amount < 50) {
    return 2;
  }
  if (amount < 100) {
    return 5;
  }
  if (amount < 500) {
    return 10;
  }
  if (amount < 1000) {
    return 25;
  }
  if (amount < 5000) {
    return 50;
  }
  if (amount < 10000) {
    return 100;
  }
  return 1000;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Zap,
  ShoppingCart,
  Utensils,
  Car,
  Heart,
  Sparkles,
  Tv,
  CreditCard,
  PiggyBank,
  Plane,
  Gift,
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export function HomeScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [amount, setAmount] = useState(1);
  const [confirmedCategoryId, setConfirmedCategoryId] = useState<string | null>(
    null,
  );
  const [spendRecords, setSpendRecords] = useState<SpendRecord[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const amountRef = useRef(amount);
  amountRef.current = amount;

  const categories = getCategories();
  const categoriesById = Object.fromEntries(categories.map(c => [c.id, c]));

  useEffect(() => {
    setSpendRecords(getRecentSpendRecords());
  }, []);

  const handleCategoryPress = (categoryId: string) => {
    const date = getLocalDateString();
    const newRecord = saveSpendRecord({
      amount,
      category: categoryId,
      date,
    });

    setSpendRecords(prev => [newRecord, ...prev]);
    triggerSuccessHaptic();
    setConfirmedCategoryId(categoryId);

    setTimeout(() => {
      setConfirmedCategoryId(null);
    }, 1000);
  };

  const handleDeleteRecord = useCallback((record: SpendRecord) => {
    deleteSpendRecord(record);
    setSpendRecords(prev => prev.filter(r => r.id !== record.id));
    triggerHaptic();
    setTimeout(() => {
      setSpendRecords(getRecentSpendRecords());
    }, 100);
  }, []);

  const renderRightActions = useCallback(
    (record: SpendRecord) => (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => handleDeleteRecord(record)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    ),
    [handleDeleteRecord],
  );

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      lastPos.current = { x: 0, y: 0 };
    })
    .onUpdate(event => {
      const deltaX = event.translationX - lastPos.current.x;
      const deltaY = event.translationY - lastPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const thresholdsCrossed = Math.floor(distance / STEP_THRESHOLD);

      if (thresholdsCrossed > 0) {
        const scale = thresholdsCrossed * STEP_THRESHOLD / distance;
        lastPos.current.x += deltaX * scale;
        lastPos.current.y += deltaY * scale;

        for (let i = 0; i < thresholdsCrossed; i++) {
          const currentValue = amountRef.current;
          if (deltaY < 0) {
            // Moving up: increment
            const stepValue = getStepValue(currentValue);
            amountRef.current = currentValue + stepValue;
            setAmount(amountRef.current);
            triggerHaptic();
          } else if (currentValue > 1) {
            // Moving down: decrement (only if above $1)
            const stepValue = getStepValue(currentValue - 1);
            amountRef.current = Math.max(1, currentValue - stepValue);
            setAmount(amountRef.current);
            triggerHaptic();
          }
        }
      }
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={panGesture}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <View style={styles.amountRow}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Dashboard")}
            activeOpacity={0.7}
          >
            <PieChart size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.amount, { color: theme.text }]}>${amount}</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <Settings size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.spendTitle, { color: theme.text }]}>
          Recent Spends
        </Text>

        <ScrollView style={styles.spendList}>
          {spendRecords.slice(0, RECENT_SPENDS_LIMIT).map(record => {
            const category = categoriesById[record.category];
            const Icon = category ? ICON_MAP[category.icon] : null;
            return (
              <Animated.View
                key={record.id}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                layout={LinearTransition.springify()}
              >
                <ReanimatedSwipeable
                  renderRightActions={() => renderRightActions(record)}
                  onSwipeableOpen={() => handleDeleteRecord(record)}
                  overshootRight={false}
                  rightThreshold={SWIPE_DELETE_THRESHOLD}
                >
                  <View
                    style={[
                      styles.spendItem,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.spendIconContainer,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      {Icon && <Icon size={20} color={theme.text} />}
                    </View>
                    <View style={styles.spendInfo}>
                      <Text
                        style={[styles.spendCategory, { color: theme.text }]}
                      >
                        {category?.label ?? "Unknown"}
                      </Text>
                      <Text
                        style={[
                          styles.spendDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatDate(record.date)}
                      </Text>
                    </View>
                    <Text style={[styles.spendAmount, { color: theme.text }]}>
                      ${record.amount}
                    </Text>
                  </View>
                </ReanimatedSwipeable>
              </Animated.View>
            );
          })}
        </ScrollView>

        <View style={styles.categoriesContent}>
          <View style={styles.categoriesGrid}>
            {categories.map(({ id, label, icon }) => {
              const isConfirmed = confirmedCategoryId === id;
              const Icon = ICON_MAP[icon];
              const backgroundColor = isConfirmed
                ? SUCCESS_COLOR
                : theme.surface;
              const iconColor = isConfirmed ? "#FFFFFF" : theme.text;

              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.categoryButton, { backgroundColor }]}
                  onPress={() => handleCategoryPress(id)}
                  activeOpacity={0.7}
                >
                  {isConfirmed ?
                    <Check size={24} color={iconColor} />
                    :
                    Icon && <Icon size={24} color={iconColor} />
                  }
                  {!isConfirmed && (
                    <Text style={[styles.categoryLabel, { color: iconColor }]}>
                      {label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: "flex-start",
    justifyContent: "flex-start",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerButton: {
    padding: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: "300",
    textAlign: "center",
  },
  categoriesContent: {
    paddingHorizontal: 16,
    boxShadow: "0 0 10px 0 rgba(128, 128, 128, 0.5)",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "flex-start",
    marginBottom: 16,
  },
  categoryButton: {
    width: "31%",
    padding: 12,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  categoryLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  spendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  spendList: {
    paddingHorizontal: 16,
  },
  spendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  spendIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  spendInfo: {
    flex: 1,
  },
  spendCategory: {
    fontSize: 16,
  },
  spendDate: {
    fontSize: 12,
    marginTop: 2,
  },
  spendAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteActionContainer: {
    flex: 1,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
});
