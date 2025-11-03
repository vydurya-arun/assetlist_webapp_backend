import multer from "multer";

// Store files in memory instead of disk
const storage = multer.memoryStorage();

// Only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)!"), false);
};

// Set limits for file size (optional)
const limits = {
  fileSize: 25 * 1024 * 1024, // 25MB per file
};

export const upload = multer({ storage, fileFilter, limits });



export const uploadMultiple = (req, res, next) => {
  const handler = upload.array("file", 8); // allow up to 8 files

  handler(req, res, (err) => {
    if (err) return next(err);

    let existingCount = 0;

    // existingImages might come as JSON string or array depending on frontend
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);
        existingCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        // if it's not JSON (maybe sent as multiple form fields)
        if (Array.isArray(req.body.existingImages)) {
          existingCount = req.body.existingImages.length;
        } else {
          existingCount = 1; // single string case
        }
      }
    }

    const newCount = req.files?.length || 0;
    const totalCount = existingCount + newCount;

    if (totalCount < 1) {
      return next(new Error("You must have at least 1 images (max 8 allowed)."));
    }
    if (totalCount > 8) {
      return next(new Error("Maximum 8 images allowed."));
    }

    next();
  });
};


export const uploadReview = (req, res, next) => {
  const handler = upload.array("file", 6); // allow 0–6 files

  handler(req, res, (err) => {
    if (err) return next(err); // multer error
    next();
  });
};