import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined. Add it to your environment variables.");
  }

  const cached = globalThis.mongooseCache ??= {
    conn: null,
    promise: null,
  };

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "taskflow",
      serverSelectionTimeoutMS: 15000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;

    const message =
      error instanceof Error && /whitelist|network|ENOTFOUND|ECONNREFUSED|SSL|TLS/i.test(error.message)
        ? "MongoDB Atlas connection failed. Add this machine's public IP to Atlas Network Access and retry."
        : error instanceof Error
          ? error.message
          : "MongoDB connection failed.";

    throw new Error(message);
  }

  return cached.conn;
}
