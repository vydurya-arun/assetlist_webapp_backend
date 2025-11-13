import Joi from "joi";

export const subcategoryValidationSchema = Joi.object({
  subCatname: Joi.string().trim().required().messages({
    "string.empty": "subcategory name is required",
  }),

  slug: Joi.string().trim().lowercase().optional(),

  description: Joi.string().max(250).optional().messages({
    "string.max": "Description should not exceed 250 characters",
  }),
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Category ID is required",
      "string.pattern.base": "Invalid Category ID format (must be a valid ObjectId)",
    }),


  isActive: Joi.boolean().optional(),
});
