import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

type RateLimitPeriod = "1m" | "5m" | "10m" | "30m" | "1h" | "6h" | "12h" | "1d" | "7d" | "30d";

// <contextKeys> can do <action> within <period>, <limit> times
type RateLimitRule = {
  limit: number;
  period: RateLimitPeriod;
  context: string | string[];
  action: string;
};

type RateLimitContext = Record<string, string>;

enum TimeScale {
  SECOND = 1000,
  MINUTE = 60 * SECOND,
  HOUR = 60 * MINUTE,
  DAY = 24 * HOUR,
  WEEK = 7 * DAY,
  YEAR = 365.25 * DAY,
  MONTH = YEAR / 12,
}
/**
 * Period to milliseconds mapping
 */
const PERIOD_TO_MS: Record<RateLimitPeriod, number> = {
  "1m": TimeScale.MINUTE,
  "5m": 5 * TimeScale.MINUTE,
  "10m": 10 * TimeScale.MINUTE,
  "30m": 30 * TimeScale.MINUTE,
  "1h": TimeScale.HOUR,
  "6h": 6 * TimeScale.HOUR,
  "12h": 12 * TimeScale.HOUR,
  "1d": TimeScale.DAY,
  "7d": 7 * TimeScale.DAY,
  "30d": 30 * TimeScale.DAY,
};

// DynamoDB Document Client setup
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const incrementAndGetCounter = async (key: string, ttl: number, increment = 1): Promise<number> => {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        pk: key,
        sk: "rateLimit",
      },
      UpdateExpression: "SET #counter = if_not_exists(#counter, :zero) + :inc, #ttl = if_not_exists(#ttl, :ttl)",
      ExpressionAttributeNames: {
        "#counter": "counter",
        "#ttl": "ttl",
      },
      ExpressionAttributeValues: {
        ":zero": 0,
        ":inc": increment,
        ":ttl": ttl,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return result.Attributes!.counter as number;
};

const baseDate = Date.UTC(2026);

// Returns number of periods since baseDate
const calcWindow = (period: RateLimitPeriod, currentMillis: number) => {
  const numMillis = currentMillis - baseDate;
  const periodMillis = PERIOD_TO_MS[period];
  const numPeriods = Math.floor(numMillis / periodMillis);
  return numPeriods.toString(36);
};

const enforce = async (rule: RateLimitRule, context: RateLimitContext, now: () => number = Date.now): Promise<void> => {
  const currentMillis = now();

  const principals = typeof rule.context === "string" ? [rule.context] : rule.context;
  const principal = principals.map((p) => context[p]).join("#");
  const window = calcWindow(rule.period, currentMillis);

  // period is added to key because windows can overlap and actions may not be unique
  const key = ["rl", rule.action, principal, rule.period, window].join("#");

  const ttl = Math.round((currentMillis + PERIOD_TO_MS[rule.period]) / 1000);
  const count = await incrementAndGetCounter(key, ttl);

  if (count > rule.limit) {
    throw new Error("Rate limit exceeded"); // TODO throw a specific error with action and retry again info
  }
};

export const rateLimiter = {
  enforce,
};
