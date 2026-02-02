import { SpendRecord } from "../types/spendRecord";
import { getStorage } from "./mmkv";

// time sorted ids with second precision with a 4 character random string suffix
// example value: 00b2dmqs35 = 00b2dm + qs35
const timeIdOffset = Date.UTC(2026); // number of seconds from 2026-01-01 00:00:00 (UTC)
const TIME_ID_LENGTH = 6; // Enough for ~70 years
const RANDOM_ID_LENGTH = 4;
function generateId(): string {
  return (
    Math.round((Date.now() - timeIdOffset) / 1000)
      .toString(36)
      .padStart(TIME_ID_LENGTH, "0") +
    Math.random()
      .toString(36)
      .substring(2, 2 + RANDOM_ID_LENGTH) // 2 to remove '0.' from the beginning
  );
}

function getStorageKey(yearMonth: string): string {
  return `spend:${yearMonth}`;
}

export function getSpendRecordsForMonth(yearMonth: string): SpendRecord[] {
  const storage = getStorage();
  const key = getStorageKey(yearMonth);
  const data = storage.getString(key);
  if (!data) {
    return [];
  }
  return JSON.parse(data) as SpendRecord[];
}

export function getRecentSpendRecords(count = 10): SpendRecord[] {
  const storage = getStorage();
  const keys = storage
    .getAllKeys()
    .filter(key => key.startsWith("spend:"))
    .sort((a, b) => b.localeCompare(a)); // newest first. reverse sorted by key which is yyyy-mm

  const records: SpendRecord[] = [];

  outer: for (const key of keys) {
    const data = storage.getString(key);
    if (!data) {
      continue;
    }

    const spendRecords = JSON.parse(data) as SpendRecord[];
    let i = spendRecords.length - 1; // entries are already time sorted so we start from the end to get the newest first
    while (i >= 0) {
      records.push(spendRecords[i--]);
      if (records.length >= count) {
        break outer;
      }
    }
  }

  return records;
}

export function saveSpendRecord(record: Omit<SpendRecord, "id">): SpendRecord {
  const storage = getStorage();
  const yearMonth = record.date.substring(0, 7);
  const key = getStorageKey(yearMonth);

  const newRecord: SpendRecord = {
    id: generateId(),
    ...record,
  };

  const existingRecords = getSpendRecordsForMonth(yearMonth);
  existingRecords.push(newRecord);
  storage.set(key, JSON.stringify(existingRecords));

  return newRecord;
}

export function deleteSpendRecord(record: SpendRecord): void {
  const storage = getStorage();
  const yearMonth = record.date.substring(0, 7);
  const key = getStorageKey(yearMonth);

  const existingRecords = getSpendRecordsForMonth(yearMonth);
  const filtered = existingRecords.filter(r => r.id !== record.id);
  storage.set(key, JSON.stringify(filtered));
}
