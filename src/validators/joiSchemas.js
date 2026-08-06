const Joi = require("joi");
const {
  BUDGET_OPTIONS,
  CONTACT_STATUSES,
  SERVICE_OPTIONS,
} = require("../constants/contactOptions");

const requiredString = (maximum) => Joi.string().trim().max(maximum).required();

const objectIdParams = (field = "id") =>
  Joi.object({
    [field]: Joi.string().hex().length(24).required(),
  });

const contact = Joi.object({
  name: requiredString(100).min(2),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  phone: Joi.string()
    .trim()
    .replace(/[\s()-]/g, "")
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .required(),
  company: Joi.string().trim().max(150).allow("").default(""),
  service: Joi.string()
    .trim()
    .valid(...SERVICE_OPTIONS)
    .required(),
  budget: Joi.string()
    .trim()
    .valid(...BUDGET_OPTIONS)
    .required(),
  message: requiredString(500).min(10),
}).messages({
  "any.required": "{#key} is required",
  "string.empty": "{#key} is required",
  "string.email": "email must be valid",
  "string.pattern.base": "phone must be valid",
  "any.only": "{#key} is not supported",
});

const adminCredentials = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().min(12).max(128).required(),
});

const login = adminCredentials.fork("password", (schema) => schema.min(1));

const opening = Joi.object({
  title: requiredString(120),
  type: Joi.string().valid("internship", "experienced").required(),
  location: requiredString(120),
  experience: requiredString(100),
  commitment: requiredString(100),
  vacancies: Joi.number().integer().min(1).max(500).required(),
  description: requiredString(1000),
  roleOverview: requiredString(3000),
  keyRequirements: requiredString(4000),
  isActive: Joi.boolean().default(true),
});

const contactStatus = Joi.object({
  status: Joi.string()
    .valid(...CONTACT_STATUSES)
    .required(),
});

const applicationStatus = Joi.object({
  status: Joi.string()
    .valid("new", "reviewing", "shortlisted", "rejected", "hired")
    .required(),
});

module.exports = {
  adminCredentials,
  applicationStatus,
  contact,
  contactStatus,
  login,
  objectIdParams,
  opening,
};
