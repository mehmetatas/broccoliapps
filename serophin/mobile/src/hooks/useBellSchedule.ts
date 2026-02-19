import { useCallback, useEffect, useRef } from "react";
import BackgroundTimer from "react-native-background-timer";
import Sound from "react-native-sound";
import { ensureAudioFile } from "./audioCache";

// Single bell times in seconds, keyed by duration in minutes
const BELL_SCHEDULE: Record<number, number[]> = {
  5: [150], // 2:30
  10: [180, 420], // 3:00, 7:00
  15: [180, 450, 720], // 3:00, 7:30, 12:00
  20: [180, 480, 780, 1080], // 3:00, 8:00, 13:00, 18:00
  30: [180, 540, 900, 1260, 1620], // 3:00, 9:00, 15:00, 21:00, 27:00
  45: [180, 540, 900, 1260, 1620, 1980, 2400], // 3:00, 9:00, 15:00, 21:00, 27:00, 33:00, 40:00
  60: [180, 720, 1200, 1680, 2160, 2640, 3120, 3420], // 3:00, 12:00, 20:00, 28:00, 36:00, 44:00, 52:00, 57:00
};

const playBell = (path: string) => {
  const bell = new Sound(path, "", (error) => {
    if (!error) {
      bell.play(() => bell.release());
    }
  });
};

const playDoubleBell = (path: string) => {
  const bell = new Sound(path, "", (error) => {
    if (!error) {
      bell.play(() => {
        bell.release();
        setTimeout(() => {
          const bell2 = new Sound(path, "", (error2) => {
            if (!error2) {
              bell2.play(() => bell2.release());
            }
          });
        }, 500);
      });
    }
  });
};

type BellEntry = { time: number; double: boolean };

const buildSchedule = (bellsEnabled: boolean, durationMinutes: number, endDoubleBell: boolean): BellEntry[] => {
  const entries: BellEntry[] = [];
  if (bellsEnabled) {
    const times = BELL_SCHEDULE[durationMinutes];
    if (times) {
      for (const t of times) {
        entries.push({ time: t, double: false });
      }
    }
  }
  if (endDoubleBell && durationMinutes > 0) {
    entries.push({ time: durationMinutes * 60 - 5, double: true });
  }
  return entries;
};

export const useBellSchedule = (bellsEnabled: boolean, durationMinutes: number, endDoubleBell: boolean) => {
  const timerIdsRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const skippedMsRef = useRef(0);
  const firedRef = useRef<Set<number>>(new Set());
  const bellPathRef = useRef<string | null>(null);

  const enabled = bellsEnabled || endDoubleBell;

  useEffect(() => {
    if (enabled) {
      ensureAudioFile("bell.m4a").then((path) => {
        bellPathRef.current = path;
      });
    }
  }, [enabled]);

  const clearTimers = useCallback(() => {
    for (const id of timerIdsRef.current) {
      BackgroundTimer.clearTimeout(id);
    }
    timerIdsRef.current = [];
  }, []);

  const scheduleRemaining = useCallback(
    (entries: BellEntry[]) => {
      clearTimers();
      const virtualElapsedMs = Date.now() - startedAtRef.current + skippedMsRef.current;

      for (const entry of entries) {
        if (firedRef.current.has(entry.time)) {
          continue;
        }
        const remainingMs = entry.time * 1000 - virtualElapsedMs;
        const fire = () => {
          if (bellPathRef.current) {
            (entry.double ? playDoubleBell : playBell)(bellPathRef.current);
          }
        };
        if (remainingMs <= 0) {
          firedRef.current.add(entry.time);
          fire();
        } else {
          const id = BackgroundTimer.setTimeout(() => {
            firedRef.current.add(entry.time);
            fire();
          }, remainingMs);
          timerIdsRef.current.push(id);
        }
      }
    },
    [clearTimers],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const entries = buildSchedule(bellsEnabled, durationMinutes, endDoubleBell);
    if (entries.length === 0) {
      return;
    }

    startedAtRef.current = Date.now();
    skippedMsRef.current = 0;
    firedRef.current.clear();
    scheduleRemaining(entries);

    return clearTimers;
  }, [enabled, bellsEnabled, durationMinutes, endDoubleBell, scheduleRemaining, clearTimers]);

  const skipForward = useCallback(
    (seconds: number) => {
      if (!enabled) {
        return;
      }
      const entries = buildSchedule(bellsEnabled, durationMinutes, endDoubleBell);
      if (entries.length === 0) {
        return;
      }
      skippedMsRef.current += seconds * 1000;
      scheduleRemaining(entries);
    },
    [enabled, bellsEnabled, durationMinutes, endDoubleBell, scheduleRemaining],
  );

  return { skipForward };
};
