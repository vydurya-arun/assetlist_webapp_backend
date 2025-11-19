import express from 'express';
import { createAsset, deleteAllAssets, deleteAssetById, getAllAssets, getAllAssetsCards, getAssetUsingById, updateAssetById } from '../controllers/assetController.js';
import { authMiddleware } from '../middileware/authMiddleware.js';
import { uploadMultiple } from '../middileware/multer.js';
import { paginate } from '../middileware/pagination.js';

const assetRoute = express.Router();

assetRoute.post('/',authMiddleware, uploadMultiple, createAsset);
assetRoute.get('/',authMiddleware,paginate("asset", "all_assets"), getAllAssets);
assetRoute.get('/cardview',paginate("asset", "all_assets"), getAllAssetsCards);
assetRoute.get('/:slug', getAssetUsingById);
assetRoute.delete('/:id',authMiddleware,deleteAssetById);
assetRoute.delete('/',authMiddleware,deleteAllAssets);
assetRoute.put('/:id',authMiddleware,uploadMultiple,updateAssetById)

export default assetRoute;