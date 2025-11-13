import redisClient from "../config/redisClient.js";
import contactModel from "../models/contactModel.js";
import { contactValudate } from "../validators/contactValudation.js";

// GET all contacts
export const getContacts = async (req, res) => {
  try {
    const { page, limit, startIndex, endIndex, cacheKey } = req.pagination;
    let cachedData = null;

    // Try Redis get
    if (redisClient.isOpen) {
      try {
        cachedData = await redisClient.get(cacheKey);
      } catch (err) {
        console.warn("⚠️ Redis get failed:", err.message);
      }
    }

    //  If cache found
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const totalItems = parsedData.length;
      const resultCachedData = parsedData.slice(startIndex, endIndex);

      const nextPage = endIndex < totalItems ? { page: page + 1, limit } : null;
      const prevPage = startIndex > 0 ? { page: page - 1, limit } : null;

      return res.status(200).json({
        success: true,
        fromCache: true,
        totalItems,
        next: nextPage,
        previous: prevPage,
        data: resultCachedData,
      });
    }

    //  Fallback to DB
    const contact = await contactModel.find();
    if (!contact?.length) {
      return res.status(404).json({ success: false, message: "No contact found" });
    }

    // Store in Redis
    if (redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(contact));
      } catch (err) {
        console.warn("⚠️ Redis set failed:", err.message);
      }
    }

    const totalItems = contact.length;
    const result = contact.slice(startIndex, endIndex);
    const nextPage = endIndex < totalItems ? { page: page + 1, limit } : null;
    const prevPage = startIndex > 0 ? { page: page - 1, limit } : null;

    return res.status(200).json({
      success: true,
      fromCache: false,
      totalItems,
      next: nextPage,
      previous: prevPage,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// POST a new contact
export const createContact = async (req, res) => {
  try {
    const { error } = contactValudate.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((err) => err.message),
      });
    }
    const { first_name, last_name, subject, email, phone, comment } = req.body;

    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Name, email and phone are required" });
    }

    const contact = new contactModel({
        first_name, last_name, subject, email, phone, comment
    });

    await contact.save();

    //  Clear Redis cache (optional)
    if (redisClient?.isOpen) {
      await redisClient.del("all_contact");
    }

    return res.status(201).json({ success: true, message: "contact create sucessfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// DELETE a contact by ID
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await contactModel.findById(id);

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    await contact.deleteOne();

    if (redisClient?.isOpen) {
      await redisClient.del("all_contact");
    }
    res.status(200).json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
       return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
