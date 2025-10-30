import { Router } from "express";
import { getAlluser, registerAdmin } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post('/register', registerAdmin);
authRouter.get('/alluser', getAlluser);

export default authRouter;