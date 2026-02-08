import { Modal, Toast, useModal, useTheme } from "@broccoliapps/mobile";
import { type ProjectSummaryDto, useProjects } from "@broccoliapps/tasquito-shared";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Settings } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const deleteModal = useModal<string>();
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

      {limitError && <Toast variant="warning" message={limitError} onDismiss={clearLimitError} />}

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList<ProjectSummaryDto>
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
              onArchive={!item.isArchived ? () => archive(item.id) : undefined}
              onDelete={item.isArchived ? () => deleteModal.open(item.id) : undefined}
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
      <Modal
        visible={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Delete Project"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          remove(deleteModal.data!);
          deleteModal.close();
        }}
      >
        <Text style={[styles.modalMessage, { color: colors.textPrimary }]}>This action cannot be undone. All tasks will be permanently deleted.</Text>
      </Modal>
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
  modalMessage: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    lineHeight: 22,
  },
});
