import { useAuth, useTheme } from "@broccoliapps/mobile";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { useProjects } from "@broccoliapps/tasquito-shared/hooks";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FilterPills, type ProjectFilter } from "../components/FilterPills";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectListSkeleton } from "../components/ProjectCardSkeleton";
import { ProjectForm } from "../components/ProjectForm";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const getProjectStatus = (project: ProjectSummaryDto): "pending" | "active" | "done" | "archived" => {
  if (project.isArchived) {
    return "archived";
  }
  if (project.totalTaskCount === 0) {
    return "pending";
  }
  if (project.openTaskCount === 0) {
    return "done";
  }
  return "active";
};

const emptyMessages: Record<ProjectFilter, string> = {
  all: "No projects yet. Create one above to get started!",
  active: "No active projects.",
  pending: "No pending projects.",
  done: "No completed projects.",
  archived: "No archived projects.",
};

export const HomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const [filter, setFilter] = useState<ProjectFilter>("all");
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
      const status = getProjectStatus(project);
      if (filter === "all") {
        return status !== "archived";
      }
      return status === filter;
    });
  }, [projects, filter]);

  const ListHeader = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Projects</Text>
        <TouchableOpacity onPress={() => logout()} activeOpacity={0.7}>
          <Text style={[styles.signOutText, { color: colors.textMuted }]}>Sign Out</Text>
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
              onDelete={item.isArchived ? () => remove(item.id) : undefined}
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
  signOutText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
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
