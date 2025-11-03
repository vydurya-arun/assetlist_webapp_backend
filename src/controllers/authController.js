import userModel from "../models/userModel.js";
import { createUserVal, loginValidator, registerValidator } from "../validators/authValidate.js";
import bcrypt from "bcryptjs";
import redisClient from "../config/redisClient.js";
import { createSessionAndSetCookies } from "../utils/createSessionAndSetCookies.js";
import sessionModel from "../models/sessionModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const registerAdmin = async (req, res) => {
  try {
    const { error } = registerValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
      });
    }
    const { userName, email, password, role } = req.body;
    if (!userName || !email || !password || !role) {
      return res.status(404).json({
        success: false,
        message: "Username, email, password, or role is missing",
      });
    }

    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return res.status(409).json({ success: false, message: "user is already exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      userName: userName,
      email: email,
      password: hashPassword,
      role: role,
    });
    await user.save();

    // Invalidate the cache after creating a user
    await redisClient.del("all_users");

    return res.status(201).json({ success: true, message: "registeration successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

export const getAlluser = async (req, res) => {
  try {
    const { page, limit, startIndex, endIndex, cacheKey } = req.pagination;

    let cachedData = null;

    // Try Redis get
    if (redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {
        console.warn("⚠️ Redis get failed:", err.message);
      }
    }

    // ✅ If cache found
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const totalItems = parsedData.length;
      const resultCachedData = parsedData.slice(startIndex, endIndex);

      const nextPage = endIndex < totalItems ? { page: page + 1, limit } : null;
      const prevPage = startIndex > 0 ? { page: page - 1, limit } : null;

      return res.status(200).json({
        success: true,
        fromCache: true,
        totalItems,
        next: nextPage,
        previous: prevPage,
        data: resultCachedData,
      });
    }

    // ✅ Fallback to DB
    const users = await userModel.find().select("-password");
    if (!users?.length) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    // ✅ Store in Redis
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(users));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    const totalItems = users.length;
    const result = users.slice(startIndex, endIndex);
    const nextPage = endIndex < totalItems ? { page: page + 1, limit } : null;
    const prevPage = startIndex > 0 ? { page: page - 1, limit } : null;

    return res.status(200).json({
      success: true,
      fromCache: false,
      totalItems,
      next: nextPage,
      previous: prevPage,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { error } = loginValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "email or password is missing",
      });
    }

    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check role
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Create session + tokens + cookies
    await createSessionAndSetCookies(req, res, user, { singleDevice: true });

    // Update login time
    user.lastLoginAt = new Date();
    await user.save();

    const safeUser = {
      id: user._id,
      username: user.userName,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt
    };


    return res.status(200).json({
      success: true,
      user: safeUser,
      message: "User login successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Find the session by refreshToken
      const session = await sessionModel.findOne({ refreshToken, valid: true });

      if (session) {
        // Invalidate the session
        session.valid = false;
        session.refreshToken = "";
        await session.save();
      }
    }

    // Clear cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    res.clearCookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    // Check token in DB
    const session = await sessionModel.findOne({ refreshToken, valid: true });
    if (!session) {
      return res.status(403).json({ success: false, message: "Invalid or expired session" });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "Expired refresh token" });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role, jti: session.tokenId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "5m" }
      );

      // Update access token cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 5 * 60 * 1000, // 5 minutes
      });

      return res.json({ success: true, accessToken: newAccessToken });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const createUsers = async (req, res) => {
  try {
    const { error } = createUserVal.validate(req.body, {
      abortEarly: true,
    });

    if (error) {
      return res.status(400).json({ success: false, errors: error.details.map((err) => err.message) });
    }

    const { userName, email, password, role } = req.body;

    if (!userName || !email || !password || !role) {
      return res.status(404).json({
        success: false,
        message: "Username, email, password, or role is missing",
      });
    }

    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return res.status(409).json({ success: false, message: "User is already exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      userName: userName,
      role: role,
      email: email,
      password: hashPassword,
    });

    await user.save();

    // Invalidate the cache after creating a user
    await redisClient.del("all_users");

    return res.status(201).json({ success: true, message: "create new user sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ sucess: false, message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }

    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ sucess: false, message: "id is not user" });
    }

    // Invalidate the cache after creating a user
    await redisClient.del("all_users");

    return res.status(200).json({ success: true, message: "Delete user Sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteAllUser = async (req, res) => {
  try {

    const result = await userModel.deleteMany({});

    if (result.deletedCount === 0){
      return res.status(404).json({ sucess: false, message:"No users found to delete" });
    }

    // Invalidate the cache after creating a user
    await redisClient.del("all_users");

    return res.status(200).json({ success: true, message: `${result.deletedCount} users deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
