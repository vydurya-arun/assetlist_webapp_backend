import jwt from "jsonwebtoken";
import { promisify } from "util";
import sessionModel from "../models/sessionModel.js";
import redisClient from "../config/redisClient.js"; // ✅ Ensure Redis client is initialized once

const verifyToken = promisify(jwt.verify);

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  path: "/", // ensures cookies clear across all routes
});

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // ✅ Step 1: Verify JWT asynchronously
    let decoded;
    try {
      decoded = await verifyToken(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    const sessionKey = `session:${decoded.jti}`;
    let session;

    // ✅ Step 2: Try Redis cache first
    if (redisClient?.isOpen) {

      try {
        const cachedSession = await redisClient.get(sessionKey);
        if (cachedSession) {
          session = JSON.parse(cachedSession);
        }
      } catch (error) {
        console.warn("⚠️ Redis get failed:", err.message);
      }
    }

    // ✅ Step 3: If not in cache, fetch from DB
    if (!session) {
      session = await sessionModel
        .findOne({ tokenId: decoded.jti, valid: true })
        .select("_id userId valid createdAt updatedAt");

      if (!session) {
        // Clear cookies on invalid session
        res.clearCookie("accessToken", cookieOptions());
        res.clearCookie("refreshToken", cookieOptions());
        return res.status(403).json({ success: false, message: "Session is invalid or logged out" });
      }

      // ✅ Step 4: Cache valid session for 5 minutes (TTL = 300 seconds)
      if (redisClient?.isOpen) {

        try {
          await redisClient.set(sessionKey, JSON.stringify(session), { EX: 300 });
        } catch (error) {
          console.warn("⚠️ Redis set failed:", err.message);
        }
      }
    }

    // ✅ Step 5: Attach user and session to request
    req.user = decoded;
    req.session = session;

    // Continue to next middleware / route
    next();

  } catch (error) {
    console.error("authMiddleware error:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};
