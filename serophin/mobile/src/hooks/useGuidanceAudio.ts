import { useCallback, useEffect, useRef } from "react";
import BackgroundTimer from "react-native-background-timer";
import Sound from "react-native-sound";
import { gentleSchedule, guidedSchedule } from "../data/guidanceSchedule";
import type { GuidanceLevel } from "../data/types";
import { ensureAudioFile } from "./audioCache";

type Options = {
  guidanceLevel: GuidanceLevel;
  durationMinutes: number;
  isActive: boolean;
  onDuck: () => void;
  onUnduck: () => void;
};

const getSchedule = (level: GuidanceLevel, durationMinutes: number) => {
  if (level === 3) {
    return guidedSchedule[durationMinutes] ?? [];
  }
  if (level === 2) {
    return gentleSchedule[durationMinutes] ?? [];
  }
  return [];
};

export const useGuidanceAudio = ({ guidanceLevel, durationMinutes, isActive, onDuck, onUnduck }: Options) => {
  const timerIdsRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const skippedMsRef = useRef(0);
  const firedRef = useRef<Set<number>>(new Set());
  const currentCueRef = useRef<Sound | null>(null);
  const isDuckedRef = useRef(false);
  const cueGenRef = useRef(0);

  // Store callbacks in refs so downstream hooks have stable deps
  const onDuckRef = useRef(onDuck);
  const onUnduckRef = useRef(onUnduck);
  onDuckRef.current = onDuck;
  onUnduckRef.current = onUnduck;

  const enabled = guidanceLevel >= 2;

  const stopCurrentCue = useCallback(() => {
    cueGenRef.current++;
    if (currentCueRef.current) {
      currentCueRef.current.stop();
      currentCueRef.current.release();
      currentCueRef.current = null;
    }
    if (isDuckedRef.current) {
      isDuckedRef.current = false;
      onUnduckRef.current();
    }
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timerIdsRef.current) {
      BackgroundTimer.clearTimeout(id);
    }
    timerIdsRef.current = [];
  }, []);

  const playCue = useCallback(
    async (cueName: string) => {
      stopCurrentCue();
      const gen = cueGenRef.current;

      try {
        const filename = `meditation/${cueName}_bm.m4a`;
        const path = await ensureAudioFile(filename);

        if (gen !== cueGenRef.current) {
          return;
        }

        onDuckRef.current();
        isDuckedRef.current = true;

        const player = new Sound(path, "", (error) => {
          if (gen !== cueGenRef.current) {
            player.release();
            return;
          }

          if (error) {
            console.warn("useGuidanceAudio: failed to load", cueName, error);
            player.release();
            if (isDuckedRef.current) {
              isDuckedRef.current = false;
              onUnduckRef.current();
            }
            return;
          }

          currentCueRef.current = player;
          player.play(() => {
            player.release();
            if (currentCueRef.current === player) {
              currentCueRef.current = null;
            }
            if (isDuckedRef.current) {
              isDuckedRef.current = false;
              onUnduckRef.current();
            }
          });
        });
      } catch (e) {
        console.warn("useGuidanceAudio: playCue failed", cueName, e);
        if (isDuckedRef.current) {
          isDuckedRef.current = false;
          onUnduckRef.current();
        }
      }
    },
    [stopCurrentCue],
  );

  // Ref so scheduleRemaining doesn't need playCue in deps
  const playCueRef = useRef(playCue);
  playCueRef.current = playCue;

  const scheduleRemaining = useCallback(
    (cues: [number, string][]) => {
      clearTimers();
      const virtualElapsedMs = Date.now() - startedAtRef.current + skippedMsRef.current;

      for (const [time, cueName] of cues) {
        if (firedRef.current.has(time)) {
          continue;
        }
        const remainingMs = time * 1000 - virtualElapsedMs;
        if (remainingMs <= 0) {
          // Skipped past — mark fired but don't play
          firedRef.current.add(time);
        } else {
          const id = BackgroundTimer.setTimeout(() => {
            firedRef.current.add(time);
            playCueRef.current(cueName);
          }, remainingMs);
          timerIdsRef.current.push(id);
        }
      }
    },
    [clearTimers],
  );

  useEffect(() => {
    if (!enabled || !isActive) {
      return;
    }

    const cues = getSchedule(guidanceLevel, durationMinutes);
    if (cues.length === 0) {
      return;
    }

    startedAtRef.current = Date.now();
    skippedMsRef.current = 0;
    firedRef.current.clear();

    // Play the first cue immediately if it starts at 0
    const [firstTime, firstName] = cues[0]!;
    if (firstTime === 0) {
      firedRef.current.add(0);
      playCueRef.current(firstName);
    }

    scheduleRemaining(cues);

    return () => {
      clearTimers();
      stopCurrentCue();
    };
  }, [enabled, isActive, guidanceLevel, durationMinutes, scheduleRemaining, clearTimers, stopCurrentCue]);

  const skipForward = useCallback(
    (seconds: number) => {
      if (!enabled) {
        return;
      }
      const cues = getSchedule(guidanceLevel, durationMinutes);
      if (cues.length === 0) {
        return;
      }

      // Stop any cue currently playing (we're jumping ahead)
      stopCurrentCue();

      skippedMsRef.current += seconds * 1000;

      // Mark skipped-past cues as fired without playing
      const virtualElapsedMs = Date.now() - startedAtRef.current + skippedMsRef.current;
      for (const [time] of cues) {
        if (!firedRef.current.has(time) && time * 1000 <= virtualElapsedMs) {
          firedRef.current.add(time);
        }
      }

      scheduleRemaining(cues);
    },
    [enabled, guidanceLevel, durationMinutes, scheduleRemaining, stopCurrentCue],
  );

  return { skipForward };
};
