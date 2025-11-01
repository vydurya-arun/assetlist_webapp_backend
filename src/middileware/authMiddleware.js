import jwt from "jsonwebtoken";
import sessionModel from "../models/sessionModel.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  path: "/", // ✅ ensures it clears across all routes
});

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        // Token invalid or expired → clear cookies
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
      }

      const session = await sessionModel.findOne({ tokenId: decoded.jti, valid: true });
      if (!session) {
        // Session invalid → clear cookies
        res.clearCookie("accessToken", cookieOptions());
        res.clearCookie("refreshToken", cookieOptions());
        return res.status(403).json({ success: false, message: "Session is invalid or logged out" });
      }

      req.user = decoded;
      req.session = session;
      next();
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};