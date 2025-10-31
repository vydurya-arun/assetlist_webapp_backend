import userModel from "../models/userModel.js";
import { registerValidator } from "../validators/registerValidate.js";
import bcrypt from "bcryptjs";
import redisClient from "../config/redisClient.js";

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

        // Invalidate the cache after creating a user
        await redisClient.del("all_users");

        return res.status(201).json({success:true, message:"registeration successfully"})

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
}

export const getAlluser = async(req,res) =>{
    try {

        const cacheKey = "all_users";

        // fetch data from redis cache
        const cachedData = await redisClient.get(cacheKey);

        if(cachedData){
            return res.status(200).json({success:true, fromCache:true, data:JSON.parse(cachedData)});
        }

        const user = await userModel.find().select("-password");
        if(!user){
            return res.status(404).json({ success: false, message: "Cannot get userdata" });
        }

        //store data to redis
        await redisClient.setEx(cacheKey, 300, JSON.stringify(user))

        return res.status(200).json({success: true, data: user})
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
}