import express from "express";
import { getContacts, createContact, deleteContact } from "../controllers/contactController.js";
import { authMiddleware } from "../middileware/authMiddleware.js";
import { paginate } from "../middileware/pagination.js";

const contactRouter = express.Router();

// Routes
contactRouter.get("/",authMiddleware,paginate("contact", "all_contact"), getContacts);       // GET all contacts
contactRouter.post("/", createContact);    // POST new contact
contactRouter.delete("/:id",authMiddleware, deleteContact); // DELETE contact by ID

export default contactRouter;