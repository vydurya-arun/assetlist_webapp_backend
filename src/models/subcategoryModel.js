import mongoose from "mongoose";
import slugify from "slugify";

const subcategorySchema = new mongoose.Schema(
  {
    subCatname: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowecase: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    discription: {
      type: String,
      maxlength: 250,
    },
    image: {
      public_id: { type: String },
      url: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate slug
subcategorySchema.pre("save", function (next) {
  if (this.isModified("subCatname")) {
    this.slug = slugify(this.subCatname, { lower: true, strict: true });
  }
  next();
});

const subCatModel = mongoose.model("SubCategory", subcategorySchema);
export default subCatModel;
