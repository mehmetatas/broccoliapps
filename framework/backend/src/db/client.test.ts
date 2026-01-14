import { describe, expect, it, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend }),
  },
  PutCommand: vi.fn(),
  QueryCommand: vi.fn(),
  GetCommand: vi.fn(),
  DeleteCommand: vi.fn(),
  BatchGetCommand: vi.fn(),
  BatchWriteCommand: vi.fn(),
}));

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(),
}));

describe("client error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("executePutIfNotExists should re-throw non-conditional errors", async () => {
    const genericError = new Error("Some other DynamoDB error");
    genericError.name = "ValidationException";
    mockSend.mockRejectedValueOnce(genericError);

    const { executePutIfNotExists } = await import("./client");

    await expect(
      executePutIfNotExists({
        tableName: "test-table",
        item: { pk: "test", sk: "test", _type: "test" } as any,
      })
    ).rejects.toThrow("Some other DynamoDB error");
  });

  it("executePutIfNotExists should return false on ConditionalCheckFailedException", async () => {
    const conditionalError = new Error("Conditional check failed");
    conditionalError.name = "ConditionalCheckFailedException";
    mockSend.mockRejectedValueOnce(conditionalError);

    const { executePutIfNotExists } = await import("./client");

    const result = await executePutIfNotExists({
      tableName: "test-table",
      item: { pk: "test", sk: "test", _type: "test" } as any,
    });

    expect(result).toBe(false);
  });

  it("executePutIfNotExists should return true on success", async () => {
    mockSend.mockResolvedValueOnce({});

    const { executePutIfNotExists } = await import("./client");

    const result = await executePutIfNotExists({
      tableName: "test-table",
      item: { pk: "test", sk: "test", _type: "test" } as any,
    });

    expect(result).toBe(true);
  });
});
