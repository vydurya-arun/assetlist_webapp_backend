import Joi from "joi";

export const registerValidator = Joi.object({
  userName: Joi.string().min(3).max(100).required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string()
    .trim()
    .min(8)
    .max(50)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message("Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .required(),
    role: Joi.string()
    .lowercase()
    .valid("admin", "editor", "user")
    .default("admin"), 
})

export const loginValidator = Joi.object({

  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string()
    .trim()
    .min(8)
    .max(50)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message("Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .required(),
})