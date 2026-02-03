import { random } from "@broccoliapps/shared";
import { generateKeyBetween } from "fractional-indexing";
import { projects } from "./projects";
import { tasks } from "./tasks";

export async function initializeNewUser(userId: string): Promise<void> {
  const now = Date.now();
  const projectId = random.id();

  // Create active tutorial project
  await projects.put({
    userId,
    id: projectId,
    name: "Learn to use Tasquito",
    createdAt: now,
    updatedAt: now,
  });

  // Create tasks with subtasks using generateKeyBetween for sortOrder
  const templateTasks = [
    {
      title: "Welcome to Tasquito!",
      status: "done" as const,
      subtasks: ["This is what a completed task looks like"],
    },
    {
      title: "Create tasks",
      status: "todo" as const,
      subtasks: ["Type a title and press Enter for quick entry", "Click the expand button for description & due date"],
    },
    {
      title: "Organize with subtasks",
      status: "todo" as const,
      subtasks: ["Click the pencil icon to edit a task", "Add subtasks to break down work"],
    },
    {
      title: "Archive when done",
      status: "todo" as const,
      subtasks: ["Click the archive icon in the header", "Find archived projects in the Archived filter"],
    },
  ];

  let prevTaskOrder: string | null = null;
  for (const template of templateTasks) {
    const taskId = random.id();
    const taskOrder = generateKeyBetween(prevTaskOrder, null);

    await tasks.put({
      userId,
      projectId,
      id: taskId,
      title: template.title,
      status: template.status,
      sortOrder: taskOrder,
      createdAt: now,
      updatedAt: now,
    });

    let prevSubtaskOrder: string | null = null;
    for (const subtaskTitle of template.subtasks) {
      const subtaskOrder = generateKeyBetween(prevSubtaskOrder, null);
      await tasks.put({
        userId,
        projectId,
        id: random.id(),
        parentId: taskId,
        title: subtaskTitle,
        status: "todo",
        sortOrder: subtaskOrder,
        createdAt: now,
        updatedAt: now,
      });
      prevSubtaskOrder = subtaskOrder;
    }
    prevTaskOrder = taskOrder;
  }
}
