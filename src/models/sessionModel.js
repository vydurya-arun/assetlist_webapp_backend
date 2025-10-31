import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Unique ID from JWT "jti" claim (helps revoke specific tokens)
  tokenId: { type: String, required: true },

  // Refresh token string (or hashed for extra security)
  refreshToken: { type: String },

  // Track validity
  valid: { type: Boolean, default: true },

  // Device / client info
  ipAddress: { type: String },
  userAgent: { type: String },

  // Session creation / last use
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  refreshTokenexpiresAt: { type: Date, default: Date.now },
});

const sessionModel = mongoose.model("Session", sessionSchema);
export default sessionModel;
