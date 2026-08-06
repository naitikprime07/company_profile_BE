const {
  BUDGET_OPTIONS,
  SERVICE_OPTIONS,
} = require("../constants/contactOptions");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;
const REQUIRED_FIELDS = [
  "name",
  "email",
  "phone",
  "service",
  "budget",
  "message",
];
const LIMITS = {
  name: 100,
  email: 254,
  phone: 20,
  company: 150,
  service: 100,
  budget: 100,
  message: 5000,
};

function validateContact(payload) {
  const source =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : {};
  const data = {};
  const errors = {};

  for (const [field, maximum] of Object.entries(LIMITS)) {
    const value = typeof source[field] === "string" ? source[field].trim() : "";
    data[field] = value;

    if (REQUIRED_FIELDS.includes(field) && !value) {
      errors[field] = `${field} is required`;
    } else if (value.length > maximum) {
      errors[field] = `${field} must be at most ${maximum} characters`;
    }
  }

  if (data.name && data.name.length < 2)
    errors.name = "name must be at least 2 characters";
  if (data.email && !EMAIL_PATTERN.test(data.email))
    errors.email = "email must be valid";
  data.phone = data.phone.replace(/[\s()-]/g, "");
  if (data.phone && !PHONE_PATTERN.test(data.phone))
    errors.phone = "phone must be valid";
  if (data.service && !SERVICE_OPTIONS.includes(data.service))
    errors.service = "service is not supported";
  if (data.budget && !BUDGET_OPTIONS.includes(data.budget))
    errors.budget = "budget is not supported";
  if (data.message && data.message.length < 10)
    errors.message = "message must be at least 10 characters";

  data.email = data.email.toLowerCase();
  return { data, errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = validateContact;
