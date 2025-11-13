import express from 'express';
import { createEnquire, deleteEnquire, getEnquires } from '../controllers/enquireController.js';
import { paginate } from '../middileware/pagination.js';

const enquireRouter = express.Router();

enquireRouter.post('/', createEnquire);
enquireRouter.get('/',paginate('enquire',"all_enquire"), getEnquires);
enquireRouter.delete('/', deleteEnquire);

export default enquireRouter;