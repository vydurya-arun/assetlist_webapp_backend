import mongoose from "mongoose";
import redisClient from "../config/redisClient.js";
import assetModel from "../models/assetModel.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import { assetValidator } from "../validators/assetValidate.js";

export const createAsset = async (req, res) => {
  try {
    const { error } = assetValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
      });
    }

    const {
      title,
      description,
      address,
      price,
      categoryId,
      subcategoryId,
      location,
      yearofpurchase,
      mapFrameLink,
      quantity,
      tags,
      brands,
      condition,
      postedBy,
    } = req.body;

    if (!categoryId || !subcategoryId || !postedBy) {
      return res.status(400).json({
        success: false,
        message: "categoryId, subcategoryId, and postedBy are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(postedBy)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format for categoryId, subcategoryId, or postedBy.",
      });
    }
    if (
      !title ||
      !tags ||
      !location ||
      !description ||
      !address ||
      !price ||
      !yearofpurchase ||
      !mapFrameLink ||
      !quantity ||
      !brands ||
      !condition
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    // Handle file uploads
    let coverImage = null;
    let images = [];

    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        const coverResult = await uploadToCloudinary(req.files.coverImage[0].buffer, "assets");
        coverImage = {
          public_Id: coverResult.public_id,
          url: coverResult.url,
        };
      }

      if (req.files.images && req.files.images.length > 0) {
        const imageUploads = await Promise.all(
          req.files.images.map(async (file) => {
            const result = await uploadToCloudinary(file.buffer, "assets");
            return {
              public_Id: result.public_id,
              url: result.url,
            };
          })
        );
        images = imageUploads;
      }
    }

    // Create asset
    const asset = new assetModel({
      title,
      description,
      address,
      price,
      categoryId,
      subcategoryId,
      location,
      yearofpurchase,
      mapFrameLink,
      quantity,
      tags,
      brands,
      condition,
      postedBy,
      coverImage,
      images,
    });

    await asset.save();
    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_assets");
    }

    return res.status(201).json({
      success: true,
      message: "Asset created successfully.",
      data: asset,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getAllAssets = async (req, res) => {
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
    const asset = await assetModel
      .find()
      .populate("categoryId", "categoryName")
      .populate("subcategoryId", "subCatname")
      .populate("postedBy", "userName");

    if (!asset?.length) {
      return res.status(404).json({ success: false, message: "No asset found" });
    }

    // Store in Redis
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(asset));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    const totalItems = asset.length;
    const result = asset.slice(startIndex, endIndex);
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

export const getAllAssetsCards = async (req, res) => {
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

    const asset = await assetModel
      .find()
      .populate("categoryId", "categoryName")
      .populate("subcategoryId", "subCatname")
      .populate("postedBy", "userName")
      .select("-address -images -mapFrameLink -description");

    if (!asset?.length) {
      return res.status(404).json({ success: false, message: "No asset found" });
    }

    // Store in Redis
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(asset));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    const totalItems = asset.length;
    const result = asset.slice(startIndex, endIndex);
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

export const getAssetUsingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ sucess: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const asset = await assetModel
      .findById(id)
      .populate("categoryId", "categoryName")
      .populate("subcategoryId", "subCatname")
      .populate("postedBy", "userName");
    if (!asset) {
      return res.status(404).json({ success: false, message: "asset is not found" });
    }

    return res.status(200).json({ success: true, data: asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const asset = await assetModel.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "asset is not found" });
    }

    if (asset.coverImage?.public_Id) {
      await deleteFromCloudinary(asset.coverImage.public_Id);
    }

    if (Array.isArray(asset.images) && asset.images.length > 0) {
      for (const img of asset.images) {
        if (img?.public_Id) {
          await deleteFromCloudinary(img.public_Id);
        }
      }
    }

    const result = await assetModel.deleteMany({});

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_assets");
    }

    return res.status(200).json({ success: true, message: "delete asset sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteAllAssets = async (req, res) => {
  try {
    //  Find all categories
    const assets = await assetModel.find();

    if (assets.length === 0) {
      return res.status(404).json({success: false, message: "No asset found to delete"});
    }

    // Delete all Cloudinary images
    await Promise.all(
      assets.flatMap(asset => [
        ...(asset.coverImage?.public_Id ? [deleteFromCloudinary(asset.coverImage.public_Id)] : []),
        ...(Array.isArray(asset.images)
          ? asset.images
              .filter(img => img?.public_Id)
              .map(img => deleteFromCloudinary(img.public_Id))
          : []),
      ])
    );

    const result = await assetModel.deleteMany({});

    //Invalidate Redis cache if connected
    if (redisClient?.isOpen) {
      await redisClient.del("all_assets");
    }

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} asset deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, message: "Internal Server Error", error: error.message,
    });
  }
};

export const updateAssetById = async (req, res) => {
  try {
    //  Validate input body
    const { error } = assetValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
      });
    }

    const { id } = req.params;

    //  Validate ID
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    //  Find existing asset
    const asset = await assetModel.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    let updates = { ...req.body };
    let coverImage = asset.coverImage;
    let images = asset.images;

    //  Handle new file uploads (only if provided)
    if (req.files) {
      // Replace cover image if new one uploaded
      if (req.files.coverImage && req.files.coverImage[0]) {
        // Delete old cover
        if (asset.coverImage?.public_Id) {
          await deleteFromCloudinary(asset.coverImage.public_Id);
        }

        const coverResult = await uploadToCloudinary(req.files.coverImage[0].buffer, "assets");
        coverImage = {
          public_Id: coverResult.public_id,
          url: coverResult.url,
        };
      }

      // Replace gallery images if new ones uploaded
      if (req.files.images && req.files.images.length > 0) {
        // Delete old gallery images
        if (Array.isArray(asset.images) && asset.images.length > 0) {
          for (const img of asset.images) {
            if (img?.public_Id) {
              await deleteFromCloudinary(img.public_Id);
            }
          }
        }

        const imageUploads = await Promise.all(
          req.files.images.map(async (file) => {
            const result = await uploadToCloudinary(file.buffer, "assets");
            return {
              public_Id: result.public_id,
              url: result.url,
            };
          })
        );
        images = imageUploads;
      }
    }

    //  Apply updates safely
    updates.coverImage = coverImage;
    updates.images = images;

    Object.assign(asset, updates);
    await asset.save();

    //  Clear Redis cache
    if (redisClient?.isOpen) {
      await redisClient.del("all_assets");
    }

    return res.status(200).json({
      success: true,
      message: "Asset updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message});
  }
};
