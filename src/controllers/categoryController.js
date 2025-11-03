import redisClient from "../config/redisClient.js";
import categoryModel from "../models/categoryModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const createCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    if (!categoryName || !description || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: category_name, description, or image file",
      });
    }

    //upload cloudinary
    const cloudResults = await uploadToCloudinary(req.file.buffer, "category");

    const category = new categoryModel({
      categoryName,
      description,
      image: {
        public_id: cloudResults.public_id,
        url: cloudResults.url,
      },
    });

    await category.save();

    // Invalidate the cache after creating a user
    await redisClient.del("all_category");

    return res.status(201).json({ success: true, message: "category create sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getAllCategory = async (req, res) => {
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
    const category = await categoryModel.find();
    if (!category?.length) {
        return res.status(404).json({ success: false, message: "No category found" });
    }

    // ✅ Store in Redis
    if (redisClient.isOpen) {
        try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(category));
        } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
        }
    }

    const totalItems = category.length;
    const result = category.slice(startIndex, endIndex);
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
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
