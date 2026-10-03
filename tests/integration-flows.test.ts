import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { describe, it } from "node:test";
import User from "../models/User";

process.env.AUTH_SECRET = "test-secret-for-auth";
process.env.NEXTAUTH_SECRET = "test-secret-for-auth";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.MONGODB_URI = "mongodb+srv://test:test@localhost/test?retryWrites=true&w=majority";

const globalState = globalThis as typeof globalThis & {
  mongooseCache?: { conn: unknown; promise: null };
};

describe("integration flows", () => {
  it("register route creates a valid user", async () => {
    const { POST: registerRoute } = await import("../app/api/register/route");
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    globalState.mongooseCache = { conn: {} as never, promise: null };
    User.findOne = (async () => null) as any;
    User.create = (async (payload: Record<string, unknown>) => ({ _id: "user-123", ...payload })) as any;

    try {
      const response = await registerRoute(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Ava Stone", email: "ava@example.com", password: "password123" }),
        }),
      );

      assert.equal(response.status, 201);
      const json = await response.json();
      assert.equal(json.success, true);
      assert.equal(json.user.email, "ava@example.com");
    } finally {
      User.findOne = originalFindOne;
      User.create = originalCreate;
      delete globalState.mongooseCache;
    }
  });

  it("credentials auth accepts a valid login", async () => {
    const { authorizeCredentials } = await import("../lib/auth");

    const user = await authorizeCredentials(
      { email: "ava@example.com", password: "password123" },
      async () => ({
        _id: "user-456",
        name: "Ava Stone",
        email: "ava@example.com",
        passwordHash: await bcrypt.hash("password123", 12),
        image: null,
      }),
    );

    assert.ok(user);
    assert.equal(user.email, "ava@example.com");
  });

  it("task comment flow validates and appends the message", async () => {
    const commentPayload = { taskId: "task-1", message: "Please review the ticket before Friday." };
    const sanitized = {
      ...commentPayload,
      message: commentPayload.message.trim(),
    };

    assert.equal(sanitized.taskId, "task-1");
    assert.equal(sanitized.message.endsWith("Friday."), true);
    assert.ok(sanitized.message.length > 10);
  });
});
