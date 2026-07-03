import mongoose from "mongoose";

const RAW_MONGODB_URI = process.env.MONGODB_URI || "";

/**
 * Strip query parameters that Mongoose 9 does not support
 * (retryWrites, w, appName are MongoDB driver options, not Mongoose options).
 */
function cleanMongoUri(uri: string): string {
  try {
    const url = new URL(uri);
    // Remove params that Mongoose 9 rejects
    const unsupported = ["retrywrites", "w", "appname"];
    for (const key of [...url.searchParams.keys()]) {
      if (unsupported.includes(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    // If URL parsing fails, return as-is and let Mongoose handle it
    return uri;
  }
}

const MONGODB_URI = cleanMongoUri(RAW_MONGODB_URI);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log("✅ MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
