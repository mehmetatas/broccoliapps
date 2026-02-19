import { useCallback, useEffect, useRef } from "react";
import BackgroundTimer from "react-native-background-timer";
import Sound from "react-native-sound";
import type { BackgroundSound } from "../data/types";
import { ensureAudioFile } from "./audioCache";

Sound.setCategory("Playback");

const AUDIO_DURATION = 300; // 5 minutes in seconds
const CROSSFADE_DURATION = 20; // seconds
const SILENCE_CROSSFADE_DURATION = 1; // seconds
const MAX_FADEOUT_DURATION = 30; // seconds
const MIN_FADEOUT_DURATION = 10; // seconds
const TICK_MS = 100;
const DUCK_STEPS = 8; // ~800ms transition
const DUCK_TARGET = 0.25;
const UNDUCK_TARGET = 0.5;

const FILE_MAP: Record<Exclude<BackgroundSound, "none">, string> = {
  ambient: "ambient.m4a",
  piano: "piano.m4a",
  bowls: "bowls.m4a",
  waves: "waves.m4a",
  rain: "rain.m4a",
  forest: "forest.m4a",
  brownnoise: "brownnoise.m4a",
  pinknoise: "pinknoise.m4a",
  whitenoise: "whitenoise.m4a",
};

const ensureDownloaded = (soundId: Exclude<BackgroundSound, "none">) => ensureAudioFile(FILE_MAP[soundId]);

const createPlayer = (source: string): Promise<Sound> =>
  new Promise((resolve, reject) => {
    const player = new Sound(source, "", (error: unknown) => {
      if (error) {
        reject(error);
      } else {
        resolve(player);
      }
    });
  });

const stopAndRelease = (player: Sound | null) => {
  if (player) {
    player.stop();
    player.release();
  }
};

type Options = {
  sound: BackgroundSound;
  isActive: boolean;
  durationMinutes: number;
};

export const useBackgroundSound = ({ sound, isActive, durationMinutes }: Options) => {
  const fadeoutSeconds = Math.min(MAX_FADEOUT_DURATION, Math.max(MIN_FADEOUT_DURATION, Math.round(durationMinutes * 60 * 0.1))); // 10% of duration, min 10s, max 30s

  const previewPlayerRef = useRef<Sound | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewIdRef = useRef(0);

  const currentPlayerRef = useRef<Sound | null>(null);
  const nextPlayerRef = useRef<Sound | null>(null);
  const crossfadeTimerRef = useRef<number | null>(null);
  const crossfadeScheduleRef = useRef<number | null>(null);
  const fadeoutTimerRef = useRef<number | null>(null);
  const fadeoutScheduleRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);

  // Ducking: smoothly reduce background volume when voice guidance plays
  const duckMultiplierRef = useRef(1.0);
  const duckTimerRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (previewFadeRef.current) {
      clearInterval(previewFadeRef.current);
      previewFadeRef.current = null;
    }
    if (crossfadeTimerRef.current !== null) {
      BackgroundTimer.clearInterval(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }
    if (crossfadeScheduleRef.current !== null) {
      BackgroundTimer.clearTimeout(crossfadeScheduleRef.current);
      crossfadeScheduleRef.current = null;
    }
    if (fadeoutTimerRef.current !== null) {
      BackgroundTimer.clearInterval(fadeoutTimerRef.current);
      fadeoutTimerRef.current = null;
    }
    if (fadeoutScheduleRef.current !== null) {
      BackgroundTimer.clearTimeout(fadeoutScheduleRef.current);
      fadeoutScheduleRef.current = null;
    }
    if (duckTimerRef.current !== null) {
      BackgroundTimer.clearInterval(duckTimerRef.current);
      duckTimerRef.current = null;
    }
  }, []);

  const releaseAllPlayers = useCallback(() => {
    stopAndRelease(previewPlayerRef.current);
    previewPlayerRef.current = null;
    stopAndRelease(currentPlayerRef.current);
    currentPlayerRef.current = null;
    stopAndRelease(nextPlayerRef.current);
    nextPlayerRef.current = null;
  }, []);

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    clearAllTimers();
    releaseAllPlayers();
    duckMultiplierRef.current = 1.0;
    BackgroundTimer.stop();
  }, [clearAllTimers, releaseAllPlayers]);

  // Ducking API
  const animateDuck = useCallback((target: number) => {
    if (duckTimerRef.current !== null) {
      BackgroundTimer.clearInterval(duckTimerRef.current);
      duckTimerRef.current = null;
    }
    const start = duckMultiplierRef.current;
    if (Math.abs(start - target) < 0.01) {
      duckMultiplierRef.current = target;
      currentPlayerRef.current?.setVolume(target);
      nextPlayerRef.current?.setVolume(target);
      return;
    }
    let step = 0;
    duckTimerRef.current = BackgroundTimer.setInterval(() => {
      step++;
      const t = Math.min(1, step / DUCK_STEPS);
      duckMultiplierRef.current = start + (target - start) * t;
      currentPlayerRef.current?.setVolume(duckMultiplierRef.current);
      nextPlayerRef.current?.setVolume(duckMultiplierRef.current);
      if (step >= DUCK_STEPS) {
        if (duckTimerRef.current !== null) {
          BackgroundTimer.clearInterval(duckTimerRef.current);
          duckTimerRef.current = null;
        }
      }
    }, TICK_MS);
  }, []);

  const duck = useCallback(() => animateDuck(DUCK_TARGET), [animateDuck]);
  const unduck = useCallback(() => animateDuck(UNDUCK_TARGET), [animateDuck]);

  // Preview: 5-second sample with 2-second fade out
  const preview = useCallback(async (soundId: BackgroundSound) => {
    // Stop any existing preview
    stopAndRelease(previewPlayerRef.current);
    previewPlayerRef.current = null;
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (previewFadeRef.current) {
      clearInterval(previewFadeRef.current);
      previewFadeRef.current = null;
    }

    if (soundId === "none") {
      return;
    }

    const id = ++previewIdRef.current;

    try {
      const path = await ensureDownloaded(soundId);
      if (previewIdRef.current !== id) {
        return;
      }

      const player = await createPlayer(path);
      if (previewIdRef.current !== id) {
        player.stop();
        player.release();
        return;
      }

      previewPlayerRef.current = player;
      player.setVolume(1.0);
      player.play();

      // Start fade out after 3s (2s fade, 5s total)
      previewTimerRef.current = setTimeout(() => {
        previewTimerRef.current = null;
        let elapsed = 0;
        const totalTicks = 2000 / TICK_MS;

        previewFadeRef.current = setInterval(() => {
          elapsed++;
          const volume = Math.max(0, 1 - elapsed / totalTicks);
          previewPlayerRef.current?.setVolume(volume);

          if (elapsed >= totalTicks) {
            if (previewFadeRef.current) {
              clearInterval(previewFadeRef.current);
              previewFadeRef.current = null;
            }
            stopAndRelease(previewPlayerRef.current);
            previewPlayerRef.current = null;
          }
        }, TICK_MS);
      }, 3000);
    } catch (e) {
      console.warn("useBackgroundSound: preview failed", e);
    }
  }, []);

  // Session playback
  useEffect(() => {
    if (!isActive) {
      if (sessionActiveRef.current) {
        stopSession();
      }
      return;
    }

    sessionActiveRef.current = true;
    BackgroundTimer.start();
    const infinite = durationMinutes === 0;
    const totalSeconds = durationMinutes * 60;
    const needsLoop = infinite || totalSeconds > AUDIO_DURATION;

    let cancelled = false;

    const dm = () => duckMultiplierRef.current;

    const stopPreview = () => {
      stopAndRelease(previewPlayerRef.current);
      previewPlayerRef.current = null;
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    };

    const startSilenceSession = async () => {
      try {
        stopPreview();

        const silencePath = await ensureAudioFile("silence.m4a");
        const player = await createPlayer(silencePath);
        if (cancelled || !sessionActiveRef.current) {
          player.stop();
          player.release();
          return;
        }

        currentPlayerRef.current = player;
        player.setVolume(1.0 * dm());
        player.play();

        const duration = player.getDuration();
        scheduleSilenceCrossfade(duration);
      } catch (e) {
        console.warn("useBackgroundSound: silence session start failed", e);
      }
    };

    const scheduleSilenceCrossfade = (duration: number) => {
      const delay = (duration - SILENCE_CROSSFADE_DURATION) * 1000;
      crossfadeScheduleRef.current = BackgroundTimer.setTimeout(() => {
        startSilenceCrossfade(duration);
      }, delay);
    };

    const startSilenceCrossfade = async (duration: number) => {
      if (cancelled || !sessionActiveRef.current) {
        return;
      }

      try {
        const silencePath = await ensureAudioFile("silence.m4a");
        const newPlayer = await createPlayer(silencePath);
        if (cancelled || !sessionActiveRef.current) {
          newPlayer.stop();
          newPlayer.release();
          return;
        }

        nextPlayerRef.current = newPlayer;
        newPlayer.setVolume(0);
        newPlayer.play();

        const oldPlayer = currentPlayerRef.current;
        let elapsed = 0;
        const totalTicks = (SILENCE_CROSSFADE_DURATION * 1000) / TICK_MS;

        crossfadeTimerRef.current = BackgroundTimer.setInterval(() => {
          elapsed++;
          const progress = elapsed / totalTicks;

          if (progress >= 1) {
            if (crossfadeTimerRef.current !== null) {
              BackgroundTimer.clearInterval(crossfadeTimerRef.current);
              crossfadeTimerRef.current = null;
            }
            stopAndRelease(oldPlayer);
            currentPlayerRef.current = nextPlayerRef.current;
            nextPlayerRef.current = null;

            if (currentPlayerRef.current) {
              currentPlayerRef.current.setVolume(1.0 * dm());
            }

            if (sessionActiveRef.current && !cancelled) {
              scheduleSilenceCrossfade(duration);
            }
          } else {
            oldPlayer?.setVolume((1 - progress) * dm());
            newPlayer.setVolume(progress * dm());
          }
        }, TICK_MS);
      } catch (e) {
        console.warn("useBackgroundSound: silence crossfade failed", e);
      }
    };

    const startSoundSession = async () => {
      try {
        stopPreview();

        const path = await ensureDownloaded(sound as Exclude<BackgroundSound, "none">);
        if (cancelled || !sessionActiveRef.current) {
          return;
        }

        const player = await createPlayer(path);
        if (cancelled || !sessionActiveRef.current) {
          player.stop();
          player.release();
          return;
        }

        currentPlayerRef.current = player;
        player.setVolume(1.0 * dm());
        player.play();

        // Schedule crossfade loop if needed
        if (needsLoop) {
          scheduleCrossfade(path);
        }

        // Schedule fadeout (skip for infinite mode)
        if (!infinite) {
          const fadeoutStart = (totalSeconds - fadeoutSeconds) * 1000;
          if (fadeoutStart > 0) {
            fadeoutScheduleRef.current = BackgroundTimer.setTimeout(() => {
              startFadeout();
            }, fadeoutStart);
          }
        }
      } catch (e) {
        console.warn("useBackgroundSound: session start failed", e);
      }
    };

    const scheduleCrossfade = (path: string) => {
      const delay = (AUDIO_DURATION - CROSSFADE_DURATION) * 1000;
      crossfadeScheduleRef.current = BackgroundTimer.setTimeout(() => {
        startCrossfade(path);
      }, delay);
    };

    const startCrossfade = async (path: string) => {
      if (cancelled || !sessionActiveRef.current) {
        return;
      }

      try {
        const newPlayer = await createPlayer(path);
        if (cancelled || !sessionActiveRef.current) {
          newPlayer.stop();
          newPlayer.release();
          return;
        }

        nextPlayerRef.current = newPlayer;
        newPlayer.setVolume(0);
        newPlayer.play();

        const oldPlayer = currentPlayerRef.current;
        let elapsed = 0;
        const totalTicks = (CROSSFADE_DURATION * 1000) / TICK_MS;

        crossfadeTimerRef.current = BackgroundTimer.setInterval(() => {
          elapsed++;
          const progress = elapsed / totalTicks;

          if (progress >= 1) {
            // Crossfade complete
            if (crossfadeTimerRef.current !== null) {
              BackgroundTimer.clearInterval(crossfadeTimerRef.current);
              crossfadeTimerRef.current = null;
            }
            stopAndRelease(oldPlayer);
            currentPlayerRef.current = nextPlayerRef.current;
            nextPlayerRef.current = null;

            if (currentPlayerRef.current) {
              currentPlayerRef.current.setVolume(1.0 * dm());
            }

            // Schedule next crossfade
            if (sessionActiveRef.current && !cancelled) {
              scheduleCrossfade(path);
            }
          } else {
            oldPlayer?.setVolume((1 - progress) * dm());
            newPlayer.setVolume(progress * dm());
          }
        }, TICK_MS);
      } catch (e) {
        console.warn("useBackgroundSound: crossfade failed", e);
      }
    };

    const startFadeout = () => {
      // Cancel pending crossfade schedule (session is ending)
      if (crossfadeScheduleRef.current !== null) {
        BackgroundTimer.clearTimeout(crossfadeScheduleRef.current);
        crossfadeScheduleRef.current = null;
      }
      if (crossfadeTimerRef.current !== null) {
        BackgroundTimer.clearInterval(crossfadeTimerRef.current);
        crossfadeTimerRef.current = null;
      }

      let elapsed = 0;
      const totalTicks = (fadeoutSeconds * 1000) / TICK_MS;

      fadeoutTimerRef.current = BackgroundTimer.setInterval(() => {
        elapsed++;
        const progress = elapsed / totalTicks;
        const multiplier = Math.max(0, 1 - progress);

        if (currentPlayerRef.current) {
          currentPlayerRef.current.setVolume(multiplier * dm());
        }
        if (nextPlayerRef.current) {
          nextPlayerRef.current.setVolume(multiplier * dm());
        }

        if (progress >= 1) {
          if (fadeoutTimerRef.current !== null) {
            BackgroundTimer.clearInterval(fadeoutTimerRef.current);
            fadeoutTimerRef.current = null;
          }
          stopAndRelease(currentPlayerRef.current);
          currentPlayerRef.current = null;
          stopAndRelease(nextPlayerRef.current);
          nextPlayerRef.current = null;
        }
      }, TICK_MS);
    };

    if (sound === "none") {
      startSilenceSession();
    } else {
      startSoundSession();
    }

    return () => {
      cancelled = true;
      stopSession();
    };
  }, [isActive, sound, durationMinutes, fadeoutSeconds, stopSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      releaseAllPlayers();
    };
  }, [clearAllTimers, releaseAllPlayers]);

  return { preview, duck, unduck };
};
