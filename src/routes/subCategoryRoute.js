
import express from 'express';
import { upload } from '../middileware/multer.js';
import { authMiddleware } from '../middileware/authMiddleware.js';
import { paginate } from '../middileware/pagination.js';
import { createSubCategory, deleteAllSubCategory, deletesubCategoryById, getAllsubCategory, getsubCategoryById, updatesubCategoryById } from '../controllers/subCategoryController.js';


const subCategoryRoute = express.Router();

subCategoryRoute.post('/',authMiddleware,  upload.single("file"), createSubCategory);
subCategoryRoute.get('/', authMiddleware,paginate("subcategory", "all_subcategory"), getAllsubCategory);
subCategoryRoute.get('/:id', authMiddleware, getsubCategoryById);
subCategoryRoute.delete('/:id', authMiddleware, deletesubCategoryById);
subCategoryRoute.delete('/', authMiddleware, deleteAllSubCategory);
subCategoryRoute.put('/:id', authMiddleware,upload.single("file"), updatesubCategoryById);


export default subCategoryRoute;