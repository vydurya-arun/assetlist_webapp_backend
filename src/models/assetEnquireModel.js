import mongoose from "mongoose";

const enquireSchema = new mongoose.Schema(
  {

    comment: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required:true
    },
    phone: {
      type: String,
      trim: true,
      required:true
    },
    assetId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,        
    }
  },
  { timestamps: true }
);

const enquireModel =  mongoose.model("Enquire", enquireSchema);
export default enquireModel;