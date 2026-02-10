export const LIMITS = {
  MAX_ACTIVE_PROJECTS: 5,
  MAX_PROJECTS: 25,
  MAX_OPEN_TASKS_PER_PROJECT: 10,
  MAX_TASKS_PER_PROJECT: 50,
  MAX_OPEN_SUBTASKS_PER_TASK: 5,
  MAX_SUBTASKS_PER_TASK: 25,
  MAX_PROJECT_NAME_LENGTH: 30,
  MAX_TASK_TITLE_LENGTH: 60,
  MAX_SUBTASK_TITLE_LENGTH: 60,
  MAX_TASK_NOTE_LENGTH: 500,
  ARCHIVE_TTL_DAYS: 14,
} as const;

export const LIMIT_MESSAGES = {
  ACTIVE_PROJECT: `You've hit ${LIMITS.MAX_ACTIVE_PROJECTS} active projects — that's a full plate! Consider archiving one to make space for this new idea.`,
  MAX_PROJECT: `That's ${LIMITS.MAX_PROJECTS} projects! To keep things fresh, try removing some you're done with.`,
  OPEN_TASK: `${LIMITS.MAX_OPEN_TASKS_PER_PROJECT} open tasks is a lot to juggle. Knock a few out or let go of ones that no longer matter.`,
  MAX_TASK: `You've hit ${LIMITS.MAX_TASKS_PER_PROJECT} tasks in this project. Clear out some old ones to make room for what matters now.`,
  OPEN_SUBTASK: `More than ${LIMITS.MAX_OPEN_SUBTASKS_PER_TASK} open subtasks? This task might be bigger than it looks. Finish some up or split it into smaller tasks.`,
  MAX_SUBTASK: `That's ${LIMITS.MAX_SUBTASKS_PER_TASK} subtasks — things are getting detailed! Remove some old ones to keep this manageable.`,
} as const;
