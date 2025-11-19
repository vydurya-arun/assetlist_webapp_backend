import mongoose from "mongoose";
import redisClient from "../config/redisClient.js";
import categoryModel from "../models/categoryModel.js";
import { categoryValidationSchema } from "../validators/categoryValidate.js";

export const createCategory = async (req, res) => {
  try {
    const { error } = categoryValidationSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
        });
    }
    const { categoryName, description,icon ,isActive} = req.body;
    if (!categoryName || !description || !icon) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: category_name,icon, description",
      });
    }

    const category = new categoryModel({
      categoryName,
      description,
      icon,
      isActive
    });

    await category.save();

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_category");
    }

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

    //  If cache found
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

    //  Fallback to DB
    const category = await categoryModel.find();
    if (!category?.length) {
      return res.status(404).json({ success: false, message: "No category found" });
    }

    // Store in Redis
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

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ sucess: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "category is not found" });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

     await categoryModel.findByIdAndDelete(id);


    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_category");
    }

    return res.status(200).json({ success: true, message: "delete category sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteAllCategory = async (req, res) => {
  try {
    //  Find all categories
    const categories = await categoryModel.find();

    if (categories.length === 0) {
      return res.status(404).json({success: false, message: "No categories found to delete"});
    }

    //Delete all categories from DB
    const result = await categoryModel.deleteMany({});

    //Invalidate Redis cache if connected
    if (redisClient?.isOpen) {
      await redisClient.del("all_category");
    }

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} categories deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, message: "Internal Server Error", error: error.message,
    });
  }
};


export const updateCategoryById = async (req, res) => {
  try {

    const { error } = categoryValidationSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
        });
    }
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    let updates = req.body;
    const category = await categoryModel.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    //  Merge updates into category
    Object.assign(category, updates);

    await category.save();

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_category");
    }

    return res.status(200).json({success: true,message: "Category updated successfully"});
  } catch (error) {
    return res.status(500).json({
      success: false, message: "Internal Server Error", error: error.message,
    });
  }
};
