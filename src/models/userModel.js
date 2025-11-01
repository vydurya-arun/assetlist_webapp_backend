import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userName:{type:String, required:true, unique:true},
    email:{type:String, required: true,unique:true},
    password:{type:String, required: true},
    role:{type:String, enum:['admin','editor','user'], default:"admin"},
    isActive: { type: Boolean, default: true,},
    lastLoginAt: { type: Date, default: null,},
},{timestamps: true})

const userModel = mongoose.model('User', userSchema);
export default userModel;