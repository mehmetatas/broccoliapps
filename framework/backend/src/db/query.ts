import { executeCountQuery, executeQuery } from "./client";
import { fromDdbItem } from "./item";
import { Filter, Query, TableConfig } from "./types";

// Format value - pad numbers to 16 chars for proper lexicographic sorting
const formatValue = (value: unknown): string => {
  if (typeof value === "number") {
    return String(value).padStart(16, "0");
  }
  return String(value);
};

const OPERATORS = ["beginsWith", "gte", "lte", "gt", "lt"] as const;
type OperatorName = (typeof OPERATORS)[number];

const isOperator = (value: unknown): value is Record<OperatorName, unknown> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 1 && OPERATORS.includes(keys[0] as OperatorName);
};

const getOperator = (value: Record<OperatorName, unknown>): { op: OperatorName; val: unknown } => {
  const op = Object.keys(value)[0] as OperatorName;
  return { op, val: value[op] };
};

// Build SK string from partial fields
const buildSKValue = (skFields: string[], skValue: Record<string, unknown>): string => {
  let sk = "";
  for (const field of skFields) {
    if (skValue[field] === undefined) {
      break;
    }
    const value = skValue[field];
    if (isOperator(value)) {
      const { val } = getOperator(value);
      sk += (sk ? "#" : "") + `${field}#${formatValue(val)}`;
      break;
    }
    sk += (sk ? "#" : "") + `${field}#${formatValue(value)}`;
  }
  return sk;
};

// Determine SK condition type
const buildSKCondition = (
  skFields: string[],
  skFilter: Record<string, unknown> | undefined,
  skAttr: string = "sk"
): { expression: string; values: Record<string, unknown> } | null => {
  if (!skFilter || Object.keys(skFilter).length === 0) {
    return null;
  }

  if ("between" in skFilter) {
    const [start, end] = skFilter.between as [Record<string, unknown>, Record<string, unknown>];
    const startSK = buildSKValue(skFields, start);
    const endSK = buildSKValue(skFields, end);
    return {
      expression: `${skAttr} BETWEEN :skStart AND :skEnd`,
      values: { ":skStart": startSK, ":skEnd": endSK },
    };
  }

  let lastFieldIndex = -1;
  let operatorType: OperatorName | null = null;

  for (let i = 0; i < skFields.length; i++) {
    const field = skFields[i]!;
    const value = skFilter[field];
    if (value === undefined) {
      break;
    }
    lastFieldIndex = i;

    if (isOperator(value)) {
      operatorType = getOperator(value).op;
    }
  }

  if (lastFieldIndex === -1) {
    return null;
  }

  const skValue = buildSKValue(skFields, skFilter);
  const allFieldsProvided = lastFieldIndex === skFields.length - 1 && operatorType === null;

  if (allFieldsProvided) {
    return { expression: `${skAttr} = :sk`, values: { ":sk": skValue } };
  }

  if (operatorType !== null) {
    switch (operatorType) {
    case "beginsWith":
      return { expression: `begins_with(${skAttr}, :sk)`, values: { ":sk": skValue } };
    case "gte":
      return { expression: `${skAttr} >= :sk`, values: { ":sk": skValue } };
    case "lte":
      return { expression: `${skAttr} <= :sk`, values: { ":sk": skValue } };
    case "gt":
      return { expression: `${skAttr} > :sk`, values: { ":sk": skValue } };
    case "lt":
      return { expression: `${skAttr} < :sk`, values: { ":sk": skValue } };
    }
  }

  return { expression: `begins_with(${skAttr}, :sk)`, values: { ":sk": skValue + "#" } };
};

const FILTER_OPERATORS = ["beginsWith", "gte", "lte", "gt", "lt", "between"] as const;
type FilterOperatorName = (typeof FILTER_OPERATORS)[number];

const isFilterOperator = (value: unknown): value is Record<FilterOperatorName, unknown> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 1 && FILTER_OPERATORS.includes(keys[0] as FilterOperatorName);
};

const buildFilterExpression = (
  filter: Record<string, unknown>
): { expression: string; names: Record<string, string>; values: Record<string, unknown> } => {
  const conditions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(filter)) {
    if (value === undefined) {
      continue;
    }

    const nameKey = `#f_${field}`;
    const valueKey = `:f_${field}`;
    names[nameKey] = field;

    if (isFilterOperator(value)) {
      const op = Object.keys(value)[0] as FilterOperatorName;
      const val = (value as Record<string, unknown>)[op];

      switch (op) {
      case "beginsWith":
        conditions.push(`begins_with(${nameKey}, ${valueKey})`);
        values[valueKey] = val;
        break;
      case "gte":
        conditions.push(`${nameKey} >= ${valueKey}`);
        values[valueKey] = val;
        break;
      case "lte":
        conditions.push(`${nameKey} <= ${valueKey}`);
        values[valueKey] = val;
        break;
      case "gt":
        conditions.push(`${nameKey} > ${valueKey}`);
        values[valueKey] = val;
        break;
      case "lt":
        conditions.push(`${nameKey} < ${valueKey}`);
        values[valueKey] = val;
        break;
      case "between": {
        const [min, max] = val as [unknown, unknown];
        conditions.push(`${nameKey} BETWEEN ${valueKey}_min AND ${valueKey}_max`);
        values[`${valueKey}_min`] = min;
        values[`${valueKey}_max`] = max;
        break;
      }
      }
    } else {
      conditions.push(`${nameKey} = ${valueKey}`);
      values[valueKey] = value;
    }
  }

  return { expression: conditions.join(" AND "), names, values };
};

// Build PK string: typeName#field1#value1#field2#value2
const buildPK = (typeName: string, pkFields: string[], pkValue: Record<string, unknown>): string => {
  if (pkFields.length === 0) {
    return typeName;
  }
  let pk = typeName;
  for (const field of pkFields) {
    pk += `#${field}#${formatValue(pkValue[field])}`;
  }
  return pk;
};

interface QueryState {
  tableName: string;
  indexName?: string;
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, unknown>;
  _limit?: number;
  _cursor?: string;
  _reverse?: boolean;
  filterExpression?: string;
  filterAttributeNames?: Record<string, string>;
  filterAttributeValues?: Record<string, unknown>;
}

const createQuery = <T>(state: QueryState): Query<T> => ({
  limit: (n: number) => createQuery<T>({ ...state, _limit: n }),
  cursor: (c?: string) => createQuery<T>({ ...state, _cursor: c }),
  reverse: () => createQuery<T>({ ...state, _reverse: true }),
  filter: (f: Filter<T>) => {
    const { expression, names, values } = buildFilterExpression(f as Record<string, unknown>);
    return createQuery<T>({
      ...state,
      filterExpression: expression,
      filterAttributeNames: names,
      filterAttributeValues: values,
    });
  },
  build: () => ({
    tableName: state.tableName,
    indexName: state.indexName,
    keyConditionExpression: state.keyConditionExpression,
    expressionAttributeValues: state.expressionAttributeValues,
    limit: state._limit,
    cursor: state._cursor,
    reverse: state._reverse,
    filterExpression: state.filterExpression,
    filterAttributeNames: state.filterAttributeNames,
    filterAttributeValues: state.filterAttributeValues,
  }),
  async execute() {
    const result = await executeQuery<T>(this.build());
    return {
      items: result.items.map((item) => fromDdbItem(item)),
      cursor: result.cursor,
    };
  },
  async all() {
    const items: T[] = [];
    const params = this.build();

    do {
      const result = await executeQuery<T>(params);
      items.push(...result.items.map((item) => fromDdbItem(item)));
      params.cursor = result.cursor;
    } while (params.cursor);

    return items;
  },
  async count() {
    let total = 0;
    const params = this.build();

    do {
      const result = await executeCountQuery(params);
      total += result.count;
      params.cursor = result.cursor;
    } while (params.cursor);

    return total;
  },
});

export const buildQueryForKey = <T>(
  config: TableConfig,
  pkFields: string[],
  skFields: string[],
  indexName: string | undefined,
  pkValue: Record<string, unknown>,
  skFilter?: Record<string, unknown>
): Query<T> => {
  // Determine the correct key attribute names based on index
  const pkAttr = indexName ? `${indexName}_pk` : "pk";
  const skAttr = indexName ? `${indexName}_sk` : "sk";

  const pk = buildPK(config.typeName, pkFields, pkValue);
  const skCondition = buildSKCondition(skFields, skFilter, skAttr);

  let expression = `${pkAttr} = :pk`;
  const values: Record<string, unknown> = { ":pk": pk };

  if (skCondition) {
    expression += " AND " + skCondition.expression;
    Object.assign(values, skCondition.values);
  } else if (skFields.length === 0) {
    expression += ` AND ${skAttr} = :sk`;
    values[":sk"] = config.typeName;
  }

  return createQuery<T>({
    tableName: config.tableName,
    indexName,
    keyConditionExpression: expression,
    expressionAttributeValues: values,
  });
};
