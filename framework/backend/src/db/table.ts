import {
  createBatchDeleteFn,
  createBatchGetFn,
  createBatchPutFn,
  createDeleteFn,
  createGetFn,
  createPutFn,
  createPutIfNotExistsFn,
  createQueryFn,
} from "./crud";
import type { TableBuilder, TableConfig } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const table = <T>(typeName: string, tableName = process.env.TABLE_NAME as string): TableBuilder<T> => {
  const config: TableConfig = {
    typeName,
    tableName,
    pk: [],
    sk: [],
    gsis: {},
  };

  const builder: TableBuilder<T, Any, Any, Any> = {
    key: (pk: string[], sk?: string[]) => {
      config.pk = pk;
      config.sk = sk ?? [];
      return builder;
    },

    gsi1: (name: string, pk: string[], sk?: string[]) => {
      config.gsis[name] = { index: "gsi1", pk, sk: sk ?? [] };
      return builder;
    },

    gsi2: (name: string, pk: string[], sk?: string[]) => {
      config.gsis[name] = { index: "gsi2", pk, sk: sk ?? [] };
      return builder;
    },

    gsi3: (name: string, pk: string[], sk?: string[]) => {
      config.gsis[name] = { index: "gsi3", pk, sk: sk ?? [] };
      return builder;
    },

    gsi4: (name: string, pk: string[], sk?: string[]) => {
      config.gsis[name] = { index: "gsi4", pk, sk: sk ?? [] };
      return builder;
    },

    gsi5: (name: string, pk: string[], sk?: string[]) => {
      config.gsis[name] = { index: "gsi5", pk, sk: sk ?? [] };
      return builder;
    },

    build: () => ({
      query: createQueryFn<T>(config),
      put: createPutFn<T>(config),
      putIfNotExists: createPutIfNotExistsFn<T>(config),
      batchPut: createBatchPutFn<T>(config),
      get: createGetFn<T>(config),
      delete: createDeleteFn(config),
      batchGet: createBatchGetFn<T>(config),
      batchDelete: createBatchDeleteFn(config),
    }),
  };

  return builder as TableBuilder<T>;
};
