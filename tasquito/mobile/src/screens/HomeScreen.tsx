import { useTheme } from "@broccoliapps/mobile";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { useProjects } from "@broccoliapps/tasquito-shared/hooks";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Settings } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FilterPills, type ProjectFilter } from "../components/FilterPills";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectListSkeleton } from "../components/ProjectCardSkeleton";
import { ProjectForm } from "../components/ProjectForm";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const emptyMessages: Record<ProjectFilter, string> = {
  active: "No projects yet. Create one above to get started!",
  archived: "No archived projects.",
};

export const HomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<ProjectFilter>("active");
  const { projects, isLoading, error, limitError, clearLimitError, create, archive, remove, refresh } = useProjects();

  const [isManualRefresh, setIsManualRefresh] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsManualRefresh(false);
    }
  }, [isLoading]);

  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (filter === "active") {
        return !project.isArchived;
      }
      return project.isArchived;
    });
  }, [projects, filter]);

  const ListHeader = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Projects</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")} activeOpacity={0.7} style={styles.settingsButton}>
          <Settings size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ProjectForm
        onSubmit={async (name) => {
          const project = await create(name);
          navigation.navigate("ProjectDetail", { projectId: project.id });
        }}
      />

      {limitError && (
        <View style={[styles.banner, { backgroundColor: "#fef3c7", borderColor: "#fbbf24" }]}>
          <Text style={[styles.bannerText, { color: "#92400e" }]}>{limitError}</Text>
          <TouchableOpacity onPress={clearLimitError}>
            <Text style={[styles.dismissText, { color: "#b45309" }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <FilterPills selected={filter} onSelect={setFilter} />
    </View>
  );

  const ListEmpty = isLoading ? (
    <ProjectListSkeleton />
  ) : (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{emptyMessages[filter]}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList<ProjectSummaryDto>
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
              onArchive={!item.isArchived ? () => archive(item.id) : undefined}
              onDelete={
                item.isArchived
                  ? () => {
                      Alert.alert("Delete Project", "This action cannot be undone. All tasks will be permanently deleted.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
                      ]);
                    }
                  : undefined
              }
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefresh}
              onRefresh={() => {
                setIsManualRefresh(true);
                refresh();
              }}
              tintColor={colors.activityIndicator}
            />
          }
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito-Bold",
  },
  settingsButton: {
    padding: 4,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  dismissText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
});
