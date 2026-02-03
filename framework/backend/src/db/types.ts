// DynamoDB item with internal fields
export type DdbItem<T> = T & {
  pk: string;
  sk: string;
  gsi1_pk?: string;
  gsi1_sk?: string;
  gsi2_pk?: string;
  gsi2_sk?: string;
  gsi3_pk?: string;
  gsi3_sk?: string;
  gsi4_pk?: string;
  gsi4_sk?: string;
  gsi5_pk?: string;
  gsi5_sk?: string;
  _type: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type EmptyObject = {};

// Operator types for SK conditions
export type SKOperator<V> = { beginsWith: V } | { gte: V } | { lte: V } | { gt: V } | { lt: V };

// Filter operator (extends SK operator with between)
export type FilterOperator<V> = { beginsWith: V } | { gte: V } | { lte: V } | { gt: V } | { lt: V } | { between: [V, V] };

// Filter value - exact match or operator
export type FilterValue<T, K extends keyof T> = T[K] | FilterOperator<T[K]>;

// Filter object - partial with operators
export type Filter<T> = {
  [K in keyof T]?: FilterValue<T, K>;
};

// Query result type
export interface QueryResult<T> {
  items: T[];
  cursor?: string;
}

// Raw query data returned by build()
export interface QueryData {
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

// Query object - holds query parameters and can be executed
export interface Query<T> {
  // Chainable methods
  limit(n: number): Query<T>;
  cursor(c?: string): Query<T>;
  reverse(): Query<T>;
  filter(f: Filter<T>): Query<T>;

  // Inspection
  build(): QueryData;

  // Execution
  execute(): Promise<QueryResult<T>>;
  all(): Promise<T[]>;
  count(): Promise<number>;
}

// Forbid all SK fields (truly empty SK filter)
export type SKEmpty<T, Fields extends readonly (keyof T)[]> = {
  [K in Fields[number]]?: never;
} & { between?: never };

// Build prefix types from a tuple: [A, B, C] => {A, !B, !C} | {A, B, !C} | {A, B, C}
// Each level requires previous fields and forbids later fields
export type SKPrefixExact<
  T,
  Fields extends readonly (keyof T)[],
  Required extends object = EmptyObject,
  AllFields extends keyof T = Fields[number],
> = Fields extends readonly []
  ? never
  : Fields extends readonly [infer First extends keyof T]
    ? Required & { [K in First]: T[K] } & { [K in Exclude<AllFields, First | keyof Required>]?: never } & {
        between?: never;
      }
    : Fields extends readonly [infer First extends keyof T, ...infer Rest extends (keyof T)[]]
      ?
          | // Current field only (forbid rest)
          (Required & { [K in First]: T[K] } & { [K in Exclude<AllFields, First | keyof Required>]?: never } & {
              between?: never;
            })
          // Or continue to next field
          | SKPrefixExact<T, Rest, Required & { [K in First]: T[K] }, AllFields>
      : never;

// Build prefix types where last field has operator
// For [A, B, C]: {A: Op, !B, !C} | {A, B: Op, !C} | {A, B, C: Op}
export type SKPrefixWithOperator<
  T,
  Fields extends readonly (keyof T)[],
  Required extends object = EmptyObject,
  AllFields extends keyof T = Fields[number],
> = Fields extends readonly []
  ? never
  : Fields extends readonly [infer First extends keyof T]
    ? Required & { [K in First]: SKOperator<T[K]> } & { [K in Exclude<AllFields, First | keyof Required>]?: never } & {
        between?: never;
      }
    : Fields extends readonly [infer First extends keyof T, ...infer Rest extends (keyof T)[]]
      ?
          | // Operator on current field (forbid rest)
          (Required & { [K in First]: SKOperator<T[K]> } & {
              [K in Exclude<AllFields, First | keyof Required>]?: never;
            } & { between?: never })
          // Or exact on current, continue to next
          | SKPrefixWithOperator<T, Rest, Required & { [K in First]: T[K] }, AllFields>
      : never;

// Between bound type - partial prefix of fields
export type SKBetweenBound<T, Fields extends readonly (keyof T)[], AllFields extends keyof T = Fields[number]> = Fields extends readonly []
  ? { [K in AllFields]?: never }
  : Fields extends readonly [infer First extends keyof T]
    ? { [K in AllFields]?: never } | ({ [K in First]: T[K] } & { [K in Exclude<AllFields, First>]?: never })
    : Fields extends readonly [infer First extends keyof T, ...infer Rest extends (keyof T)[]]
      ?
          | { [K in AllFields]?: never }
          | ({ [K in First]: T[K] } & { [K in Exclude<AllFields, First>]?: never })
          | ({ [K in First]: T[K] } & SKBetweenBound<T, Rest, Exclude<AllFields, First>>)
      : never;

// Between query type
export type SKBetween<T, Fields extends readonly (keyof T)[]> = {
  between: [SKBetweenBound<T, Fields>, SKBetweenBound<T, Fields>];
} & { [K in Fields[number]]?: never };

// Combined SK filter type
export type SKFilter<T, Fields extends readonly (keyof T)[]> = Fields extends readonly []
  ? never
  : SKEmpty<T, Fields> | SKPrefixExact<T, Fields> | SKPrefixWithOperator<T, Fields> | SKBetween<T, Fields>;

// PK value type - all fields required with exact values
export type PKValue<T, Fields extends readonly (keyof T)[]> = {
  [K in Fields[number]]: T[K];
};

// Query function for table with PK only (no SK fields)
export interface QueryFnPKOnly<T, PKFields extends readonly (keyof T)[]> {
  (pk: PKValue<T, PKFields>): Query<T>;
}

// Query function for table with PK and SK
export interface QueryFnPKSK<T, PKFields extends readonly (keyof T)[], SKFields extends readonly (keyof T)[]> {
  (pk: PKValue<T, PKFields>): Query<T>;
  (pk: PKValue<T, PKFields>, sk: SKFilter<T, SKFields>): Query<T>;
}

// Query function for table with no key (just typeName)
export interface QueryFnNoKey<T> {
  (): Query<T>;
}

// Query function for table with SK only (no PK fields)
export interface QueryFnSKOnly<T, SKFields extends readonly (keyof T)[]> {
  (): Query<T>;
  (sk: SKFilter<T, SKFields>): Query<T>;
}

// Put function type
export interface PutFn<T> {
  (item: T): Promise<T>;
}

// PutIfNotExists function type - returns true if created, false if already exists
export interface PutIfNotExistsFn<T> {
  (item: T): Promise<boolean>;
}

// BatchPut function type
export interface BatchPutFn<T> {
  (items: T[]): Promise<void>;
}

// Get function for table with PK only (no SK fields)
export interface GetFnPKOnly<T, PKFields extends readonly (keyof T)[]> {
  (pk: PKValue<T, PKFields>): Promise<T | undefined>;
}

// Get function for table with PK and SK
export interface GetFnPKSK<T, PKFields extends readonly (keyof T)[], SKFields extends readonly (keyof T)[]> {
  (pk: PKValue<T, PKFields>, sk: PKValue<T, SKFields>): Promise<T | undefined>;
}

// Get function for table with no key (just typeName)
export interface GetFnNoKey<T> {
  (): Promise<T | undefined>;
}

// Get function for table with SK only (no PK fields)
export interface GetFnSKOnly<T, SKFields extends readonly (keyof T)[]> {
  (sk: PKValue<T, SKFields>): Promise<T | undefined>;
}

// Delete function for table with PK only (no SK fields)
export interface DeleteFnPKOnly<T, PKFields extends readonly (keyof T)[]> {
  (pk: PKValue<T, PKFields>): Promise<void>;
}

// Delete function for table with PK and SK
export interface DeleteFnPKSK<T, PKFields extends readonly (keyof T)[], SKFields extends readonly (keyof T)[]> {
  (pk: PKValue<T, PKFields>, sk: PKValue<T, SKFields>): Promise<void>;
}

// Delete function for table with no key (just typeName)
export interface DeleteFnNoKey {
  (): Promise<void>;
}

// Delete function for table with SK only (no PK fields)
export interface DeleteFnSKOnly<T, SKFields extends readonly (keyof T)[]> {
  (sk: PKValue<T, SKFields>): Promise<void>;
}

// BatchGet function for table with PK only (no SK fields)
export interface BatchGetFnPKOnly<T, PKFields extends readonly (keyof T)[]> {
  (keys: PKValue<T, PKFields>[]): Promise<T[]>;
}

// BatchGet function for table with PK and SK
export interface BatchGetFnPKSK<T, PKFields extends readonly (keyof T)[], SKFields extends readonly (keyof T)[]> {
  (keys: { pk: PKValue<T, PKFields>; sk: PKValue<T, SKFields> }[]): Promise<T[]>;
}

// BatchGet function for table with no key (just typeName) - not useful but for completeness
export interface BatchGetFnNoKey<T> {
  (): Promise<T[]>;
}

// BatchGet function for table with SK only (no PK fields)
export interface BatchGetFnSKOnly<T, SKFields extends readonly (keyof T)[]> {
  (keys: PKValue<T, SKFields>[]): Promise<T[]>;
}

// BatchDelete function for table with PK only (no SK fields)
export interface BatchDeleteFnPKOnly<T, PKFields extends readonly (keyof T)[]> {
  (keys: PKValue<T, PKFields>[]): Promise<void>;
}

// BatchDelete function for table with PK and SK
export interface BatchDeleteFnPKSK<T, PKFields extends readonly (keyof T)[], SKFields extends readonly (keyof T)[]> {
  (keys: { pk: PKValue<T, PKFields>; sk: PKValue<T, SKFields> }[]): Promise<void>;
}

// BatchDelete function for table with no key (just typeName)
export interface BatchDeleteFnNoKey {
  (): Promise<void>;
}

// BatchDelete function for table with SK only (no PK fields)
export interface BatchDeleteFnSKOnly<T, SKFields extends readonly (keyof T)[]> {
  (keys: PKValue<T, SKFields>[]): Promise<void>;
}

// Table builder interface
export interface TableBuilder<T, PKFields extends readonly (keyof T)[] = readonly [], SKFields extends readonly (keyof T)[] = readonly [], GSIs = EmptyObject> {
  // Set key with just PK fields
  key<const PK extends readonly (keyof T)[]>(pk: PK): TableBuilder<T, PK, readonly [], GSIs>;

  // Set key with PK and SK fields
  key<const PK extends readonly (keyof T)[], const SK extends readonly (keyof T)[]>(pk: PK, sk: SK): TableBuilder<T, PK, SK, GSIs>;

  // Add GSI with just PK
  gsi1<Name extends string, const GPK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKOnly<T, GPK>>>;
  gsi1<Name extends string, const GPK extends readonly (keyof T)[], const GSK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
    sk: GSK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKSK<T, GPK, GSK>>>;

  gsi2<Name extends string, const GPK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKOnly<T, GPK>>>;
  gsi2<Name extends string, const GPK extends readonly (keyof T)[], const GSK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
    sk: GSK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKSK<T, GPK, GSK>>>;

  gsi3<Name extends string, const GPK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKOnly<T, GPK>>>;
  gsi3<Name extends string, const GPK extends readonly (keyof T)[], const GSK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
    sk: GSK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKSK<T, GPK, GSK>>>;

  gsi4<Name extends string, const GPK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKOnly<T, GPK>>>;
  gsi4<Name extends string, const GPK extends readonly (keyof T)[], const GSK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
    sk: GSK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKSK<T, GPK, GSK>>>;

  gsi5<Name extends string, const GPK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKOnly<T, GPK>>>;
  gsi5<Name extends string, const GPK extends readonly (keyof T)[], const GSK extends readonly (keyof T)[]>(
    name: Name,
    pk: GPK,
    sk: GSK,
  ): TableBuilder<T, PKFields, SKFields, GSIs & Record<Name, QueryFnPKSK<T, GPK, GSK>>>;

  build(): {
    query: (PKFields extends readonly []
      ? SKFields extends readonly []
        ? QueryFnNoKey<T>
        : QueryFnSKOnly<T, SKFields>
      : SKFields extends readonly []
        ? QueryFnPKOnly<T, PKFields>
        : QueryFnPKSK<T, PKFields, SKFields>) &
      GSIs;
    put: PutFn<T>;
    putIfNotExists: PutIfNotExistsFn<T>;
    batchPut: BatchPutFn<T>;
    get: PKFields extends readonly []
      ? SKFields extends readonly []
        ? GetFnNoKey<T>
        : GetFnSKOnly<T, SKFields>
      : SKFields extends readonly []
        ? GetFnPKOnly<T, PKFields>
        : GetFnPKSK<T, PKFields, SKFields>;
    delete: PKFields extends readonly []
      ? SKFields extends readonly []
        ? DeleteFnNoKey
        : DeleteFnSKOnly<T, SKFields>
      : SKFields extends readonly []
        ? DeleteFnPKOnly<T, PKFields>
        : DeleteFnPKSK<T, PKFields, SKFields>;
    batchGet: PKFields extends readonly []
      ? SKFields extends readonly []
        ? BatchGetFnNoKey<T>
        : BatchGetFnSKOnly<T, SKFields>
      : SKFields extends readonly []
        ? BatchGetFnPKOnly<T, PKFields>
        : BatchGetFnPKSK<T, PKFields, SKFields>;
    batchDelete: PKFields extends readonly []
      ? SKFields extends readonly []
        ? BatchDeleteFnNoKey
        : BatchDeleteFnSKOnly<T, SKFields>
      : SKFields extends readonly []
        ? BatchDeleteFnPKOnly<T, PKFields>
        : BatchDeleteFnPKSK<T, PKFields, SKFields>;
  };
}

export interface TableConfig {
  typeName: string;
  tableName: string;
  pk: string[];
  sk: string[];
  gsis: Record<string, { index: string; pk: string[]; sk: string[] }>;
}
