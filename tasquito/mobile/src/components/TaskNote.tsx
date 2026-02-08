import { useTheme } from "@broccoliapps/mobile";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { Check, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTask } from "../hooks/useTask";

type TaskNoteProps = {
  taskId: string;
  note?: string;
  isArchived?: boolean;
  isDone: boolean;
  editRequested?: boolean;
  onEditStarted?: () => void;
};

export const TaskNote = ({ taskId, note, isArchived, isDone, editRequested, onEditStarted }: TaskNoteProps) => {
  const { colors } = useTheme();
  const { updateNote } = useTask(taskId);

  const canEditNote = !isArchived && !isDone;

  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState("");
  const noteInputRef = useRef<TextInput>(null);

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
          maxLength={LIMITS.MAX_TASK_NOTE_LENGTH}
          autoFocus
        />
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
    <TouchableOpacity onPress={handleNotePress} activeOpacity={canEditNote ? 0.7 : 1}>
      <Text style={[styles.note, { color: colors.textMuted }]}>{note}</Text>
    </TouchableOpacity>
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
});
