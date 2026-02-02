import {
  Car,
  CreditCard,
  Gift,
  Heart,
  Home,
  LucideIcon,
  PiggyBank,
  Plane,
  ShoppingCart,
  Sparkles,
  Trash2,
  Tv,
  Utensils,
  Zap,
} from "lucide-react-native";
import React, { useCallback } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { getCategories } from "../storage/categories";
import { useTheme } from "../theme/ThemeContext";
import { SpendRecord } from "../types/spendRecord";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_DELETE_THRESHOLD = SCREEN_WIDTH * 0.5;

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

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${month} ${day}, ${weekday}`;
}

interface SpendRecordItemProps {
  record: SpendRecord;
  onDelete: (record: SpendRecord) => void;
}

export function SpendRecordItem({
  record,
  onDelete,
}: SpendRecordItemProps): React.JSX.Element {
  const { theme } = useTheme();
  const categories = getCategories();
  const categoriesById = Object.fromEntries(categories.map(c => [c.id, c]));
  const category = categoriesById[record.category];
  const Icon = category ? ICON_MAP[category.icon] : null;

  const renderRightActions = useCallback(
    () => (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => onDelete(record)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    ),
    [onDelete, record],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.springify()}
    >
      <ReanimatedSwipeable
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => onDelete(record)}
        overshootRight={false}
        rightThreshold={SWIPE_DELETE_THRESHOLD}
      >
        <View style={[styles.spendItem, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.spendIconContainer,
              { backgroundColor: theme.background },
            ]}
          >
            {Icon && <Icon size={20} color={theme.text} />}
          </View>
          <View style={styles.spendInfo}>
            <Text style={[styles.spendCategory, { color: theme.text }]}>
              {category?.label ?? "Unknown"}
            </Text>
            <Text style={[styles.spendDate, { color: theme.textSecondary }]}>
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
}

const styles = StyleSheet.create({
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
