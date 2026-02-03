import { describe, expect, it, vi } from "vitest";
import { table } from "./table";
import { DdbItem } from "./types";

// Mock client
vi.mock("./client", () => ({
  executeQuery: vi.fn().mockResolvedValue({ items: [] }),
  executeCountQuery: vi.fn().mockResolvedValue({ count: 0 }),
  executePut: vi.fn().mockResolvedValue(undefined),
  executeGet: vi.fn().mockResolvedValue(undefined),
}));

// Test interfaces
interface User {
  id: string;
  email: string;
  status: string;
  updatedAt: number;
  name: string;
}

interface Order {
  userId: string;
  orderId: string;
  total: number;
  createdAt: number;
}

describe("table", () => {
  describe("PK building", () => {
    it("should use typeName as PK when no key is defined", () => {
      const users = table<User>("user").build();
      const data = users.query().build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk = :sk");
      expect(data.expressionAttributeValues[":pk"]).toBe("user");
      expect(data.expressionAttributeValues[":sk"]).toBe("user");
    });

    it("should build PK with single field", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).build();

      expect(data.expressionAttributeValues[":pk"]).toBe("user#id#123");
    });

    it("should build PK with multiple fields", () => {
      const users = table<User>("user").key(["id", "email"]).build();
      const data = users.query({ id: "123", email: "test@example.com" }).build();

      expect(data.expressionAttributeValues[":pk"]).toBe("user#id#123#email#test@example.com");
    });
  });

  describe("default SK", () => {
    it("should use typeName as SK when only PK is defined", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk = :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("user");
    });
  });

  describe("SK conditions - exact match", () => {
    it("should use exact match when all SK fields are provided", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: "active", updatedAt: 1000 }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk = :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#updatedAt#0000000000001000");
    });
  });

  describe("SK conditions - prefix match", () => {
    it("should use begins_with with trailing # for partial SK", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: "active" }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND begins_with(sk, :sk)");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#");
    });

    it("should handle empty SK filter", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, {}).build();

      expect(data.keyConditionExpression).toBe("pk = :pk");
      expect(data.expressionAttributeValues[":sk"]).toBeUndefined();
    });
  });

  describe("SK conditions - beginsWith operator", () => {
    it("should handle beginsWith on first SK field", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: { beginsWith: "act" } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND begins_with(sk, :sk)");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#act");
    });

    it("should handle beginsWith on second SK field", () => {
      const orders = table<Order>("order").key(["userId"], ["orderId"]).build();

      const data = orders.query({ userId: "123" }, { orderId: { beginsWith: "2024" } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND begins_with(sk, :sk)");
      expect(data.expressionAttributeValues[":sk"]).toBe("orderId#2024");
    });
  });

  describe("SK conditions - comparison operators", () => {
    it("should handle gte operator", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: "active", updatedAt: { gte: 1000 } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk >= :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#updatedAt#0000000000001000");
    });

    it("should handle lte operator", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: "active", updatedAt: { lte: 2000 } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk <= :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#updatedAt#0000000000002000");
    });

    it("should handle gt operator", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: "active", updatedAt: { gt: 1000 } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk > :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#updatedAt#0000000000001000");
    });

    it("should handle lt operator", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { status: "active", updatedAt: { lt: 2000 } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk < :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#updatedAt#0000000000002000");
    });

    it("should handle gte operator on first field", () => {
      const users = table<User>("user").key(["id"], ["updatedAt"]).build();

      const data = users.query({ id: "123" }, { updatedAt: { gte: 1000 } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk >= :sk");
      expect(data.expressionAttributeValues[":sk"]).toBe("updatedAt#0000000000001000");
    });
  });

  describe("SK conditions - between", () => {
    it("should handle between with same field", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { between: [{ status: "a" }, { status: "z" }] }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk BETWEEN :skStart AND :skEnd");
      expect(data.expressionAttributeValues[":skStart"]).toBe("status#a");
      expect(data.expressionAttributeValues[":skEnd"]).toBe("status#z");
    });

    it("should handle between with multiple fields", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users
        .query(
          { id: "123" },
          {
            between: [
              { status: "active", updatedAt: 1000 },
              { status: "active", updatedAt: 2000 },
            ],
          },
        )
        .build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk BETWEEN :skStart AND :skEnd");
      expect(data.expressionAttributeValues[":skStart"]).toBe("status#active#updatedAt#0000000000001000");
      expect(data.expressionAttributeValues[":skEnd"]).toBe("status#active#updatedAt#0000000000002000");
    });

    it("should handle between with different depth bounds", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { between: [{ status: "active" }, { status: "active", updatedAt: 9999 }] }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk BETWEEN :skStart AND :skEnd");
      expect(data.expressionAttributeValues[":skStart"]).toBe("status#active");
      expect(data.expressionAttributeValues[":skEnd"]).toBe("status#active#updatedAt#0000000000009999");
    });

    it("should handle between with empty start bound", () => {
      const users = table<User>("user").key(["id"], ["status", "updatedAt"]).build();

      const data = users.query({ id: "123" }, { between: [{}, { status: "z" }] }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk BETWEEN :skStart AND :skEnd");
      expect(data.expressionAttributeValues[":skStart"]).toBe("");
      expect(data.expressionAttributeValues[":skEnd"]).toBe("status#z");
    });
  });

  describe("GSI queries", () => {
    it("should set indexName for GSI queries", () => {
      const orders = table<Order>("order").key(["userId"], ["orderId"]).gsi1("byTotal", ["total"]).build();

      const data = orders.query.byTotal({ total: 100 }).build();

      expect(data.indexName).toBe("gsi1");
      expect(data.expressionAttributeValues[":pk"]).toBe("order#total#0000000000000100");
    });

    it("should handle GSI with SK", () => {
      const orders = table<Order>("order").key(["userId"], ["orderId"]).gsi1("byTotal", ["total"], ["createdAt"]).build();

      const data = orders.query.byTotal({ total: 100 }, { createdAt: { gte: 1000 } }).build();

      expect(data.indexName).toBe("gsi1");
      expect(data.keyConditionExpression).toBe("gsi1_pk = :pk AND gsi1_sk >= :sk");
      expect(data.expressionAttributeValues[":pk"]).toBe("order#total#0000000000000100");
      expect(data.expressionAttributeValues[":sk"]).toBe("createdAt#0000000000001000");
    });

    it("should not set indexName for main table queries", () => {
      const orders = table<Order>("order").key(["userId"], ["orderId"]).gsi1("byTotal", ["total"]).build();

      const data = orders.query({ userId: "123" }).build();

      expect(data.indexName).toBeUndefined();
    });
  });

  describe("Query.execute()", () => {
    it("should return a promise with empty items", async () => {
      const users = table<User>("user").key(["id"]).build();
      const query = users.query({ id: "123" });

      const result = await query.execute();

      expect(result).toEqual({ items: [] });
    });
  });

  describe("empty PK with SK", () => {
    it("should use typeName as PK when PK fields are empty", () => {
      const users = table<User>("user").key([], ["status", "updatedAt"]).build();

      const data = users.query().build();

      expect(data.keyConditionExpression).toBe("pk = :pk");
      expect(data.expressionAttributeValues[":pk"]).toBe("user");
    });

    it("should support SK filter when PK is empty", () => {
      const users = table<User>("user").key([], ["status", "updatedAt"]).build();

      const data = users.query({ status: "active" }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND begins_with(sk, :sk)");
      expect(data.expressionAttributeValues[":pk"]).toBe("user");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#");
    });

    it("should support SK exact match when PK is empty", () => {
      const users = table<User>("user").key([], ["status", "updatedAt"]).build();

      const data = users.query({ status: "active", updatedAt: 1000 }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk = :sk");
      expect(data.expressionAttributeValues[":pk"]).toBe("user");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#active#updatedAt#0000000000001000");
    });

    it("should support SK operators when PK is empty", () => {
      const users = table<User>("user").key([], ["status", "updatedAt"]).build();

      const data = users.query({ status: { beginsWith: "act" } }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND begins_with(sk, :sk)");
      expect(data.expressionAttributeValues[":pk"]).toBe("user");
      expect(data.expressionAttributeValues[":sk"]).toBe("status#act");
    });

    it("should support between when PK is empty", () => {
      const users = table<User>("user").key([], ["status", "updatedAt"]).build();

      const data = users.query({ between: [{ status: "a" }, { status: "z" }] }).build();

      expect(data.keyConditionExpression).toBe("pk = :pk AND sk BETWEEN :skStart AND :skEnd");
      expect(data.expressionAttributeValues[":pk"]).toBe("user");
      expect(data.expressionAttributeValues[":skStart"]).toBe("status#a");
      expect(data.expressionAttributeValues[":skEnd"]).toBe("status#z");
    });
  });

  describe("edge cases", () => {
    it("should handle numeric values in PK", () => {
      interface Item {
        count: number;
        name: string;
      }
      const items = table<Item>("item").key(["count"]).build();
      const data = items.query({ count: 42 }).build();

      expect(data.expressionAttributeValues[":pk"]).toBe("item#count#0000000000000042");
    });

    it("should handle special characters in values", () => {
      const users = table<User>("user").key(["email"]).build();
      const data = users.query({ email: "test+special@example.com" }).build();

      expect(data.expressionAttributeValues[":pk"]).toBe("user#email#test+special@example.com");
    });

    it("should handle empty string values", () => {
      const users = table<User>("user").key(["id"], ["status"]).build();
      const data = users.query({ id: "123" }, { status: "" }).build();

      expect(data.expressionAttributeValues[":sk"]).toBe("status#");
    });
  });

  describe("chainable query methods", () => {
    it("should support limit()", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).limit(10).build();

      expect(data.limit).toBe(10);
      expect(data.keyConditionExpression).toBe("pk = :pk AND sk = :sk");
    });

    it("should support cursor()", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).cursor("abc123").build();

      expect(data.cursor).toBe("abc123");
    });

    it("should support reverse()", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).reverse().build();

      expect(data.reverse).toBe(true);
    });

    it("should support chaining multiple methods", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).limit(10).cursor("abc").reverse().build();

      expect(data.limit).toBe(10);
      expect(data.cursor).toBe("abc");
      expect(data.reverse).toBe(true);
    });

    it("should return immutable queries (each chain creates new object)", () => {
      const users = table<User>("user").key(["id"]).build();
      const query1 = users.query({ id: "123" });
      const query2 = query1.limit(10);
      const query3 = query1.limit(20);

      expect(query1.build().limit).toBeUndefined();
      expect(query2.build().limit).toBe(10);
      expect(query3.build().limit).toBe(20);
    });

    it("should support all() returning items array", async () => {
      const users = table<User>("user").key(["id"]).build();
      const items = await users.query({ id: "123" }).all();

      expect(items).toEqual([]);
    });

    it("should support chaining before execute()", async () => {
      const users = table<User>("user").key(["id"]).build();
      const result = await users.query({ id: "123" }).limit(10).reverse().execute();

      expect(result).toEqual({ items: [] });
    });

    it("should support count() returning total count", async () => {
      const users = table<User>("user").key(["id"]).build();
      const count = await users.query({ id: "123" }).count();

      expect(count).toBe(0);
    });
  });

  describe("filter", () => {
    it("should support exact match filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).filter({ name: "John" }).build();

      expect(data.filterExpression).toBe("#f_name = :f_name");
      expect(data.filterAttributeNames).toEqual({ "#f_name": "name" });
      expect(data.filterAttributeValues).toEqual({ ":f_name": "John" });
    });

    it("should support multiple exact match filters", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).filter({ name: "John", status: "active" }).build();

      expect(data.filterExpression).toBe("#f_name = :f_name AND #f_status = :f_status");
      expect(data.filterAttributeNames).toEqual({ "#f_name": "name", "#f_status": "status" });
      expect(data.filterAttributeValues).toEqual({ ":f_name": "John", ":f_status": "active" });
    });

    it("should support beginsWith filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({ name: { beginsWith: "Jo" } })
        .build();

      expect(data.filterExpression).toBe("begins_with(#f_name, :f_name)");
      expect(data.filterAttributeValues).toEqual({ ":f_name": "Jo" });
    });

    it("should support gte filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({ updatedAt: { gte: 1000 } })
        .build();

      expect(data.filterExpression).toBe("#f_updatedAt >= :f_updatedAt");
      expect(data.filterAttributeValues).toEqual({ ":f_updatedAt": 1000 });
    });

    it("should support lte filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({ updatedAt: { lte: 2000 } })
        .build();

      expect(data.filterExpression).toBe("#f_updatedAt <= :f_updatedAt");
      expect(data.filterAttributeValues).toEqual({ ":f_updatedAt": 2000 });
    });

    it("should support gt filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({ updatedAt: { gt: 1000 } })
        .build();

      expect(data.filterExpression).toBe("#f_updatedAt > :f_updatedAt");
    });

    it("should support lt filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({ updatedAt: { lt: 2000 } })
        .build();

      expect(data.filterExpression).toBe("#f_updatedAt < :f_updatedAt");
    });

    it("should support between filter", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({ updatedAt: { between: [1000, 2000] } })
        .build();

      expect(data.filterExpression).toBe("#f_updatedAt BETWEEN :f_updatedAt_min AND :f_updatedAt_max");
      expect(data.filterAttributeValues).toEqual({ ":f_updatedAt_min": 1000, ":f_updatedAt_max": 2000 });
    });

    it("should support mixed filters", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users
        .query({ id: "123" })
        .filter({
          name: { beginsWith: "Jo" },
          status: "active",
          updatedAt: { gte: 1000 },
        })
        .build();

      expect(data.filterExpression).toBe("begins_with(#f_name, :f_name) AND #f_status = :f_status AND #f_updatedAt >= :f_updatedAt");
    });

    it("should chain filter with other methods", () => {
      const users = table<User>("user").key(["id"]).build();
      const data = users.query({ id: "123" }).filter({ name: "John" }).limit(10).reverse().build();

      expect(data.filterExpression).toBe("#f_name = :f_name");
      expect(data.limit).toBe(10);
      expect(data.reverse).toBe(true);
    });
  });

  describe("put", () => {
    it("should call executePut with correct DDB item", async () => {
      const { executePut } = await import("./client");
      vi.mocked(executePut).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).build();
      await users.put({ id: "123", email: "test@example.com", status: "active", updatedAt: 1000, name: "John" });

      expect(executePut).toHaveBeenCalledWith({
        tableName: "test-table",
        item: {
          id: "123",
          email: "test@example.com",
          status: "active",
          updatedAt: 1000,
          name: "John",
          pk: "user#id#123",
          sk: "status#active",
          _type: "user",
        },
      });
    });

    it("should include GSI keys in DDB item", async () => {
      const { executePut } = await import("./client");
      vi.mocked(executePut).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).gsi1("byEmail", ["email"]).build();

      await users.put({ id: "123", email: "test@example.com", status: "active", updatedAt: 1000, name: "John" });

      expect(executePut).toHaveBeenCalledWith({
        tableName: "test-table",
        item: expect.objectContaining({
          pk: "user#id#123",
          sk: "status#active",
          gsi1_pk: "user#email#test@example.com",
          gsi1_sk: "user",
          _type: "user",
        }),
      });
    });

    it("should not include GSI keys when GSI fields are undefined", async () => {
      const { executePut } = await import("./client");
      vi.mocked(executePut).mockClear();

      type Task = { id: string; projectId: string; parentId?: string };
      const tasks = table<Task>("task", "test-table").key(["projectId"], ["id"]).gsi1("byParent", ["projectId"], ["parentId"]).build();

      await tasks.put({ id: "123", projectId: "proj1" }); // parentId is undefined

      expect(executePut).toHaveBeenCalledWith({
        tableName: "test-table",
        item: expect.objectContaining({
          pk: "task#projectId#proj1",
          sk: "id#123",
          _type: "task",
        }),
      });

      // Verify GSI keys are NOT present
      const calledItem = vi.mocked(executePut).mock.calls[0]![0].item;
      expect(calledItem).not.toHaveProperty("gsi1_pk");
      expect(calledItem).not.toHaveProperty("gsi1_sk");
    });
  });

  describe("get", () => {
    it("should call executeGet with correct pk and sk", async () => {
      const { executeGet } = await import("./client");
      vi.mocked(executeGet).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).build();
      await users.get({ id: "123" }, { status: "active" });

      expect(executeGet).toHaveBeenCalledWith({
        tableName: "test-table",
        pk: "user#id#123",
        sk: "status#active",
      });
    });

    it("should strip DDB fields from returned item", async () => {
      const { executeGet } = await import("./client");
      vi.mocked(executeGet).mockResolvedValueOnce({
        id: "123",
        email: "test@example.com",
        status: "active",
        updatedAt: 1000,
        name: "John",
        pk: "user#id#123",
        sk: "status#active",
        _type: "user",
      } as DdbItem<User>);

      const users = table<User>("user", "test-table").key(["id"], ["status"]).build();
      const user = await users.get({ id: "123" }, { status: "active" });

      expect(user).toEqual({
        id: "123",
        email: "test@example.com",
        status: "active",
        updatedAt: 1000,
        name: "John",
      });
    });

    it("should return undefined when item not found", async () => {
      const { executeGet } = await import("./client");
      vi.mocked(executeGet).mockResolvedValueOnce(undefined);

      const users = table<User>("user", "test-table").key(["id"], ["status"]).build();
      const user = await users.get({ id: "123" }, { status: "active" });

      expect(user).toBeUndefined();
    });
  });

  describe("query stripping DDB fields", () => {
    it("should strip DDB fields from execute results", async () => {
      const { executeQuery } = await import("./client");
      vi.mocked(executeQuery).mockResolvedValueOnce({
        items: [
          {
            id: "123",
            email: "test@example.com",
            status: "active",
            updatedAt: 1000,
            name: "John",
            pk: "user#id#123",
            sk: "status#active",
            _type: "user",
          } as DdbItem<User>,
        ],
        cursor: undefined,
      });

      const users = table<User>("user", "test-table").key(["id"], ["status"]).build();
      const result = await users.query({ id: "123" }).execute();

      expect(result.items[0]).not.toHaveProperty("pk");
      expect(result.items[0]).not.toHaveProperty("sk");
      expect(result.items[0]).not.toHaveProperty("_type");
      expect(result.items[0]).toEqual({
        id: "123",
        email: "test@example.com",
        status: "active",
        updatedAt: 1000,
        name: "John",
      });
    });
  });

  describe("GSI methods", () => {
    it("should register gsi2", async () => {
      const { executeQuery } = await import("./client");
      vi.mocked(executeQuery).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).gsi2("byEmail", ["email"]).build();

      await users.query.byEmail({ email: "test@example.com" }).execute();

      expect(executeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          indexName: "gsi2",
        }),
      );
    });

    it("should register gsi3", async () => {
      const { executeQuery } = await import("./client");
      vi.mocked(executeQuery).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).gsi3("byName", ["name"]).build();

      await users.query.byName({ name: "John" }).execute();

      expect(executeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          indexName: "gsi3",
        }),
      );
    });

    it("should register gsi4", async () => {
      const { executeQuery } = await import("./client");
      vi.mocked(executeQuery).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).gsi4("byUpdatedAt", ["updatedAt"]).build();

      await users.query.byUpdatedAt({ updatedAt: 1000 }).execute();

      expect(executeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          indexName: "gsi4",
        }),
      );
    });

    it("should register gsi5", async () => {
      const { executeQuery } = await import("./client");
      vi.mocked(executeQuery).mockClear();

      const users = table<User>("user", "test-table").key(["id"], ["status"]).gsi5("byStatus", ["status"]).build();

      await users.query.byStatus({ status: "active" }).execute();

      expect(executeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          indexName: "gsi5",
        }),
      );
    });
  });

  describe("query with unmatched SK filter", () => {
    it("should handle SK filter with fields not in SK definition", async () => {
      const { executeQuery } = await import("./client");
      vi.mocked(executeQuery).mockClear();
      vi.mocked(executeQuery).mockResolvedValueOnce({ items: [] });

      const users = table<User>("user", "test-table").key(["id"], ["status"]).build();

      // Pass an SK filter with a field that's not in the SK definition
      // This tests the case where lastFieldIndex stays -1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (users.query as any)({ id: "123" }, { nonexistentField: "value" }).execute();

      // The query should still work, just without SK condition
      expect(executeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          keyConditionExpression: "pk = :pk",
        }),
      );
    });
  });
});
