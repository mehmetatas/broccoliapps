// Theme
export type Theme = "system" | "dark" | "light";

// Guidance Level (0 = none, 1 = low, 2 = medium, 3 = high, 4 = full)
export type GuidanceLevel = 0 | 1 | 2 | 3 | 4;

// Breathing Patterns
export type BreathingPattern = "4-7-8" | "box" | "4-4" | "4-6";

// Background Sound IDs
export type BackgroundSound = "none" | "rain" | "waves" | "forest" | "wind" | "fire" | "birds" | "thunder";

// Sleep Sound IDs
export type SleepSound = "rain" | "waves" | "forest" | "wind" | "fire" | "whitenoise" | "brownnoise" | "pinknoise";

// User Preferences
export type PreferencesDto = {
  guidanceLevel?: GuidanceLevel;
  meditationDuration?: number; // minutes
  meditationSound?: BackgroundSound;
  meditationHaptics?: boolean;
  breathingPattern?: BreathingPattern;
  breathingDuration?: number; // minutes
  breathingSound?: BackgroundSound;
  breathingHaptics?: boolean;
  sleepSound?: SleepSound;
  sleepDuration?: number; // minutes
  sleepBackgroundSound?: BackgroundSound;
};

// Course Lesson
export type CourseLessonDto = {
  level: number; // 1, 2, 3
  lesson: number; // 1-10
  title: string;
  description: string;
  durationMinutes: number;
};
