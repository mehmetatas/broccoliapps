import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { clearAudioCache, getAudioCacheInfo } from "../hooks/audioCache";
import { usePurchase } from "../hooks/usePurchase";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export const SettingsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { restore, isLoading } = usePurchase();
  const [fileCount, setFileCount] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshCacheInfo = useCallback(async () => {
    const info = await getAudioCacheInfo();
    setFileCount(info.fileCount);
    setTotalBytes(info.totalBytes);
  }, []);

  useEffect(() => {
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    await clearAudioCache();
    await refreshCacheInfo();
    setIsDeleting(false);
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={[styles.cachePanel, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.cachePanelTitle, { color: colors.textPrimary }]}>Downloaded Files</Text>
            <Text style={[styles.cachePanelInfo, { color: colors.textSecondary }]}>
              {fileCount} {fileCount === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
            </Text>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: colors.border }]}
              onPress={handleDeleteAll}
              activeOpacity={0.7}
              disabled={isDeleting || fileCount === 0}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Trash2 size={16} color={fileCount === 0 ? colors.textSecondary : colors.textPrimary} />
                  <Text style={[styles.deleteButtonText, { color: fileCount === 0 ? colors.textSecondary : colors.textPrimary }]}>Delete All</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.restoreButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => restore()}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <RotateCcw size={18} color={colors.textPrimary} />
                <Text style={[styles.restoreText, { color: colors.textPrimary }]}>Restore Purchases</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  restoreText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  cachePanel: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cachePanelTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  cachePanelInfo: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    marginTop: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
});
