import mongoose from "mongoose";
import redisClient from "../config/redisClient.js";
import assetModel from "../models/assetModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
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
        await redisClient.del("all_asset");
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


export const getAllAssets = async(req,res) =>{
    try {
        const asset = await assetModel.find()
        .populate("categoryId","categoryName")
        .populate("subcategoryId","subCatname")
        .populate("postedBy","userName")

        return res.status(200).json({success:true, data:asset})
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });  
    }
}

export const getAllAssetsCards = async(req,res) =>{
    try {
        const asset = await assetModel.find()
        .populate("categoryId","categoryName")
        .populate("subcategoryId","subCatname")
        .populate("postedBy","userName")
        .select("-address -images -mapFrameLink -description")

        return res.status(200).json({success:true, data:asset})
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });  
    }
}