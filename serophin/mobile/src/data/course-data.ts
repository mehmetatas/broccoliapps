import type { CourseLessonDto } from "./types";

export const COURSE_LEVELS = [1, 2, 3] as const;
export const LESSONS_PER_LEVEL = 10;
export const LESSON_DURATION_MINUTES = 10;
export const COURSE_PRODUCT_ID = "com.broccoliapps.serophin.course";
export const COURSE_PRICE_USD = 9.99;

const levelTitles: Record<number, string> = {
  1: "Foundations",
  2: "Deepening Practice",
  3: "Advanced Awareness",
};

const levelDescriptions: Record<number, string> = {
  1: "Build a solid meditation foundation with guided sessions covering breath awareness, body scanning, and present-moment attention.",
  2: "Deepen your practice with longer sits, loving-kindness meditation, and techniques for working with difficult emotions.",
  3: "Explore advanced practices including open awareness, non-dual meditation, and integrating mindfulness into daily life.",
};

const lessonTitles: Record<number, string[]> = {
  1: [
    "Getting Started",
    "Breath Awareness",
    "Body Scan Basics",
    "Counting Breaths",
    "Observing Thoughts",
    "Sitting with Stillness",
    "Anchoring Attention",
    "Gentle Focus",
    "Letting Go",
    "Building Your Practice",
  ],
  2: [
    "Returning to the Breath",
    "Loving-Kindness Introduction",
    "Working with Restlessness",
    "Expanding Awareness",
    "Compassion Practice",
    "Noting Technique",
    "Emotional Awareness",
    "Equanimity",
    "Gratitude Meditation",
    "Deepening Stillness",
  ],
  3: [
    "Open Awareness",
    "Choiceless Attention",
    "Non-Dual Awareness",
    "Walking Meditation",
    "Everyday Mindfulness",
    "Working with Pain",
    "Insight Practice",
    "Surrender and Trust",
    "Integration",
    "The Ongoing Journey",
  ],
};

export const getCourseData = (): CourseLessonDto[] => {
  const lessons: CourseLessonDto[] = [];

  for (const level of COURSE_LEVELS) {
    const titles = lessonTitles[level] ?? [];
    for (let i = 0; i < LESSONS_PER_LEVEL; i++) {
      lessons.push({
        level,
        lesson: i + 1,
        title: titles[i] ?? `Lesson ${i + 1}`,
        description: levelDescriptions[level] ?? "",
        durationMinutes: LESSON_DURATION_MINUTES,
      });
    }
  }

  return lessons;
};

export const getLevelTitle = (level: number): string => levelTitles[level] ?? `Level ${level}`;
export const getLevelDescription = (level: number): string => levelDescriptions[level] ?? "";
