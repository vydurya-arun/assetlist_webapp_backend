import mongoose from "mongoose";
import redisClient from "../config/redisClient.js";
import enquireModel from "../models/assetEnquireModel.js";
import { enquireValudate } from "../validators/enquireValudate.js";

// GET all contacts
export const getEnquires = async (req, res) => {
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
    const enquires = await enquireModel.find().populate("assetId" ,"title");
    if (!enquires?.length) {
      return res.status(404).json({ success: false, message: "No enquire found" });
    }

    // Store in Redis
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(enquires));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    const totalItems = enquires.length;
    const result = enquires.slice(startIndex, endIndex);
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

// POST a new contact
export const createEnquire = async (req, res) => {
  try {
    const { error } = enquireValudate.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
      });
    }
    const { name, email, phone, comment,assetId } = req.body;

    if (!name|| !email || !phone || !assetId) {
      return res.status(400).json({ success: false, message: "Name, email and phone,assetId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const enquire = new enquireModel({
        name, email, phone, comment,assetId
    });

    await enquire.save();

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_enquire");
    }

    return res.status(201).json({ success: true, message: "enquire create sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// DELETE a contact by ID
export const deleteEnquire = async (req, res) => {
  try {
    const { id } = req.params;
    const enquire = await enquireModel.findById(id);

    if (!enquire) {
      return res.status(404).json({ success: false, message: "enquire not found" });
    }

    await enquire.deleteOne();

    if (redisClient?.isOpen) {
      await redisClient.del("all_enquire");
    }
    res.status(200).json({ success: true, message: "enquire deleted successfully" });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
