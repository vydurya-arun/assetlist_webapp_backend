import mongoose from "mongoose";
import slugify from "slugify";

const assetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    discription: {
      type: String,
      maxlength: 2500,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        public_Id: { type: String },
        url: { type: String },
      },
    ],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["available", "sold", "archived"],
      default: "available",
    },
    condition: {
      type: String,
      enenum: ["new", "used", "refurbished"],
      default: "new",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted user ID is required"],
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate slug
assetSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const assetModel = mongoose.model("asset", assetSchema);
export default assetModel;
