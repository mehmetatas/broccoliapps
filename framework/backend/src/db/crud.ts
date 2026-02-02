import {
  executeBatchDelete,
  executeBatchGet,
  executeBatchPut,
  executeDelete,
  executeGet,
  executePut,
  executePutIfNotExists,
} from "./client";
import { buildPK, buildSK, fromDdbItem, toDdbItem, type ItemConfig } from "./item";
import { buildQueryForKey } from "./query";
import { TableConfig } from "./types";

export const createQueryFn = <T>(config: TableConfig) => {
  const { pk, sk, gsis } = config;

  const queryFn = (arg1?: Record<string, unknown>, arg2?: Record<string, unknown>) => {
    if (pk.length === 0) {
      return buildQueryForKey<T>(config, pk, sk, undefined, {}, arg1);
    }
    return buildQueryForKey<T>(config, pk, sk, undefined, arg1 ?? {}, arg2);
  };

  for (const [name, gsiConfig] of Object.entries(gsis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (queryFn as any)[name] = (pkValue: Record<string, unknown>, skFilter?: Record<string, unknown>) =>
      buildQueryForKey<T>(config, gsiConfig.pk, gsiConfig.sk, gsiConfig.index, pkValue, skFilter);
  }

  return queryFn;
};

export const createPutFn = <T>(config: ItemConfig) => {
  return async (item: T): Promise<T> => {
    const ddbItem = toDdbItem(config, item);
    await executePut<T>({ tableName: config.tableName, item: ddbItem });
    return item;
  };
};

export const createPutIfNotExistsFn = <T>(config: ItemConfig) => {
  return async (item: T): Promise<boolean> => {
    const ddbItem = toDdbItem(config, item);
    return executePutIfNotExists<T>({ tableName: config.tableName, item: ddbItem });
  };
};

export const createGetFn = <T>(config: ItemConfig) => {
  return async (pkValue: Record<string, unknown>, skValue?: Record<string, unknown>): Promise<T | undefined> => {
    const pk = buildPK(config.typeName, config.pk, pkValue);
    const sk = buildSK(config.typeName, config.sk, skValue ?? {});
    const item = await executeGet<T>({
      tableName: config.tableName,
      pk,
      sk,
    });
    return item ? fromDdbItem(item) : undefined;
  };
};

export const createDeleteFn = (config: ItemConfig) => {
  return async (pkValue: Record<string, unknown>, skValue?: Record<string, unknown>): Promise<void> => {
    const pk = buildPK(config.typeName, config.pk, pkValue);
    const sk = buildSK(config.typeName, config.sk, skValue ?? {});
    await executeDelete({
      tableName: config.tableName,
      pk,
      sk,
    });
  };
};

export const createBatchGetFn = <T>(config: ItemConfig) => {
  const hasPK = config.pk.length > 0;
  const hasSK = config.sk.length > 0;

  return async (keys: Record<string, unknown>[]): Promise<T[]> => {
    if (keys.length === 0) {
      return [];
    }

    // Build DDB keys
    const ddbKeys: { pk: string; sk: string }[] = [];
    for (const key of keys) {
      // For PK+SK tables: key is { pk: {...}, sk: {...} }
      // For PK-only or SK-only tables: key is flat { field1, field2, ... }
      const pkValue = hasPK && hasSK ? (key.pk as Record<string, unknown>) : hasPK ? key : {};
      const skValue = hasPK && hasSK ? (key.sk as Record<string, unknown>) ?? {} : hasSK ? key : {};

      const pk = buildPK(config.typeName, config.pk, pkValue);
      const sk = buildSK(config.typeName, config.sk, skValue);
      ddbKeys.push({ pk, sk });
    }

    // Batch requests (DynamoDB limit is 100)
    const batchSize = 100;
    const resultsMap = new Map<string, T>();

    for (let i = 0; i < ddbKeys.length; i += batchSize) {
      const batch = ddbKeys.slice(i, i + batchSize);
      const items = await executeBatchGet<T>({
        tableName: config.tableName,
        keys: batch,
      });

      for (const item of items) {
        const keyId = `${item.pk}:${item.sk}`;
        resultsMap.set(keyId, fromDdbItem(item));
      }
    }

    // Reorder to match input order
    const results: T[] = [];
    for (const key of ddbKeys) {
      const item = resultsMap.get(`${key.pk}:${key.sk}`);
      if (item) {
        results.push(item);
      }
    }
    return results;
  };
};

export const createBatchPutFn = <T>(config: ItemConfig) => {
  return async (items: T[]): Promise<void> => {
    if (items.length === 0) {
      return;
    }
    const ddbItems = items.map((item) => toDdbItem(config, item));
    await executeBatchPut<T>({ tableName: config.tableName, items: ddbItems });
  };
};

export const createBatchDeleteFn = (config: ItemConfig) => {
  const hasPK = config.pk.length > 0;
  const hasSK = config.sk.length > 0;

  return async (keys: Record<string, unknown>[]): Promise<void> => {
    console.log("Deleting: " + keys.length);
    if (keys.length === 0) {
      return;
    }
    const ddbKeys = keys.map((key) => {
      // For PK+SK tables: key is { pk: {...}, sk: {...} }
      // For PK-only or SK-only tables: key is flat { field1, field2, ... }
      const pkValue = hasPK && hasSK ? (key.pk as Record<string, unknown>) : hasPK ? key : {};
      const skValue = hasPK && hasSK ? (key.sk as Record<string, unknown>) ?? {} : hasSK ? key : {};

      return {
        pk: buildPK(config.typeName, config.pk, pkValue),
        sk: buildSK(config.typeName, config.sk, skValue),
      };
    });
    console.log("Deleting: " + ddbKeys.length);
    await executeBatchDelete({ tableName: config.tableName, keys: ddbKeys });
  };
};
