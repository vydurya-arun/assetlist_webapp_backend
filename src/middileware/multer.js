import multer from "multer";

// Store files in memory (for direct Cloudinary upload)
const storage = multer.memoryStorage();

// File type filter (only allow images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)!"), false);
};

//File size limit (25 MB)
const limits = { fileSize: 25 * 1024 * 1024 };

// Base multer instance
export const upload = multer({ storage, fileFilter, limits });

// Handle both single `coverImage` and multiple `images` fields
export const uploadMultiple = (req, res, next) => {
  const handler = upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 8 },
  ]);

  handler(req, res, (err) => {
    if (err) return next(err);

    // Custom image count validation
    const coverImageCount = req.files?.coverImage ? req.files.coverImage.length : 0;
    const galleryCount = req.files?.images ? req.files.images.length : 0;
    const totalCount = coverImageCount + galleryCount;

    if (totalCount < 1) {
      return next(new Error("You must upload at least 1 image (cover or gallery)."));
    }
    if (totalCount > 8) {
      return next(new Error("You can upload a maximum of 8 images in total."));
    }

    next();
  });
};



