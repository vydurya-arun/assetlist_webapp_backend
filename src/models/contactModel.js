import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {

    comment: {
      type: String,
      trim: true,
    },
    subject:{
      type: String,
      trim: true,    
    },
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
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
  },
  { timestamps: true }
);

const contactModel =  mongoose.model("contacts", contactSchema);
export default contactModel;