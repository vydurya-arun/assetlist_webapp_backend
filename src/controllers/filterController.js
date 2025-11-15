import assetModel from "../models/assetModel.js";

export const searchAllProduct = async (req, res) => {
  try {
    const title = req.query.title?.trim();

    if (!title) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No search term provided",
      });
    }

    const asset = await assetModel.find({
      title: { $regex: `^${title}`, $options: "i" }, // starts with letter
    });

    return res.status(200).json({
      success: true,
      data: asset,
      message: asset.length ? "Asset found" : "No asset found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
