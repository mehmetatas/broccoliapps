import { cloneElement, isValidElement, type ReactElement, type ReactNode, useCallback, useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "./theme";

export type PillItem<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

export type PillsProps<T extends string> = {
  items: PillItem<T>[];
  selected: T;
  onSelect: (value: T) => void;
  transparent?: boolean;
};

export const Pills = <T extends string>({ items, selected, onSelect, transparent }: PillsProps<T>) => {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<PillItem<T>>>(null);

  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (userInteractedRef.current) {
      return;
    }
    const idx = items.findIndex((item) => item.value === selected);
    if (idx > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
      });
    }
  }, [items, selected]);

  const handleSelect = useCallback(
    (value: T, index: number) => {
      userInteractedRef.current = true;
      onSelect(value);
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [onSelect],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PillItem<T>; index: number }) => {
      const isSelected = item.value === selected;
      return (
        <TouchableOpacity
          style={[
            styles.pill,
            {
              backgroundColor: isSelected ? colors.accent : transparent ? "transparent" : colors.backgroundSecondary,
              borderColor: isSelected ? colors.accent : colors.border,
            },
          ]}
          onPress={() => handleSelect(item.value, index)}
          activeOpacity={0.7}
        >
          <View style={styles.pillContent}>
            {isSelected && isValidElement(item.icon) ? cloneElement(item.icon as ReactElement<{ color?: string }>, { color: "#ffffff" }) : item.icon}
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? "#ffffff" : colors.textPrimary,
                },
              ]}
            >
              {item.label}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selected, colors, handleSelect],
  );

  return (
    <FlatList
      ref={listRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.value}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onScrollToIndexFailed={(info) => {
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0.5 });
        });
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
});
