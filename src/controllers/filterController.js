import redisClient from "../config/redisClient.js";
import assetModel from "../models/assetModel.js";


export const searchAllProduct = async (req, res) => {
  try {
    const { title } = req.query;

    // simple validation
    if (!title || title.trim() === "") {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No search term provided",
      });
    }

    const cacheKey = `search:${title.toLowerCase()}`;

    // Try Redis cache first
    if (redisClient.isOpen) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({
            success: true,
            data: JSON.parse(cachedData),
            message: "Fetched from cache",
          });
        }
      } catch (err) {
        console.warn("⚠️ Redis get failed:", err.message);
      }
    }

    // MongoDB query
    const query = { title: { $regex: title, $options: "i" } };
    const asset = await assetModel.find(query);

    // Cache the result for 10 minutes
    if (redisClient.isOpen && asset.length > 0) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(asset));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: asset,
      message: asset.length > 0 ? "Asset found" : "No asset found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};