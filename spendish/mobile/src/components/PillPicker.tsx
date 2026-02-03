import React, { useCallback, useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export type PillPickerProps = {
  items: Record<string, string>;
  selectedId: string;
  onSelect: (id: string) => void;
  small?: boolean;
};

export function PillPicker({ items, selectedId, onSelect, small = false }: PillPickerProps): React.JSX.Element {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const entries = Object.entries(items);
  const selectedIndex = entries.findIndex(([id]) => id === selectedId);

  // Scroll to selected item when selection changes
  useEffect(() => {
    if (selectedIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: selectedIndex,
        viewPosition: 0.5, // Center the item
        animated: true,
      });
    }
  }, [selectedIndex]);

  const pillStyle = small ? styles.pillSmall : styles.pill;
  const textStyle = small ? styles.pillTextSmall : styles.pillText;

  const renderItem = useCallback(
    ({ item }: { item: [string, string] }) => {
      const [id, label] = item;
      const isActive = id === selectedId;
      return (
        <TouchableOpacity
          style={[
            pillStyle,
            {
              backgroundColor: isActive ? theme.text : theme.surface,
            },
          ]}
          onPress={() => onSelect(id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              textStyle,
              {
                color: isActive ? theme.background : theme.textSecondary,
              },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedId, theme, pillStyle, textStyle, onSelect],
  );

  return (
    <FlatList
      ref={flatListRef}
      horizontal
      data={entries}
      renderItem={renderItem}
      keyExtractor={([id]) => id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onScrollToIndexFailed={(info) => {
        // Fallback: scroll to approximate position after a short delay
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            viewPosition: 0.5,
            animated: true,
          });
        }, 100);
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  separator: {
    width: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pillSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextSmall: {
    fontSize: 12,
    fontWeight: "500",
  },
});
