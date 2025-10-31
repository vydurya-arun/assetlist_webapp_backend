import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGODB_URI;


export const connectDB = async () => {

    try {

        // Avoid reconnecting if already connected
        if (mongoose.connection.readyState >= 1) return;

        await mongoose.connect(uri, {
            maxConnecting: 20, // Max 20 concurrent connections
            minPoolSize: 5, //Maintain at least 5 idle connections
            connectTimeoutMS: 10000, //10s connection timeout
            serverSelectionTimeoutMS: 5000, // Server selection timeout
        });

        console.log("✅ MongoDB connected with connection pooling");

    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
}

process.on("SIGINT", async () => {
    if (client) {
        await client.close();
        console.log("🔒 MongoDB connection closed")
    }
    process.exit(0);
});