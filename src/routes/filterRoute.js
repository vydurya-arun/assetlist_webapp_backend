import express from 'express';
import {  searchAllProduct } from '../controllers/filterController.js';


const filterRouter = express.Router();


filterRouter.get("/", searchAllProduct);




export default filterRouter;