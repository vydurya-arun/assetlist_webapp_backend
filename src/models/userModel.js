import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userName:{type:String, required:true},
    email:{type:String, required: true},
    password:{type:String, required: true},
    role:{type:String, enum:['admin','editor','user'], default:"admin"}
},{timestamps: true})

const userModel = mongoose.model('User', userSchema);
export default userModel;