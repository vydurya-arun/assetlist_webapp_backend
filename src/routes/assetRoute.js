import express from 'express';
import { createAsset, getAllAssets, getAllAssetsCards } from '../controllers/assetController.js';
import { authMiddleware } from '../middileware/authMiddleware.js';
import { uploadMultiple } from '../middileware/multer.js';

const assetRoute = express.Router();

assetRoute.post('/',authMiddleware, uploadMultiple, createAsset);
assetRoute.get('/',authMiddleware, getAllAssets);
assetRoute.get('/allassets_cardview',authMiddleware, getAllAssetsCards);

export default assetRoute;