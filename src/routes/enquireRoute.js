import express from 'express';
import { createEnquire, deleteEnquire, getEnquires } from '../controllers/enquireController.js';
import { paginate } from '../middileware/pagination.js';
import { authMiddleware } from '../middileware/authMiddleware.js';

const enquireRouter = express.Router();

enquireRouter.post('/', createEnquire);
enquireRouter.get('/',authMiddleware, paginate('enquire',"all_enquire"), getEnquires);
enquireRouter.delete('/:id',authMiddleware, deleteEnquire);

export default enquireRouter;