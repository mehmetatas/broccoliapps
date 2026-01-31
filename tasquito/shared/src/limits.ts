export const LIMITS = {
  MAX_ACTIVE_PROJECTS: 5,
  MAX_TASKS_PER_PROJECT: 30,
  MAX_SUBTASKS_PER_TASK: 5,
  MAX_PROJECT_NAME_LENGTH: 100,
  MAX_TASK_TITLE_LENGTH: 100,
  MAX_TASK_DESCRIPTION_LENGTH: 1000,
  MAX_SUBTASK_TITLE_LENGTH: 100,
} as const;

export const LIMIT_MESSAGES = {
  PROJECT:
    "You've reached 5 active projects. Your focus is a finite resource. Is there something you can archive to make room for this new idea?",
  TASK: "30 tasks in one project can get noisy. Before adding more, take a moment to see if any old tasks can be deleted.",
  SUBTASK:
    "If a task needs more than 5 subtasks, it is probably too big. Why not break it out into smaller tasks first?",
} as const;
