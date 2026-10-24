import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/opennotes";

export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error.message);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Lost connection to MongoDB");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Reconnected to MongoDB");
});
