import { useState } from "preact/hooks";
import { getAccounts, postAccount } from "../../../shared/api-contracts";
import { Button, PageHeader } from "../components";

type ParsedRow = {
  name: string;
  type: "asset" | "debt";
  currency: string;
  month: string;
  value: number;
};

const parseLine = (line: string, lineNum: number): ParsedRow => {
  const parts = line.split(",").map((p) => p.trim());
  if (parts.length !== 5) {
    throw `Line ${lineNum}: Expected 5 columns, got ${parts.length}`;
  }

  const name = parts[0]!;
  const type = parts[1]!;
  const currency = parts[2]!;
  const month = parts[3]!;
  const valueStr = parts[4]!;

  if (!name) {
    throw `Line ${lineNum}: Name is required`;
  }

  if (type !== "asset" && type !== "debt") {
    throw `Line ${lineNum}: Type must be "asset" or "debt", got "${type}"`;
  }

  if (!currency) {
    throw `Line ${lineNum}: Currency is required`;
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw `Line ${lineNum}: Month must be in YYYY-MM format, got "${month}"`;
  }

  const value = Number(valueStr);
  if (isNaN(value)) {
    throw `Line ${lineNum}: Value must be a valid number, got "${valueStr}"`;
  }

  return { name, type, currency, month, value };
};

const groupBy = <T, K extends keyof T>(
  items: T[],
  key: K
): Map<T[K], T[]> => {
  const map = new Map<T[K], T[]>();
  for (const item of items) {
    const k = item[key];
    const existing = map.get(k);
    if (existing) {
      existing.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
};

export const ImportPage = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);

  const handleImport = async () => {
    setError(null);
    setResult(null);
    setImporting(true);

    try {
      // 1. Parse CSV lines
      const lines = input
        .trim()
        .split("\n")
        .filter((l) => l.trim());

      if (lines.length === 0) {
        throw "No data to import";
      }

      // 2. Parse each line
      const parsed: ParsedRow[] = [];
      for (let i = 0; i < lines.length; i++) {
        parsed.push(parseLine(lines[i]!, i + 1));
      }

      // 3. Group by account name
      const accountGroups = groupBy(parsed, "name");

      // 4. Validate each group has consistent type/currency
      for (const [name, rows] of accountGroups) {
        const types = new Set(rows.map((r) => r.type));
        const currencies = new Set(rows.map((r) => r.currency));
        if (types.size > 1) {
          throw `"${name}" has inconsistent types`;
        }
        if (currencies.size > 1) {
          throw `"${name}" has inconsistent currencies`;
        }
      }

      // 5. Fetch existing accounts and check for duplicates
      const existingAccounts = await getAccounts.invoke({});
      const existingNames = new Set(
        existingAccounts.map((a) => a.name.toLowerCase())
      );
      for (const name of accountGroups.keys()) {
        if (existingNames.has(name.toLowerCase())) {
          throw `"${name}" already exists`;
        }
      }

      // 6. Create accounts sequentially
      for (const [name, rows] of accountGroups) {
        const firstRow = rows[0]!;
        await postAccount.invoke({
          name,
          type: firstRow.type,
          currency: firstRow.currency,
          historyItems: rows.map((r) => ({ month: r.month, value: r.value })),
        });
      }

      setResult({ created: accountGroups.size });
      setInput("");
    } catch (e) {
      setError(typeof e === "string" ? e : (e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Import assets and debts" backHref="/" />
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              CSV Data
            </label>
            <textarea
              value={input}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
              placeholder={`Home,asset,USD,2024-01,500000\nHome,asset,USD,2024-02,505000\nHome,asset,USD,2024-03,510000\nMortgage,debt,USD,2024-01,400000\nMortgage,debt,USD,2024-02,398000\nMortgage,debt,USD,2024-03,396000`}
              rows={10}
              class="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-mono text-sm"
            />
          </div>

          {error && (
            <div class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div class="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
              Successfully created {result.created} account
              {result.created !== 1 ? "s" : ""}.
            </div>
          )}

          <Button onClick={handleImport} disabled={importing || !input.trim()}>
            {importing ? "Importing..." : "Import"}
          </Button>
        </div>
      </div>
    </div>
  );
};
