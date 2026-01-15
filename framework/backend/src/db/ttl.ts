import { Duration } from "@broccoliapps/shared";

const unitMap = {
  min: "minutes",
  hr: "hours",
  day: "days",
  wk: "weeks",
  mon: "months",
  yr: "years",
} as const;

type Unit = keyof typeof unitMap;

export const ttl = (duration: number, unit: Unit) => Duration[unitMap[unit]](duration).fromNow().toSeconds();
