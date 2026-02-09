import { Modal, useModal, useTheme } from "@broccoliapps/mobile";
import { type ProjectSummaryDto, useProjects } from "@broccoliapps/tasquito-shared";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProjectCard } from "../components/ProjectCard";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ArchivedProjects">;

export const ArchivedProjectsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const deleteModal = useModal<string>();
  const { projects, isLoading, unarchive, remove, refresh } = useProjects();

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

  const archivedProjects = useMemo(() => {
    return projects.filter((project) => project.isArchived);
  }, [projects]);

  const ListEmpty = isLoading ? null : (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>No archived projects.</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Archived Projects</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList<ProjectSummaryDto>
        data={archivedProjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
            onUnarchive={() => unarchive(item.id)}
            onDelete={() => deleteModal.open(item.id)}
          />
        )}
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
      />

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
