import { Router } from "express";
import { getAlluser, loginAdmin, logout, registerAdmin } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post('/adminRegister', registerAdmin);
authRouter.get('/alluser', getAlluser);
authRouter.post('/adminLogin', loginAdmin);
authRouter.post('/logout', logout);

export default authRouter;