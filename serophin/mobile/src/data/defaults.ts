import type { BackgroundSound, BreathingPattern, GuidanceLevel } from "./types";

export const GUIDANCE_LEVELS: { value: GuidanceLevel; label: string }[] = [
  { value: 0, label: "Silent" },
  { value: 1, label: "Bell" },
  { value: 2, label: "Gentle" },
  { value: 3, label: "Guided" },
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
    duration: 3, // minutes
    sound: "none" as BackgroundSound,
    haptics: false,
  },
  sleep: {
    sound: "brownnoise" as BackgroundSound,
    duration: 60, // minutes
  },
} as const;

export const DURATION_OPTIONS = {
  meditation: [5, 10, 15, 20, 30, 45, 60],
  breathing: [1, 3, 5, 10],
  sleep: [30, 60, 120, 0],
} as const;

export const BREATHING_PATTERNS: Record<BreathingPattern, { inhale: number; hold: number; exhale: number; holdAfter: number; label: string }> = {
  "4-7-8": { inhale: 4, hold: 7, exhale: 8, holdAfter: 0, label: "Relaxing" },
  box: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4, label: "Box Breathing" },
  "4-4": { inhale: 4, hold: 0, exhale: 4, holdAfter: 0, label: "Calming" },
  "4-6": { inhale: 4, hold: 0, exhale: 6, holdAfter: 0, label: "Balancing" },
};

export const BACKGROUND_SOUNDS: Record<BackgroundSound, string> = {
  none: "None",
  ambient: "Ambient",
  piano: "Piano",
  bowls: "Singing Bowls",
  waves: "Waves",
  rain: "Rain",
  forest: "Forest",
  brownnoise: "Brown Noise",
  pinknoise: "Pink Noise",
  whitenoise: "White Noise",
};

const { none: _, ...sleepSounds } = BACKGROUND_SOUNDS;
export const SLEEP_SOUNDS = sleepSounds;

const { brownnoise: _b, pinknoise: _p, whitenoise: _w, ...meditationSounds } = BACKGROUND_SOUNDS;
export const MEDITATION_SOUNDS = meditationSounds;
