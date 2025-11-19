import Joi from "joi";


// Joi schema for asset creation/update
export const assetValidator = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().max(2500).allow("", null),
  
  address: Joi.object({
    place: Joi.string().max(50).allow("", null),
    street: Joi.string().max(50).allow("", null),
    city: Joi.string().max(50).allow("", null),
    pincode: Joi.number().integer().min(100000).max(999999).allow(null),
    state: Joi.string().max(50).allow("", null),
    country: Joi.string().max(50).allow("", null),
  }).optional(),
  seller: Joi.object({
    name: Joi.string().max(50).allow("", null),
    phone: Joi.string().max(50).allow("", null),
    email: Joi.string().trim().email().lowercase().required(),

  }).optional(),

  price: Joi.number().min(0).default(0),

  categoryId: Joi.string().required().messages({
    "any.required": "Category ID is required",
  }),
  slug: Joi.string().trim().lowercase().optional(),
  subcategoryId: Joi.string().required().messages({
    "any.required": "SubCategory ID is required",
  }),

  location: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array()
      .items(Joi.number().required()) // [longitude, latitude]
      .length(2)
      .required(),
  }).required(),

  yearofpurchase: Joi.date().allow(null),

  mapFrameLink: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .allow("", null),

  quantity: Joi.number().min(1).default(1),

  brands: Joi.string().max(50).allow("", null),

  status: Joi.string()
    .valid("available", "sold", "archived")
    .default("available"),
  tags: Joi.string()
    .valid("feature", "new", "popular", "trending", "sale", "limited")
    .default("feature"),

  condition: Joi.string()
    .valid("new", "used", "refurbished")
    .default("new"),

  isActive: Joi.boolean().default(true),
});
