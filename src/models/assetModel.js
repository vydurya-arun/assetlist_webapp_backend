import mongoose from "mongoose";
import slugify from "slugify";

const assetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    seller:{
      name:{type: String, },
      email:{type: String,},
      phone:{type:String,},
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: 2500,
    },
    address: {
      place: { type: String, maxlength: 50 },
      street: { type: String, maxlength: 50 },
      city: { type: String, maxlength: 50 },
      pincode: { type: Number },
      state: { type: String, maxlength: 50 },
      country: { type: String, maxlength: 50 },
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
      ref: "SubCategory",
      required: [true, "SubCategory ID is required"],
    },
    coverImage:{
        public_Id: { type: String },
        url: { type: String },
    },
    images: [
      {
        public_Id: { type: String },
        url: { type: String },
      },
    ],
    location: {
      type: { type: String, enum: ["Point"], default: "Point", required: true },
      coordinates: { type: [Number], required: true, default: [0, 0] },
    },
    yearofpurchase: {
      type: Date,
    },
    mapFrameLink: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.startsWith("https://") || v.startsWith("http://");
        },
        message: "Map frame link must be a valid URL",
      },
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    tags: {
      type: [String],
      enum: ["feature", "new", "popular", "trending", "sale", "limited"],
      default: "feature",
    },
    brands: {
      type: String,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: ["available", "sold", "archived"],
      default: "available",
    },
    condition: {
      type: String,
      enum: ["new", "used", "refurbished"],
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



// Geospatial index
assetSchema.index({ location: "2dsphere" });

const assetModel = mongoose.model("Asset", assetSchema);
export default assetModel;
