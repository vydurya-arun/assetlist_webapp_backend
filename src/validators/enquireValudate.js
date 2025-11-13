import Joi from "joi";

export const enquireValudate = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().min(10).max(10).required(),
  comment: Joi.string().min(5).required(),
  assetId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Category ID is required",
      "string.pattern.base": "Invalid Category ID format (must be a valid ObjectId)",
    }),
});
