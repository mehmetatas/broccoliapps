import { CharacterLimitIndicator, useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Check, X } from "lucide-react-native";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Linking, type NativeSyntheticEvent, StyleSheet, Text, TextInput, type TextLayoutEventData, TouchableOpacity, View } from "react-native";
import InAppBrowser from "react-native-inappbrowser-reborn";
import { useTask } from "../hooks/useTask";

type TaskNoteProps = {
  taskId: string;
  note?: string;
  isArchived?: boolean;
  isDone: boolean;
  editRequested?: boolean;
  onEditStarted?: () => void;
};

const MAX_PREVIEW_LINES = 5;
const URL_REGEX = /https:\/\/\S+/g;
const TRAILING_PUNCT = /[.,)\]]+$/;

const openUrl = async (url: string, colors: { background: string; accent: string }) => {
  try {
    const available = await InAppBrowser.isAvailable();
    if (available) {
      await InAppBrowser.open(url, {
        dismissButtonStyle: "close",
        preferredBarTintColor: colors.background,
        preferredControlTintColor: colors.accent,
        readerMode: false,
        animated: true,
        modalPresentationStyle: "fullScreen",
        modalTransitionStyle: "coverVertical",
        modalEnabled: true,
        enableBarCollapsing: false,
      });
    } else {
      await Linking.openURL(url);
    }
  } catch {
    await Linking.openURL(url);
  }
};

export const TaskNote = ({ taskId, note, isArchived, isDone, editRequested, onEditStarted }: TaskNoteProps) => {
  const { colors } = useTheme();
  const { updateNote } = useTask(taskId);

  const linkifyNote = useCallback(
    (text: string): ReactNode[] => {
      const nodes: ReactNode[] = [];
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        let lastIndex = 0;
        for (const match of line.matchAll(URL_REGEX)) {
          const start = match.index;
          let url = match[0];
          const trailing = TRAILING_PUNCT.exec(url);
          if (trailing) {
            url = url.slice(0, -trailing[0].length);
          }
          if (start > lastIndex) {
            nodes.push(line.slice(lastIndex, start));
          }
          const linkUrl = url;
          nodes.push(
            <Text key={`${i}-${start}`} onPress={() => openUrl(linkUrl, colors)} style={{ color: colors.accent, textDecorationLine: "underline" }}>
              {url}
            </Text>,
          );
          lastIndex = start + url.length;
        }
        if (lastIndex < line.length) {
          nodes.push(line.slice(lastIndex));
        }
        if (i < lines.length - 1) {
          nodes.push("\n");
        }
      }
      return nodes;
    },
    [colors],
  );

  const canEditNote = !isArchived && !isDone;

  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [isTruncatable, setIsTruncatable] = useState(() => !!note && note.split("\n").length > MAX_PREVIEW_LINES);
  const noteInputRef = useRef<TextInput>(null);

  const handleTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (e.nativeEvent.lines.length >= MAX_PREVIEW_LINES) {
      setIsTruncatable(true);
    }
  }, []);

  // Reset state when note changes
  useEffect(() => {
    setExpanded(false);
    setIsTruncatable(!!note && note.split("\n").length > MAX_PREVIEW_LINES);
  }, [note]);

  // Allow parent (more menu) to trigger editing
  useEffect(() => {
    if (editRequested && canEditNote && !isEditing) {
      setIsEditing(true);
      setEditingNote(note ?? "");
      onEditStarted?.();
      setTimeout(() => noteInputRef.current?.focus(), 50);
    }
  }, [editRequested, canEditNote, isEditing, note, onEditStarted]);

  const handleNotePress = useCallback(() => {
    if (!canEditNote) {
      return;
    }
    setIsEditing(true);
    setEditingNote(note ?? "");
    setTimeout(() => noteInputRef.current?.focus(), 50);
  }, [canEditNote, note]);

  const handleNoteSubmit = useCallback(async () => {
    if (!isEditing) {
      return;
    }
    const trimmed = editingNote.trim();
    if (trimmed.length > LIMITS.MAX_TASK_NOTE_LENGTH) {
      return;
    }
    setIsEditing(false);
    setEditingNote("");

    if (trimmed !== (note ?? "")) {
      await updateNote(trimmed);
    }
  }, [isEditing, editingNote, note, updateNote]);

  const handleNoteDiscard = useCallback(() => {
    setIsEditing(false);
    setEditingNote("");
  }, []);

  if (!note && !isEditing) {
    return null;
  }

  if (isEditing) {
    return (
      <View style={styles.noteEditContainer}>
        <TextInput
          ref={noteInputRef}
          style={[styles.noteInput, { color: colors.textMuted }]}
          value={editingNote}
          onChangeText={setEditingNote}
          placeholder="Add note"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          maxLength={Math.floor(LIMITS.MAX_TASK_NOTE_LENGTH * 1.5)}
          autoFocus
        />
        <CharacterLimitIndicator textLength={editingNote.length} softLimit={LIMITS.MAX_TASK_NOTE_LENGTH} />
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={handleNoteDiscard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNoteSubmit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Check size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text
        style={[styles.note, { color: colors.textMuted }]}
        numberOfLines={!expanded ? MAX_PREVIEW_LINES : undefined}
        onTextLayout={!expanded ? handleTextLayout : undefined}
        onPress={canEditNote ? handleNotePress : undefined}
      >
        {linkifyNote(note ?? "")}
      </Text>
      {isTruncatable && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
          <Text style={[styles.toggleText, { color: colors.textMuted }]}>{expanded ? "Show less" : "Show more"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  note: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    lineHeight: 20,
  },
  noteEditContainer: {
    gap: 8,
  },
  noteInput: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    marginTop: 4,
  },
});
