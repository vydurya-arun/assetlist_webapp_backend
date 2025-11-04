// controllers/otpController.js
import Otp from "../models/otpModel.js";
import User from "../models/userModel.js"; // your user schema
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";

const OTP_EXPIRY_MINUTES = 10;

//  Send OTP to email
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Generate random 6-digit OTP as string
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB with expiry
    const otpData = await Otp.findOneAndUpdate(
      { email },
      { otp: otpCode, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000) },
      { upsert: true } // creates new if not exists
    );

    // Send OTP email
    await sendEmail(email, "Your OTP Code", `Your OTP is: ${otpCode}`);

    //  Format expiry time
    const formattedExpiry = otpData.expiresAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    //  Calculate remaining time in seconds
    const remainingMs = new Date(otpData.expiresAt) - new Date();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    // Return OTP in response (for testing only; remove in production)
    res.json({ success: true, message: "OTP sent successfully",expireTime: formattedExpiry,remainSec: remainingSeconds, });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP", });
  }
};

export const verifyOtpAndSetPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body;

    if (!email || !pin || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Email, OTP and new password are required" });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord)
      return res
        .status(400)
        .json({ success: false, message: "OTP not found or expired" });

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ email }); // delete expired OTP
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    // Compare OTP
    if (pin !== otpRecord.otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Delete OTP after successful verification
    await Otp.deleteOne({ email });

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

