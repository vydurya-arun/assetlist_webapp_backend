
import express from 'express';
import { authMiddleware } from '../middileware/authMiddleware.js';
import { paginate } from '../middileware/pagination.js';
import { createSubCategory, deleteAllSubCategory, deletesubCategoryById, getAllsubCategory, getsubCategoryById, updatesubCategoryById } from '../controllers/subCategoryController.js';


const subCategoryRoute = express.Router();

subCategoryRoute.post('/',authMiddleware, createSubCategory);
subCategoryRoute.get('/', authMiddleware,paginate("subcategory", "all_subcategory"), getAllsubCategory);
subCategoryRoute.get('/:id', authMiddleware, getsubCategoryById);
subCategoryRoute.delete('/:id', authMiddleware, deletesubCategoryById);
subCategoryRoute.delete('/', authMiddleware, deleteAllSubCategory);
subCategoryRoute.put('/:id', authMiddleware, updatesubCategoryById);


export default subCategoryRoute;