import { BottomModal, Toast, useTheme } from "@broccoliapps/mobile";
import { type ProjectSummaryDto, useProjects } from "@broccoliapps/tasquito-shared";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EllipsisVertical } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectListSkeleton } from "../components/ProjectCardSkeleton";
import { ProjectForm } from "../components/ProjectForm";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export const HomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const { projects, isLoading, error, limitError, clearLimitError, create, archive, refresh } = useProjects();

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

  const activeProjects = useMemo(() => {
    return projects.filter((project) => !project.isArchived);
  }, [projects]);

  const ListHeader = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tasquito</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} activeOpacity={0.7} style={styles.menuButton}>
          <EllipsisVertical size={24} color={colors.textMuted} />
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
    </View>
  );

  const ListEmpty = isLoading ? (
    <ProjectListSkeleton />
  ) : (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>No projects yet. Create one above to get started!</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList<ProjectSummaryDto>
          data={activeProjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })} onArchive={() => archive(item.id)} />
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
      <BottomModal visible={menuVisible} onClose={() => setMenuVisible(false)}>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate("ArchivedProjects");
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Archived Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate("Settings");
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </BottomModal>
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
  menuButton: {
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
  menuContainer: {
    paddingBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 17,
    fontFamily: "Nunito-Regular",
  },
});
