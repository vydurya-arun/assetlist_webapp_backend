import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
})();

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await redisClient.quit();
    console.log("Redis connection closed");
    process.exit(0);
  } catch (err) {
    console.error("Error closing Redis connection:", err);
    process.exit(1);
  }
});

export default redisClient;
