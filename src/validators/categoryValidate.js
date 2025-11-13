import Joi from "joi";

export const categoryValidationSchema = Joi.object({
  categoryName: Joi.string().trim().required().messages({
    "string.empty": "Category name is required",
  }),

  slug: Joi.string().trim().lowercase().optional(),

  description: Joi.string().max(250).optional().messages({
    "string.max": "Description should not exceed 250 characters",
  }),


  isActive: Joi.boolean().optional(),
});