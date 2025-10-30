import userModel from "../models/userModel.js";
import { registerValidator } from "../validators/registerValidate.js";
import bcrypt from "bcryptjs";

export const registerAdmin = async (req, res) => {
    try {

        const { error } = registerValidator.validate(req.body, {
            abortEarly: false,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map((err) => err.message),
            });
        }
        const { userName, email, password, role } = req.body;
        if (!userName || !email || !password || !role) {
            return res.status(404).json({ success: false, message: "Username, email, password, or role is missing" })
        }

        const existUser = await userModel.findOne({email});
        if (existUser) {
            return res.status(409).json({ success: false, message: "user is already exist" })
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            userName: userName,
            email: email,
            password: hashPassword,
            role:role
        })
        await user.save();

        return res.status(201).json({success:true, message:"registeration successfully"})

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
}

export const getAlluser = async(req,res) =>{
    try {
        const user = await userModel.find().select("-password");
        if(!user){
            return res.status(404).json({ success: false, message: "Cannot get userdata" });
        }

        return res.status(200).json({success: true, data: user})
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
}