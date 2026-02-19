// Theme
export type Theme = "system" | "dark" | "light";

// Guidance Level (0 = silent, 1 = bell, 2 = gentle, 3 = guided)
export type GuidanceLevel = 0 | 1 | 2 | 3;

// Breathing Phases
export type BreathingPhase = "inhale" | "hold" | "exhale" | "holdAfter";

// Breathing Patterns
export type BreathingPattern = "4-7-8" | "box" | "4-4" | "4-6";

// Background Sound IDs
export type BackgroundSound = "none" | "ambient" | "piano" | "bowls" | "waves" | "rain" | "forest" | "brownnoise" | "pinknoise" | "whitenoise";

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
  sleepSound?: BackgroundSound;
  sleepDuration?: number; // minutes
};

// Course Lesson
export type CourseLessonDto = {
  level: number; // 1, 2, 3
  lesson: number; // 1-10
  title: string;
  description: string;
  durationMinutes: number;
};
