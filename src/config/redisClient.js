import { createClient } from "redis";

const REDIS_URL = "redis://localhost:6379";

const redisClient = createClient({
    url: REDIS_URL,
});

redisClient.on("connect", ()=>{
    console.log("✅ Redis connected successfully");
})
redisClient.on("error", (err)=>{
    console.error("❌ Redis connection error:", err);
})

await redisClient.connect();

// Graceful shutdown
process.on("SIGINT", async () => {
  await redisClient.quit();
  console.log("🔒 Redis connection closed");
  process.exit(0);
});

export default redisClient;