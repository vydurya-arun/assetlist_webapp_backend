import { Router } from "express";
import { registerAdmin } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post('/register', registerAdmin);

export default authRouter;