import { useTheme } from "@broccoliapps/mobile";
import { useCallback, useRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";

export type ProjectFilter = "all" | "active" | "pending" | "done" | "archived";

type FilterOption = {
  value: ProjectFilter;
  label: string;
};

const filterOptions: FilterOption[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

type Props = {
  selected: ProjectFilter;
  onSelect: (filter: ProjectFilter) => void;
};

export const FilterPills = ({ selected, onSelect }: Props) => {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<FilterOption>>(null);

  const handleSelect = useCallback(
    (filter: ProjectFilter, index: number) => {
      onSelect(filter);
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [onSelect],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FilterOption; index: number }) => {
      const isSelected = item.value === selected;
      return (
        <TouchableOpacity
          style={[
            styles.pill,
            {
              backgroundColor: isSelected ? colors.accent : colors.backgroundSecondary,
              borderColor: isSelected ? colors.accent : colors.border,
            },
          ]}
          onPress={() => handleSelect(item.value, index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillText,
              {
                color: isSelected ? "#ffffff" : colors.textSecondary,
              },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selected, colors, handleSelect],
  );

  return (
    <FlatList
      ref={listRef}
      data={filterOptions}
      renderItem={renderItem}
      keyExtractor={(item) => item.value}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
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
  pillText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
});
