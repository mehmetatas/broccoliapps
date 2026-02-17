// Placeholder audio references
// In production, replace with actual audio file imports

export const MEDITATION_AUDIO = {
  guided: {
    5: null, // require("../../assets/audio/meditation/guided-5.mp4")
    10: null,
    15: null,
    20: null,
    30: null,
    45: null,
    60: null,
  },
  unguided: null, // Unguided uses only background sounds
};

export const BREATHING_AUDIO = null; // Breathing uses programmatic timing, no audio needed

export const SLEEP_AUDIO: Record<string, null> = {
  rain: null,
  waves: null,
  forest: null,
  wind: null,
  fire: null,
  whitenoise: null,
  brownnoise: null,
  pinknoise: null,
};

export const BACKGROUND_AUDIO: Record<string, null> = {
  rain: null,
  waves: null,
  forest: null,
  wind: null,
  fire: null,
  birds: null,
  thunder: null,
};

export const COURSE_AUDIO: Record<string, null> = {};

// Generate course audio keys
for (let level = 1; level <= 3; level++) {
  for (let lesson = 1; lesson <= 10; lesson++) {
    COURSE_AUDIO[`${level}-${lesson}`] = null;
  }
}
