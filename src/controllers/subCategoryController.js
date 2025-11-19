import mongoose from "mongoose";
import redisClient from "../config/redisClient.js";
import subCatModel from "../models/subcategoryModel.js";
import { subcategoryValidationSchema } from "../validators/subCatValidate.js";

export const createSubCategory = async (req, res) => {
  try {
    const { error } = subcategoryValidationSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
        });
    }
    const { subCatname, description,categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ sucess: false, message: "categoryId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    if (!subCatname || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subCatname, description",
      });
    }

    const subcategory = new subCatModel({
      subCatname,
      categoryId:categoryId,
      description,
    });

    await subcategory.save();

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_subcategory");
    }

    return res.status(201).json({ success: true, message: "subcategory create sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getAllsubCategory = async (req, res) => {
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
    const subcategory = await subCatModel.find().populate("categoryId", "categoryName");
    if (!subcategory?.length) {
      return res.status(404).json({ success: false, message: "No subcategory found" });
    }

    // Store in Redis
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(subcategory));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    const totalItems = subcategory.length;
    const result = subcategory.slice(startIndex, endIndex);
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

export const getsubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ sucess: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const subcategory = await subCatModel.findById(id).populate("categoryId", "categoryName");
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "subcategory is not found" });
    }

    return res.status(200).json({ success: true, data: subcategory });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getsubCategoryUsingCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: "Category ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid Category ID format" });
    }

    // Fetch all subcategories where categoryId matches
    const subcategories = await subCatModel
      .find({ categoryId })
      .populate("categoryId", "categoryName");

    if (subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subcategories found for this category",
      });
    }

    return res.status(200).json({
      success: true,
      totalItems: subcategories.length,
      data: subcategories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const deletesubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    await subCatModel.findByIdAndDelete(id);

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_subcategory");
    }

    return res.status(200).json({ success: true, message: "delete subcategory sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteAllSubCategory = async (req, res) => {
  try {
    //  Find all categories
    const subcategories = await subCatModel.find();

    if (subcategories.length === 0) {
      return res.status(404).json({success: false, message: "No subcategories found to delete"});
    }


    //Delete all categories from DB
    const result = await subCatModel.deleteMany({});

    //Invalidate Redis cache if connected
    if (redisClient?.isOpen) {
      await redisClient.del("all_subcategory");
    }

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} subcategories deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, message: "Internal Server Error", error: error.message,
    });
  }
};


export const updatesubCategoryById = async (req, res) => {
  try {
    const { error } = subcategoryValidationSchema.validate(req.body, {
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
    const subcategory = await subCatModel.findById(id);

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "subCategory not found" });
    }

    //  Merge updates into subcategory
    Object.assign(subcategory, updates);

    await subcategory.save();

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_subcategory");
    }

    return res.status(200).json({success: true,message: "subcategory updated successfully"});
  } catch (error) {
    return res.status(500).json({
      success: false, message: "Internal Server Error", error: error.message,
    });
  }
};
