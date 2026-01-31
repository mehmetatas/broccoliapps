import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useState } from "preact/hooks";
import { Button } from "./Button";
import { Input } from "./Input";

type ProjectFormProps = {
  onSubmit: (name: string) => Promise<unknown>;
};

export const ProjectForm = ({ onSubmit }: ProjectFormProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName("");
    } catch (err) {
      setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex gap-3">
      <div class="flex-1">
        <Input
          type="text"
          placeholder="New project name"
          value={name}
          maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
          onInput={(e) => {
            setName((e.target as HTMLInputElement).value);
            setError(null);
          }}
          disabled={isSubmitting}
          error={error ?? undefined}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !name.trim()}>
        {isSubmitting ? "Creating..." : "Create"}
      </Button>
    </form>
  );
};
