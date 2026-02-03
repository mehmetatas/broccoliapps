import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { executeBatchDelete, executeBatchGet, executeBatchPut } from "./client";
import { buildPK, buildSK, formatValue } from "./item";
import { table } from "./table";

// Set AWS environment before any imports that use AWS SDK
process.env.AWS_PROFILE = "appi";
process.env.AWS_REGION = "us-west-2";
process.env.TABLE_NAME = "broccoliapps-com";

const TEST_PREFIX = `test-${Date.now()}`;

interface TestItem {
  id: string;
  status: string;
  email: string;
  name: string;
  score: number;
}

// Track created items for cleanup
const createdKeys: { pk: { id: string }; sk: { status: string } }[] = [];

const testTable = table<TestItem>("integration-test", "broccoliapps-com").key(["id"], ["status"]).build();

const createTestItem = (index: number, status = "active"): TestItem => ({
  id: `${TEST_PREFIX}-${index}`,
  status,
  email: `test${index}@example.com`,
  name: `Test User ${index}`,
  score: index * 10,
});

describe("DynamoDB Integration Tests", () => {
  afterAll(async () => {
    // Cleanup all created items
    if (createdKeys.length > 0) {
      await testTable.batchDelete(createdKeys);
    }
  });

  describe("put and get operations", () => {
    it("should put and get a single item", async () => {
      const item = createTestItem(1);
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      await testTable.put(item);
      const retrieved = await testTable.get({ id: item.id }, { status: item.status });

      expect(retrieved).toEqual(item);
    });

    it("should return undefined for non-existent item", async () => {
      const result = await testTable.get({ id: `${TEST_PREFIX}-nonexistent` }, { status: "active" });
      expect(result).toBeUndefined();
    });

    it("should overwrite existing item with put", async () => {
      const item = createTestItem(2);
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      await testTable.put(item);

      const updatedItem = { ...item, name: "Updated Name", score: 999 };
      await testTable.put(updatedItem);

      const retrieved = await testTable.get({ id: item.id }, { status: item.status });
      expect(retrieved).toEqual(updatedItem);
    });
  });

  describe("putIfNotExists", () => {
    it("should create item when it does not exist", async () => {
      const item = createTestItem(3);
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      const created = await testTable.putIfNotExists(item);
      expect(created).toBe(true);

      const retrieved = await testTable.get({ id: item.id }, { status: item.status });
      expect(retrieved).toEqual(item);
    });

    it("should return false when item already exists", async () => {
      const item = createTestItem(4);
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      await testTable.put(item);
      const created = await testTable.putIfNotExists({ ...item, name: "Should Not Update" });

      expect(created).toBe(false);

      const retrieved = await testTable.get({ id: item.id }, { status: item.status });
      expect(retrieved?.name).toBe(item.name); // Original name unchanged
    });
  });

  describe("delete operations", () => {
    it("should delete an existing item", async () => {
      const item = createTestItem(5);

      await testTable.put(item);
      const beforeDelete = await testTable.get({ id: item.id }, { status: item.status });
      expect(beforeDelete).toBeDefined();

      await testTable.delete({ id: item.id }, { status: item.status });

      const afterDelete = await testTable.get({ id: item.id }, { status: item.status });
      expect(afterDelete).toBeUndefined();
    });

    it("should not throw when deleting non-existent item", async () => {
      await expect(testTable.delete({ id: `${TEST_PREFIX}-nonexistent-delete` }, { status: "active" })).resolves.toBeUndefined();
    });
  });

  describe("query operations", () => {
    const queryPrefix = `${TEST_PREFIX}-query`;

    beforeAll(async () => {
      // Create test items for query tests
      const items: TestItem[] = [
        { id: queryPrefix, status: "active", email: "a@test.com", name: "Alice", score: 100 },
        { id: queryPrefix, status: "inactive", email: "b@test.com", name: "Bob", score: 50 },
        { id: queryPrefix, status: "pending", email: "c@test.com", name: "Charlie", score: 75 },
      ];

      for (const item of items) {
        await testTable.put(item);
        createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });
      }
    });

    it("should query items by PK", async () => {
      const result = await testTable.query({ id: queryPrefix }).execute();
      expect(result.items.length).toBe(3);
    });

    it("should query with SK exact match", async () => {
      const result = await testTable.query({ id: queryPrefix }, { status: "active" }).execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.name).toBe("Alice");
    });

    it("should query with SK beginsWith", async () => {
      const result = await testTable.query({ id: queryPrefix }, { status: { beginsWith: "a" } }).execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.status).toBe("active");
    });

    it("should query with limit", async () => {
      const result = await testTable.query({ id: queryPrefix }).limit(2).execute();
      expect(result.items.length).toBe(2);
      expect(result.cursor).toBeDefined();
    });

    it("should query with cursor pagination", async () => {
      const page1 = await testTable.query({ id: queryPrefix }).limit(1).execute();
      expect(page1.items.length).toBe(1);
      expect(page1.cursor).toBeDefined();

      const page2 = await testTable.query({ id: queryPrefix }).limit(1).cursor(page1.cursor!).execute();
      expect(page2.items.length).toBe(1);
      expect(page2.items[0]!.status).not.toBe(page1.items[0]!.status);
    });

    it("should query in reverse order", async () => {
      const forward = await testTable.query({ id: queryPrefix }).execute();
      const reverse = await testTable.query({ id: queryPrefix }).reverse().execute();

      expect(reverse.items.length).toBe(forward.items.length);
      expect(reverse.items[0]!.status).toBe(forward.items[forward.items.length - 1]!.status);
    });

    it("should query with filter", async () => {
      const result = await testTable
        .query({ id: queryPrefix })
        .filter({ score: { gte: 75 } })
        .execute();
      expect(result.items.length).toBe(2);
      expect(result.items.every((item) => item.score >= 75)).toBe(true);
    });

    it("should get all items with all()", async () => {
      const items = await testTable.query({ id: queryPrefix }).all();
      expect(items.length).toBe(3);
    });

    it("should count items", async () => {
      const count = await testTable.query({ id: queryPrefix }).count();
      expect(count).toBe(3);
    });
  });

  describe("batch operations", () => {
    describe("batchPut", () => {
      it("should put multiple items in batch", async () => {
        const items = [createTestItem(100), createTestItem(101), createTestItem(102)];

        for (const item of items) {
          createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });
        }

        await testTable.batchPut(items);

        // Verify all items exist
        for (const item of items) {
          const retrieved = await testTable.get({ id: item.id }, { status: item.status });
          expect(retrieved).toEqual(item);
        }
      });

      it("should handle empty array", async () => {
        await expect(testTable.batchPut([])).resolves.toBeUndefined();
      });

      it("should handle batches larger than 25 items", async () => {
        const items = Array.from({ length: 30 }, (_, i) => createTestItem(200 + i));

        for (const item of items) {
          createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });
        }

        await testTable.batchPut(items);

        // Verify first and last items
        const first = await testTable.get({ id: items[0]!.id }, { status: items[0]!.status });
        const last = await testTable.get({ id: items[29]!.id }, { status: items[29]!.status });

        expect(first).toEqual(items[0]);
        expect(last).toEqual(items[29]);
      });
    });

    describe("batchGet", () => {
      const batchGetPrefix = `${TEST_PREFIX}-batchget`;

      beforeAll(async () => {
        const items = Array.from({ length: 5 }, (_, i) => ({
          id: `${batchGetPrefix}-${i}`,
          status: "active",
          email: `batch${i}@test.com`,
          name: `Batch User ${i}`,
          score: i * 10,
        }));

        for (const item of items) {
          createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });
        }

        await testTable.batchPut(items);
      });

      it("should get multiple items in batch", async () => {
        const keys = [
          { pk: { id: `${batchGetPrefix}-0` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-1` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-2` }, sk: { status: "active" } },
        ];

        const results = await testTable.batchGet(keys);
        expect(results.length).toBe(3);
      });

      it("should handle empty array", async () => {
        const results = await testTable.batchGet([]);
        expect(results).toEqual([]);
      });

      it("should deduplicate keys", async () => {
        const keys = [
          { pk: { id: `${batchGetPrefix}-0` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-0` }, sk: { status: "active" } }, // Duplicate
          { pk: { id: `${batchGetPrefix}-1` }, sk: { status: "active" } },
        ];

        const results = await testTable.batchGet(keys);
        expect(results.length).toBe(2);
      });

      it("should preserve order matching input keys", async () => {
        const keys = [
          { pk: { id: `${batchGetPrefix}-2` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-0` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-1` }, sk: { status: "active" } },
        ];

        const results = await testTable.batchGet(keys);
        expect(results[0]?.id).toBe(`${batchGetPrefix}-2`);
        expect(results[1]?.id).toBe(`${batchGetPrefix}-0`);
        expect(results[2]?.id).toBe(`${batchGetPrefix}-1`);
      });

      it("should skip non-existent items", async () => {
        const keys = [
          { pk: { id: `${batchGetPrefix}-0` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-nonexistent` }, sk: { status: "active" } },
          { pk: { id: `${batchGetPrefix}-1` }, sk: { status: "active" } },
        ];

        const results = await testTable.batchGet(keys);
        expect(results.length).toBe(2);
      });
    });

    describe("batchDelete", () => {
      it("should delete multiple items in batch", async () => {
        const items = [createTestItem(300), createTestItem(301), createTestItem(302)];

        await testTable.batchPut(items);

        // Verify items exist
        for (const item of items) {
          const exists = await testTable.get({ id: item.id }, { status: item.status });
          expect(exists).toBeDefined();
        }

        const keys = items.map((item) => ({ pk: { id: item.id }, sk: { status: item.status } }));
        await testTable.batchDelete(keys);

        // Verify items are deleted
        for (const item of items) {
          const exists = await testTable.get({ id: item.id }, { status: item.status });
          expect(exists).toBeUndefined();
        }
      });

      it("should handle empty array", async () => {
        await expect(testTable.batchDelete([])).resolves.toBeUndefined();
      });

      it("should handle batches larger than 25 items", async () => {
        const items = Array.from({ length: 30 }, (_, i) => createTestItem(400 + i));

        await testTable.batchPut(items);

        const keys = items.map((item) => ({ pk: { id: item.id }, sk: { status: item.status } }));
        await testTable.batchDelete(keys);

        // Verify first and last items are deleted
        const first = await testTable.get({ id: items[0]!.id }, { status: items[0]!.status });
        const last = await testTable.get({ id: items[29]!.id }, { status: items[29]!.status });

        expect(first).toBeUndefined();
        expect(last).toBeUndefined();
      });
    });
  });

  describe("SK operators", () => {
    const skPrefix = `${TEST_PREFIX}-skops`;

    beforeAll(async () => {
      const items: TestItem[] = [
        { id: skPrefix, status: "a", email: "a@test.com", name: "A", score: 10 },
        { id: skPrefix, status: "b", email: "b@test.com", name: "B", score: 20 },
        { id: skPrefix, status: "c", email: "c@test.com", name: "C", score: 30 },
        { id: skPrefix, status: "d", email: "d@test.com", name: "D", score: 40 },
        { id: skPrefix, status: "e", email: "e@test.com", name: "E", score: 50 },
      ];

      for (const item of items) {
        await testTable.put(item);
        createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });
      }
    });

    it("should query with gte operator", async () => {
      const result = await testTable.query({ id: skPrefix }, { status: { gte: "c" } }).execute();
      expect(result.items.length).toBe(3);
      expect(result.items.map((i) => i.status)).toEqual(["c", "d", "e"]);
    });

    it("should query with lte operator", async () => {
      const result = await testTable.query({ id: skPrefix }, { status: { lte: "c" } }).execute();
      expect(result.items.length).toBe(3);
      expect(result.items.map((i) => i.status)).toEqual(["a", "b", "c"]);
    });

    it("should query with gt operator", async () => {
      const result = await testTable.query({ id: skPrefix }, { status: { gt: "c" } }).execute();
      expect(result.items.length).toBe(2);
      expect(result.items.map((i) => i.status)).toEqual(["d", "e"]);
    });

    it("should query with lt operator", async () => {
      const result = await testTable.query({ id: skPrefix }, { status: { lt: "c" } }).execute();
      expect(result.items.length).toBe(2);
      expect(result.items.map((i) => i.status)).toEqual(["a", "b"]);
    });

    it("should query with between operator", async () => {
      const result = await testTable.query({ id: skPrefix }, { between: [{ status: "b" }, { status: "d" }] }).execute();
      expect(result.items.length).toBe(3);
      expect(result.items.map((i) => i.status)).toEqual(["b", "c", "d"]);
    });

    it("should query with empty SK filter", async () => {
      const result = await testTable.query({ id: skPrefix }, {}).execute();
      expect(result.items.length).toBe(5);
    });
  });

  describe("filter operators", () => {
    const filterPrefix = `${TEST_PREFIX}-filter`;

    beforeAll(async () => {
      const items: TestItem[] = [
        { id: filterPrefix, status: "1", email: "alice@test.com", name: "Alice", score: 100 },
        { id: filterPrefix, status: "2", email: "bob@test.com", name: "Bob", score: 200 },
        { id: filterPrefix, status: "3", email: "charlie@test.com", name: "Charlie", score: 300 },
      ];

      for (const item of items) {
        await testTable.put(item);
        createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });
      }
    });

    it("should filter with exact match", async () => {
      const result = await testTable.query({ id: filterPrefix }).filter({ name: "Bob" }).execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.name).toBe("Bob");
    });

    it("should filter with beginsWith", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ email: { beginsWith: "a" } })
        .execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.email).toBe("alice@test.com");
    });

    it("should filter with gte", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ score: { gte: 200 } })
        .execute();
      expect(result.items.length).toBe(2);
    });

    it("should filter with lte", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ score: { lte: 200 } })
        .execute();
      expect(result.items.length).toBe(2);
    });

    it("should filter with gt", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ score: { gt: 200 } })
        .execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.score).toBe(300);
    });

    it("should filter with lt", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ score: { lt: 200 } })
        .execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.score).toBe(100);
    });

    it("should filter with between", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ score: { between: [150, 250] } })
        .execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.score).toBe(200);
    });

    it("should combine multiple filters", async () => {
      const result = await testTable
        .query({ id: filterPrefix })
        .filter({ score: { gte: 100 }, name: { beginsWith: "B" } })
        .execute();
      expect(result.items.length).toBe(1);
      expect(result.items[0]?.name).toBe("Bob");
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in values", async () => {
      const item: TestItem = {
        id: `${TEST_PREFIX}-special`,
        status: "test#with#hashes",
        email: "test+special@example.com",
        name: "Test & Special <chars>",
        score: 0,
      };
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      await testTable.put(item);
      const retrieved = await testTable.get({ id: item.id }, { status: item.status });

      expect(retrieved).toEqual(item);
    });

    it("should handle numeric values correctly", async () => {
      const item: TestItem = {
        id: `${TEST_PREFIX}-numeric`,
        status: "active",
        email: "numeric@test.com",
        name: "Numeric Test",
        score: -999.99,
      };
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      await testTable.put(item);
      const retrieved = await testTable.get({ id: item.id }, { status: item.status });

      expect(retrieved?.score).toBe(-999.99);
    });

    it("should handle empty string values", async () => {
      const item: TestItem = {
        id: `${TEST_PREFIX}-empty`,
        status: "active",
        email: "",
        name: "",
        score: 0,
      };
      createdKeys.push({ pk: { id: item.id }, sk: { status: item.status } });

      await testTable.put(item);
      const retrieved = await testTable.get({ id: item.id }, { status: item.status });

      expect(retrieved?.email).toBe("");
      expect(retrieved?.name).toBe("");
    });
  });
});

// Direct client function tests for coverage
describe("Client functions direct tests", () => {
  it("executeBatchGet should return empty array for empty keys", async () => {
    const result = await executeBatchGet({ tableName: "broccoliapps-com", keys: [] });
    expect(result).toEqual([]);
  });

  it("executeBatchPut should handle empty items array", async () => {
    await expect(executeBatchPut({ tableName: "broccoliapps-com", items: [] })).resolves.toBeUndefined();
  });

  it("executeBatchDelete should handle empty keys array", async () => {
    await expect(executeBatchDelete({ tableName: "broccoliapps-com", keys: [] })).resolves.toBeUndefined();
  });
});

// Item utility function tests
describe("Item utility functions", () => {
  describe("formatValue", () => {
    it("should pad numbers to 16 characters", () => {
      expect(formatValue(123)).toBe("0000000000000123");
      expect(formatValue(0)).toBe("0000000000000000");
      expect(formatValue(999999999999)).toBe("0000999999999999");
    });

    it("should handle string values as-is", () => {
      expect(formatValue("hello")).toBe("hello");
      expect(formatValue("")).toBe("");
    });
  });

  describe("buildPK", () => {
    it("should return just typeName when no PK fields", () => {
      expect(buildPK("user", [], {})).toBe("user");
    });

    it("should build PK with single field", () => {
      expect(buildPK("user", ["id"], { id: "123" })).toBe("user#id#123");
    });

    it("should build PK with multiple fields", () => {
      expect(buildPK("order", ["userId", "orderId"], { userId: "u1", orderId: "o1" })).toBe("order#userId#u1#orderId#o1");
    });

    it("should format numeric values in PK", () => {
      expect(buildPK("item", ["count"], { count: 42 })).toBe("item#count#0000000000000042");
    });
  });

  describe("buildSK", () => {
    it("should return typeName when no SK fields", () => {
      expect(buildSK("user", [], {})).toBe("user");
    });

    it("should build SK with single field", () => {
      expect(buildSK("user", ["status"], { status: "active" })).toBe("status#active");
    });

    it("should build SK with multiple fields", () => {
      expect(buildSK("event", ["year", "month"], { year: "2024", month: "01" })).toBe("year#2024#month#01");
    });
  });
});
