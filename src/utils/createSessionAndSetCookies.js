import jwt from "jsonwebtoken";
import sessionModel from "../models/sessionModel.js";
import { v4 as uuidv4 } from "uuid";

export const createSessionAndSetCookies = async (
  req,
  res,
  user,
  { singleDevice = true } = {}
) => {
  // Optionally invalidate previous sessions for single-device login
  if (singleDevice) {
    await sessionModel.updateMany(
      { userId: user._id, valid: true },
      { valid: false }
    );
  }

  const tokenId = uuidv4();

  // Access token (short-lived)
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role, jti: tokenId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "5m" }
  );

  // Refresh token (long-lived, includes jti)
  const refreshToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.REFRESH_TOKEN,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d" }
  );

  await sessionModel.create({
    userId: user._id,
    tokenId,
    refreshToken: refreshToken,
    valid: true,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    createdAt: new Date(),
    lastUsedAt: new Date(),
    refreshTokenexpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days,
  });

  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieBase,
    maxAge: 5 * 60 * 1000,
  });

  // Refresh token cookie (httpOnly)
  res.cookie("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
  });
};