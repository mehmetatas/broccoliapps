import { describe, expect, it } from "vitest";
import { rateLimiter } from "./rate-limiter";

// Set AWS environment
process.env.AWS_PROFILE = "appi";
process.env.AWS_REGION = "us-west-2";
process.env.TABLE_NAME = "broccoliapps-com";

const TEST_PREFIX = `test-${Date.now()}`;

// Note: Rate limit items will be cleaned up by DynamoDB TTL

describe("Rate Limiter Integration Tests", () => {
  describe("basic rate limiting", () => {
    it("should allow requests within limit", async () => {
      const action = `${TEST_PREFIX}-action1`;
      const rule = {
        action,
        context: "userId",
        limit: 5,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user1` };

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      }
    });

    it("should throw when limit is exceeded", async () => {
      const action = `${TEST_PREFIX}-action2`;
      const rule = {
        action,
        context: "userId",
        limit: 3,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user2` };

      // First 3 should succeed
      for (let i = 0; i < 3; i++) {
        await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      }

      // 4th should fail
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });

    it("should continue throwing after limit exceeded", async () => {
      const action = `${TEST_PREFIX}-action3`;
      const rule = {
        action,
        context: "userId",
        limit: 2,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user3` };

      // Use up the limit
      await rateLimiter.enforce(rule, context);
      await rateLimiter.enforce(rule, context);

      // Multiple attempts after limit should all fail
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("context isolation", () => {
    it("should track limits separately for different users", async () => {
      const action = `${TEST_PREFIX}-action4`;
      const rule = {
        action,
        context: "userId",
        limit: 2,
        period: "1m" as const,
      };

      const user1 = { userId: `${TEST_PREFIX}-userA` };
      const user2 = { userId: `${TEST_PREFIX}-userB` };

      // User1 hits limit
      await rateLimiter.enforce(rule, user1);
      await rateLimiter.enforce(rule, user1);
      await expect(rateLimiter.enforce(rule, user1)).rejects.toThrow("Rate limit exceeded");

      // User2 should still have quota
      await expect(rateLimiter.enforce(rule, user2)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, user2)).resolves.toBeUndefined();

      // Now user2 should also be limited
      await expect(rateLimiter.enforce(rule, user2)).rejects.toThrow("Rate limit exceeded");
    });

    it("should track limits separately for different actions", async () => {
      const action1 = `${TEST_PREFIX}-actionX`;
      const action2 = `${TEST_PREFIX}-actionY`;
      const context = { userId: `${TEST_PREFIX}-user5` };

      const rule1 = {
        action: action1,
        context: "userId",
        limit: 2,
        period: "1m" as const,
      };

      const rule2 = {
        action: action2,
        context: "userId",
        limit: 2,
        period: "1m" as const,
      };

      // Hit limit on action1
      await rateLimiter.enforce(rule1, context);
      await rateLimiter.enforce(rule1, context);
      await expect(rateLimiter.enforce(rule1, context)).rejects.toThrow("Rate limit exceeded");

      // action2 should still work
      await expect(rateLimiter.enforce(rule2, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule2, context)).resolves.toBeUndefined();
    });
  });

  describe("array context", () => {
    it("should combine multiple context keys", async () => {
      const action = `${TEST_PREFIX}-action5`;
      const rule = {
        action,
        context: ["userId", "ip"],
        limit: 2,
        period: "1m" as const,
      };

      // Same user, same IP - should share limit
      const context1 = { userId: `${TEST_PREFIX}-user6`, ip: "192.168.1.1" };
      await rateLimiter.enforce(rule, context1);
      await rateLimiter.enforce(rule, context1);
      await expect(rateLimiter.enforce(rule, context1)).rejects.toThrow("Rate limit exceeded");

      // Same user, different IP - separate limit
      const context2 = { userId: `${TEST_PREFIX}-user6`, ip: "192.168.1.2" };
      await expect(rateLimiter.enforce(rule, context2)).resolves.toBeUndefined();
    });
  });

  describe("different periods", () => {
    it("should work with 1 minute period", async () => {
      const rule = {
        action: `${TEST_PREFIX}-1m`,
        context: "userId",
        limit: 1,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-1m` };

      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });

    it("should work with 1 hour period", async () => {
      const rule = {
        action: `${TEST_PREFIX}-1h`,
        context: "userId",
        limit: 1,
        period: "1h" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-1h` };

      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });

    it("should work with 1 day period", async () => {
      const rule = {
        action: `${TEST_PREFIX}-1d`,
        context: "userId",
        limit: 1,
        period: "1d" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-1d` };

      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });

    it("should work with 30 day period", async () => {
      const rule = {
        action: `${TEST_PREFIX}-30d`,
        context: "userId",
        limit: 1,
        period: "30d" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-30d` };

      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("edge cases", () => {
    it("should handle limit of 1", async () => {
      const rule = {
        action: `${TEST_PREFIX}-limit1`,
        context: "userId",
        limit: 1,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-limit1` };

      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });

    it("should handle higher limits", async () => {
      const rule = {
        action: `${TEST_PREFIX}-high`,
        context: "userId",
        limit: 5,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-high` };

      // Make 5 requests - all should succeed
      await rateLimiter.enforce(rule, context);
      await rateLimiter.enforce(rule, context);
      await rateLimiter.enforce(rule, context);
      await rateLimiter.enforce(rule, context);
      await rateLimiter.enforce(rule, context);

      // 6th should fail
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });

    it("should handle special characters in context values", async () => {
      const rule = {
        action: `${TEST_PREFIX}-special`,
        context: "email",
        limit: 2,
        period: "1m" as const,
      };
      const context = { email: `${TEST_PREFIX}+test@example.com` };

      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context)).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("window reset", () => {
    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    it("should reset limit when 1 minute window changes", async () => {
      const rule = {
        action: `${TEST_PREFIX}-window-1m`,
        context: "userId",
        limit: 2,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-window-1m` };

      // Start at a known time
      let currentTime = Date.now();
      const now = () => currentTime;

      // Use up the limit
      await rateLimiter.enforce(rule, context, now);
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Move time forward by 1 minute (new window)
      currentTime += MINUTE;

      // Should have fresh limit
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");
    });

    it("should reset limit when 1 hour window changes", async () => {
      const rule = {
        action: `${TEST_PREFIX}-window-1h`,
        context: "userId",
        limit: 2,
        period: "1h" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-window-1h` };

      let currentTime = Date.now();
      const now = () => currentTime;

      // Use up the limit
      await rateLimiter.enforce(rule, context, now);
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Move time forward by 1 hour (new window)
      currentTime += HOUR;

      // Should have fresh limit
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
    });

    it("should reset limit when 1 day window changes", async () => {
      const rule = {
        action: `${TEST_PREFIX}-window-1d`,
        context: "userId",
        limit: 2,
        period: "1d" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-window-1d` };

      let currentTime = Date.now();
      const now = () => currentTime;

      // Use up the limit
      await rateLimiter.enforce(rule, context, now);
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Move time forward by 1 day (new window)
      currentTime += DAY;

      // Should have fresh limit
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
    });

    it("should NOT reset limit within the same window", async () => {
      const rule = {
        action: `${TEST_PREFIX}-same-window`,
        context: "userId",
        limit: 2,
        period: "1h" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-same-window` };

      // Align to the start of an hour window so +30min stays within the same window
      let currentTime = Math.floor(Date.now() / HOUR) * HOUR;
      const now = () => currentTime;

      // Use up the limit
      await rateLimiter.enforce(rule, context, now);
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Move time forward by 30 minutes (still same 1h window)
      currentTime += 30 * MINUTE;

      // Should still be limited
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");
    });

    it("should allow requests across multiple window resets", async () => {
      const rule = {
        action: `${TEST_PREFIX}-multi-window`,
        context: "userId",
        limit: 1,
        period: "1m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-multi-window` };

      let currentTime = Date.now();
      const now = () => currentTime;

      // Window 1: use limit
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Window 2
      currentTime += MINUTE;
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Window 3
      currentTime += MINUTE;
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Window 4
      currentTime += MINUTE;
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
    });

    it("should handle 5 minute period window reset", async () => {
      const rule = {
        action: `${TEST_PREFIX}-window-5m`,
        context: "userId",
        limit: 2,
        period: "5m" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-window-5m` };

      let currentTime = Date.now();
      const now = () => currentTime;

      // Use up the limit
      await rateLimiter.enforce(rule, context, now);
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Move time forward by 5 minutes (new window)
      currentTime += 5 * MINUTE;

      // Should have fresh limit
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
    });

    it("should handle 30 day period window reset", async () => {
      const rule = {
        action: `${TEST_PREFIX}-window-30d`,
        context: "userId",
        limit: 1,
        period: "30d" as const,
      };
      const context = { userId: `${TEST_PREFIX}-user-window-30d` };

      let currentTime = Date.now();
      const now = () => currentTime;

      // Use up the limit
      await rateLimiter.enforce(rule, context, now);
      await expect(rateLimiter.enforce(rule, context, now)).rejects.toThrow("Rate limit exceeded");

      // Move time forward by 30 days (new window)
      currentTime += 30 * DAY;

      // Should have fresh limit
      await expect(rateLimiter.enforce(rule, context, now)).resolves.toBeUndefined();
    });
  });
});
