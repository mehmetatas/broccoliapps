import type { BackgroundSound, BreathingPattern, GuidanceLevel, SleepSound } from "./types";

export const GUIDANCE_LEVELS: { value: GuidanceLevel; label: string }[] = [
  { value: 0, label: "None" },
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
  { value: 4, label: "Full" },
];

export const DEFAULTS = {
  meditation: {
    guidanceLevel: 3 as GuidanceLevel, // High
    duration: 10, // minutes
    sound: "none" as BackgroundSound,
    haptics: true,
  },
  breathing: {
    pattern: "4-7-8" as BreathingPattern,
    duration: 5, // minutes
    sound: "none" as BackgroundSound,
    haptics: true,
  },
  sleep: {
    sound: "rain" as SleepSound,
    duration: 30, // minutes
    backgroundSound: "none" as BackgroundSound,
  },
} as const;

export const DURATION_OPTIONS = {
  meditation: [5, 10, 15, 20, 30, 45, 60],
  breathing: [3, 5, 10, 15, 20],
  sleep: [15, 30, 45, 60, 90, 120],
} as const;

export const BREATHING_PATTERNS: Record<BreathingPattern, { inhale: number; hold: number; exhale: number; holdAfter: number; label: string }> = {
  "4-7-8": { inhale: 4, hold: 7, exhale: 8, holdAfter: 0, label: "4-7-8 Relaxing" },
  box: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4, label: "Box Breathing" },
  "4-4": { inhale: 4, hold: 0, exhale: 4, holdAfter: 0, label: "4-4 Calming" },
  "4-6": { inhale: 4, hold: 0, exhale: 6, holdAfter: 0, label: "4-6 Balancing" },
};

export const BACKGROUND_SOUNDS: Record<BackgroundSound, string> = {
  none: "None",
  rain: "Rain",
  waves: "Ocean Waves",
  forest: "Forest",
  wind: "Wind",
  fire: "Fireplace",
  birds: "Birds",
  thunder: "Thunder",
};

export const SLEEP_SOUNDS: Record<SleepSound, string> = {
  rain: "Rain",
  waves: "Ocean Waves",
  forest: "Forest",
  wind: "Wind",
  fire: "Fireplace",
  whitenoise: "White Noise",
  brownnoise: "Brown Noise",
  pinknoise: "Pink Noise",
};
