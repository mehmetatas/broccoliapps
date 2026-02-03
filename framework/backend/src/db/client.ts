import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { DdbItem, QueryResult } from "./types";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export interface QueryParams {
  tableName: string;
  indexName?: string;
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, unknown>;
  limit?: number;
  cursor?: string;
  reverse?: boolean;
  filterExpression?: string;
  filterAttributeNames?: Record<string, string>;
  filterAttributeValues?: Record<string, unknown>;
}

const encodeCursor = (key: Record<string, unknown> | undefined): string | undefined =>
  key ? Buffer.from(JSON.stringify(key)).toString("base64url") : undefined;

const decodeCursor = (cursor: string | undefined): Record<string, unknown> | undefined =>
  cursor ? JSON.parse(Buffer.from(cursor, "base64url").toString()) : undefined;

const buildQueryInput = (params: QueryParams): QueryCommandInput => ({
  TableName: params.tableName,
  IndexName: params.indexName,
  KeyConditionExpression: params.keyConditionExpression,
  ExpressionAttributeValues: {
    ...params.expressionAttributeValues,
    ...params.filterAttributeValues,
  },
  ExpressionAttributeNames: params.filterAttributeNames,
  FilterExpression: params.filterExpression || undefined,
  ExclusiveStartKey: decodeCursor(params.cursor),
});

export const executeQuery = async <T>(params: QueryParams): Promise<QueryResult<DdbItem<T>>> => {
  const queryInput = {
    ...buildQueryInput(params),
    Limit: params.limit,
    ScanIndexForward: !params.reverse,
  };

  // log.dbg("Executing query", { queryInput });

  const response = await docClient.send(new QueryCommand(queryInput));

  return {
    items: (response.Items ?? []) as DdbItem<T>[],
    cursor: encodeCursor(response.LastEvaluatedKey),
  };
};

export interface CountResult {
  count: number;
  cursor?: string;
}

export const executeCountQuery = async (params: QueryParams): Promise<CountResult> => {
  const response = await docClient.send(
    new QueryCommand({
      ...buildQueryInput(params),
      Select: "COUNT",
    }),
  );

  return {
    count: response.Count ?? 0,
    cursor: encodeCursor(response.LastEvaluatedKey),
  };
};

export interface PutParams<T> {
  tableName: string;
  item: DdbItem<T>;
}

export const executePut = async <T>(params: PutParams<T>): Promise<void> => {
  await docClient.send(
    new PutCommand({
      TableName: params.tableName,
      Item: params.item,
    }),
  );
};

export const executePutIfNotExists = async <T>(params: PutParams<T>): Promise<boolean> => {
  try {
    await docClient.send(
      new PutCommand({
        TableName: params.tableName,
        Item: params.item,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      }),
    );
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw error;
  }
};

export interface GetParams {
  tableName: string;
  pk: string;
  sk: string;
}

export const executeGet = async <T>(params: GetParams): Promise<DdbItem<T> | undefined> => {
  const response = await docClient.send(
    new GetCommand({
      TableName: params.tableName,
      Key: { pk: params.pk, sk: params.sk },
    }),
  );
  return response.Item as DdbItem<T> | undefined;
};

export interface DeleteParams {
  tableName: string;
  pk: string;
  sk: string;
}

export const executeDelete = async (params: DeleteParams): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: params.tableName,
      Key: { pk: params.pk, sk: params.sk },
    }),
  );
};

export interface BatchGetParams {
  tableName: string;
  keys: { pk: string; sk: string }[];
}

export const executeBatchGet = async <T>(params: BatchGetParams): Promise<DdbItem<T>[]> => {
  const keys = uniqueByKey(params.keys);

  if (keys.length === 0) {
    return [];
  }

  const response = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [params.tableName]: {
          Keys: keys.map((key) => ({ pk: key.pk, sk: key.sk })),
        },
      },
    }),
  );

  return (response.Responses?.[params.tableName] ?? []) as DdbItem<T>[];
};

export interface BatchPutParams<T> {
  tableName: string;
  items: DdbItem<T>[];
}

export const executeBatchPut = async <T>(params: BatchPutParams<T>): Promise<void> => {
  const items = uniqueByKey(params.items);

  if (items.length === 0) {
    return;
  }

  const batchSize = 25; // DynamoDB limit for batch writes
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [params.tableName]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      }),
    );
  }
};

export interface BatchDeleteParams {
  tableName: string;
  keys: { pk: string; sk: string }[];
}

export const executeBatchDelete = async (params: BatchDeleteParams): Promise<void> => {
  console.log("Deleting: " + params.keys.length);
  console.log("Deleting: " + params.keys.slice(0, 10).map((c) => JSON.stringify(c)));
  const keys = uniqueByKey(params.keys);
  console.log("Deleting: " + keys.length);

  if (keys.length === 0) {
    return;
  }

  const batchSize = 25; // DynamoDB limit for batch writes
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    console.log("Deleting: " + batch.length);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [params.tableName]: batch.map((key) => ({
            DeleteRequest: { Key: { pk: key.pk, sk: key.sk } },
          })),
        },
      }),
    );
  }
};

const uniqueByKey = (items: { pk: string; sk: string }[]): { pk: string; sk: string }[] => {
  const unique = new Set<string>();
  return items.filter(({ pk, sk }) => {
    const pkSk = `${pk}:${sk}`;
    if (unique.has(pkSk)) {
      return false;
    }
    unique.add(pkSk);
    return true;
  });
};
