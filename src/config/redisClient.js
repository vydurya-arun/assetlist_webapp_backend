import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.warn("⚠️ Redis reconnect failed. Skipping Redis temporarily.");
        return new Error("Redis unavailable");
      }
      return Math.min(retries * 100, 3000); // retry for 3 times max
    },
  },
});

redisClient.on("connect", () => console.log("✅ Redis connected successfully"));
redisClient.on("error", (err) =>
  console.warn("⚠️ Redis connection error (non-blocking):", err.message)
);

// Try to connect, but don't block app startup
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn("⚠️ Redis not available, continuing without cache.");
  }
})();

process.on("SIGINT", async () => {
  try {
    if (redisClient.isOpen) await redisClient.quit();
    console.log("Redis connection closed gracefully");
  } catch (err) {
    console.error("Error closing Redis:", err.message);
  } finally {
    process.exit(0);
  }
});

export default redisClient;
