import { useState } from "preact/hooks";
import { Button } from "./Button";
import { Input } from "./Input";

type TaskFormProps = {
  onSubmit: (title: string) => Promise<void>;
};

export const TaskForm = ({ onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      setTitle("");
    } catch (err) {
      setError("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex gap-3">
      <div class="flex-1">
        <Input
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onInput={(e) => {
            setTitle((e.target as HTMLInputElement).value);
            setError(null);
          }}
          disabled={isSubmitting}
          error={error ?? undefined}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !title.trim()}>
        {isSubmitting ? "Adding..." : "Add Task"}
      </Button>
    </form>
  );
};
