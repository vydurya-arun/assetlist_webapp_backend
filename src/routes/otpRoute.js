// routes/otpRoutes.js
import express from "express";
import {  sendOtp, verifyOtpAndSetPassword } from "../controllers/otpController.js";

const otpRouter = express.Router();

otpRouter.post("/send", sendOtp);
otpRouter.post("/verify", verifyOtpAndSetPassword);

export default otpRouter;