
import express from 'express';
import { createCategory, deleteAllCategory, deleteCategoryById, getAllCategory, getCategoryById, updateCategoryById } from '../controllers/categoryController.js';
import { upload } from '../middileware/multer.js';
import { authMiddleware } from '../middileware/authMiddleware.js';
import { paginate } from '../middileware/pagination.js';

const categoryRoute = express.Router();

categoryRoute.post('/',authMiddleware,  upload.single("file"), createCategory);
categoryRoute.get('/', authMiddleware,paginate("category", "all_category"), getAllCategory)
categoryRoute.get('/:id',authMiddleware, getCategoryById);
categoryRoute.delete('/:id',authMiddleware, deleteCategoryById);
categoryRoute.delete('/',authMiddleware, deleteAllCategory);
categoryRoute.put('/:id',authMiddleware,upload.single("file"), updateCategoryById);

export default categoryRoute;