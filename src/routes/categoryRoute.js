
import express from 'express';
import { createCategory, getAllCategory } from '../controllers/categoryController.js';
import { upload } from '../middileware/multer.js';
import { authMiddleware } from '../middileware/authMiddleware.js';
import { paginate } from '../middileware/pagination.js';

const categoryRoute = express.Router();

categoryRoute.post('/',authMiddleware,  upload.single("file"), createCategory);
categoryRoute.get('/', authMiddleware,paginate("category", "all_category"), getAllCategory)

export default categoryRoute;