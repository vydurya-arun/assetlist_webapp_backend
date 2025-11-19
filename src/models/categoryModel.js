import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowecase: true,
    },
    description: {
      type: String,
      maxlength: 250,
    },
    icon: {
    type: String,
    required: true,
  },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate slug
categorySchema.pre("save", function (next) {
  if (this.isModified("categoryName")) {
    this.slug = slugify(this.categoryName, { lower: true, strict: true });
  }
  next();
});

const categoryModel = mongoose.model("Category", categorySchema);
export default categoryModel;
