import type { DdbItem } from "./types";

// Format value - pad numbers to 16 chars for proper lexicographic sorting
export const formatValue = (value: unknown): string => {
  if (typeof value === "number") {
    return String(value).padStart(16, "0");
  }
  return String(value);
};

// Build PK string: typeName#field1#value1#field2#value2
export const buildPK = (typeName: string, pkFields: string[], pkValue: Record<string, unknown>): string => {
  if (pkFields.length === 0) {
    return typeName;
  }
  let pk = typeName;
  for (const field of pkFields) {
    pk += `#${field}#${formatValue(pkValue[field])}`;
  }
  return pk;
};

// Build SK string: field1#value1#field2#value2 (or typeName if no SK fields)
export const buildSK = (typeName: string, skFields: string[], item: Record<string, unknown>): string => {
  if (skFields.length === 0) {
    return typeName;
  }
  let sk = "";
  for (const field of skFields) {
    sk += (sk ? "#" : "") + `${field}#${formatValue(item[field])}`;
  }
  return sk;
};

// Check if all fields have defined (non-null/non-undefined) values
const allFieldsDefined = (fields: string[], record: Record<string, unknown>): boolean => {
  return fields.every((field) => record[field] != null);
};

// DDB internal fields to strip from results
const DDB_FIELDS = ["pk", "sk", "gsi1_pk", "gsi1_sk", "gsi2_pk", "gsi2_sk", "gsi3_pk", "gsi3_sk", "gsi4_pk", "gsi4_sk", "gsi5_pk", "gsi5_sk", "_type"];

export interface ItemConfig {
  typeName: string;
  tableName: string;
  pk: string[];
  sk: string[];
  gsis: Record<string, { index: string; pk: string[]; sk: string[] }>;
}

// Convert user item to DdbItem
export const toDdbItem = <T>(config: ItemConfig, item: T): DdbItem<T> => {
  const record = item as Record<string, unknown>;
  const ddbItem: Record<string, unknown> = {
    ...record,
    pk: buildPK(config.typeName, config.pk, record),
    sk: buildSK(config.typeName, config.sk, record),
    _type: config.typeName,
  };

  // Add GSI keys only if all fields are defined
  for (const [, gsiConfig] of Object.entries(config.gsis)) {
    const allPkDefined = allFieldsDefined(gsiConfig.pk, record);
    const allSkDefined = allFieldsDefined(gsiConfig.sk, record);

    if (allPkDefined && allSkDefined) {
      ddbItem[`${gsiConfig.index}_pk`] = buildPK(config.typeName, gsiConfig.pk, record);
      ddbItem[`${gsiConfig.index}_sk`] = buildSK(config.typeName, gsiConfig.sk, record);
    }
  }

  return ddbItem as DdbItem<T>;
};

// Convert DdbItem back to user item
export const fromDdbItem = <T>(item: DdbItem<T>): T => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (!DDB_FIELDS.includes(key)) {
      result[key] = value;
    }
  }
  return result as T;
};
