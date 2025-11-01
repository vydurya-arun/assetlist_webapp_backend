import { Router } from "express";
import { createUsers, deleteAllUser, deleteUserById, getAlluser, loginAdmin, logout, refresh, registerAdmin } from "../controllers/authController.js";
import { authMiddleware } from "../middileware/authMiddleware.js";
import { paginate } from "../middileware/pagination.js";

const authRouter = Router();

authRouter.post('/adminRegister', registerAdmin);
authRouter.get('/alluser',authMiddleware,paginate("user", "all_users"), getAlluser);
authRouter.post('/adminLogin', loginAdmin);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refresh);
authRouter.post('/createUser',authMiddleware, createUsers);
authRouter.delete('/deleteByid/:id',authMiddleware, deleteUserById);
authRouter.delete('/deleteAll',authMiddleware, deleteAllUser);


export default authRouter;