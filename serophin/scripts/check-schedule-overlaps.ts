import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Parse schedules from source file to avoid tsconfig conflicts with React Native
const scheduleSource = readFileSync(resolve(import.meta.dirname!, "../mobile/src/data/guidanceSchedule.ts"), "utf-8");

const parseSchedule = (source: string, varName: string): Record<number, [number, string][]> => {
  const regex = new RegExp(`export const ${varName}[\\s\\S]*?= \\{([\\s\\S]*?)\\n\\};`);
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Could not find ${varName} in source`);
  }

  const body = match[1]!;
  const result: Record<number, [number, string][]> = {};

  // Match each duration key and its array of cues
  const durationRegex = /(\d+):\s*\[([\s\S]*?)\],?\s*(?=\d+:|$)/g;
  let durMatch: RegExpExecArray | null;

  while ((durMatch = durationRegex.exec(body)) !== null) {
    const duration = Number(durMatch[1]);
    const cuesStr = durMatch[2]!;
    const cues: [number, string][] = [];

    const cueRegex = /\[(\d+),\s*"([^"]+)"\]/g;
    let cueMatch: RegExpExecArray | null;
    while ((cueMatch = cueRegex.exec(cuesStr)) !== null) {
      cues.push([Number(cueMatch[1]), cueMatch[2]!]);
    }

    result[duration] = cues;
  }

  return result;
};

const guidedSchedule = parseSchedule(scheduleSource, "guidedSchedule");
const gentleSchedule = parseSchedule(scheduleSource, "gentleSchedule");

const AUDIO_DIR = resolve(import.meta.dirname!, "../web/static/audio/meditation");
const MIN_GAP = 1; // seconds between end of one cue and start of the next

const durationCache = new Map<string, number>();

const getAudioDuration = (cueBaseName: string): number => {
  const cached = durationCache.get(cueBaseName);
  if (cached !== undefined) {
    return cached;
  }

  const filePath = resolve(AUDIO_DIR, `${cueBaseName}_bm.m4a`);
  if (!existsSync(filePath)) {
    console.error(`  MISSING: ${filePath}`);
    return 0;
  }

  const output = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`, {
    encoding: "utf-8",
  }).trim();

  const duration = Number.parseFloat(output);
  durationCache.set(cueBaseName, duration);
  return duration;
};

type Overlap = {
  schedule: string;
  duration: number;
  cueA: string;
  cueB: string;
  startA: number;
  audioDurationA: number;
  endA: number;
  startB: number;
  gap: number;
};

const checkSchedule = (name: string, schedule: Record<number, [number, string][]>): Overlap[] => {
  const overlaps: Overlap[] = [];

  for (const [durStr, cues] of Object.entries(schedule)) {
    const dur = Number(durStr);
    if (!cues || cues.length < 2) {
      continue;
    }

    console.log(`\n  ${dur} min (${cues.length} cues)`);

    for (let i = 0; i < cues.length - 1; i++) {
      const [startA, cueA] = cues[i]!;
      const [startB, cueB] = cues[i + 1]!;
      const audioDurationA = getAudioDuration(cueA);
      const endA = startA + audioDurationA;
      const gap = startB - endA;

      if (gap < MIN_GAP) {
        overlaps.push({ schedule: name, duration: dur, cueA, cueB, startA, audioDurationA, endA, startB, gap });
        console.log(
          `    OVERLAP [${i}] ${cueA} @${startA}s (${audioDurationA.toFixed(2)}s) ends@${endA.toFixed(2)}s → [${i + 1}] ${cueB} @${startB}s  gap=${gap.toFixed(2)}s`,
        );
      }
    }
  }

  return overlaps;
};

console.log("Checking audio schedule overlaps...");
console.log(`Audio dir: ${AUDIO_DIR}`);
console.log(`Min gap: ${MIN_GAP}s\n`);

console.log("=== Guided Schedule ===");
const guidedOverlaps = checkSchedule("guided", guidedSchedule);

console.log("\n=== Gentle Schedule ===");
const gentleOverlaps = checkSchedule("gentle", gentleSchedule);

const allOverlaps = [...guidedOverlaps, ...gentleOverlaps];

console.log("\n" + "=".repeat(60));
if (allOverlaps.length === 0) {
  console.log("All clear — no overlaps found.");
  process.exit(0);
} else {
  console.log(`\nFOUND ${allOverlaps.length} OVERLAP(S):\n`);
  for (const o of allOverlaps) {
    const gapLabel = o.gap < 0 ? `overlap by ${(-o.gap).toFixed(2)}s` : `gap only ${o.gap.toFixed(2)}s (need ${MIN_GAP}s)`;
    console.log(`  [${o.schedule}/${o.duration}min] ${o.cueA} → ${o.cueB}: ${gapLabel}`);
  }
  process.exit(1);
}
