import mongoose from "mongoose";

/**
 * Strip query parameters that Mongoose 9 does not support
 * (retryWrites, w, appName are MongoDB driver options, not Mongoose options).
 * Uses regex so it works even if the URL constructor doesn't handle mongodb+srv://.
 */
function cleanMongoUri(uri: string): string {
  if (!uri) return uri;

  // Trim the entire URI first (Netlify env vars can have stray whitespace)
  uri = uri.trim();

  // Find the query string portion
  const qIndex = uri.indexOf("?");
  if (qIndex === -1) return uri;

  const base = uri.substring(0, qIndex);
  const queryString = uri.substring(qIndex + 1);

  // Parse and filter query params (trim keys to handle stray whitespace)
  const unsupported = ["retrywrites", "w", "appname"];
  const params = queryString
    .split("&")
    .filter((param) => {
      const key = param.split("=")[0].trim().toLowerCase();
      return !unsupported.includes(key);
    });

  if (params.length === 0) return base;
  return base + "?" + params.join("&");
}

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
  // Read and clean the URI at runtime (not module load time)
  // so that Netlify serverless env vars are available
  const rawUri = process.env.MONGODB_URI || "";
  const MONGODB_URI = cleanMongoUri(rawUri);

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

    console.log("🔗 Connecting to MongoDB...");
    console.log("   URI (cleaned):", MONGODB_URI.replace(/\/\/[^@]+@/, "//***:***@"));

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

