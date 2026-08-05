const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limits = {
  name: 100,
  email: 254,
  company: 150,
  service: 100,
  budget: 100,
  message: 5000,
};

function validateContact(payload = {}) {
  const data = {};
  const errors = {};

  for (const field of Object.keys(limits)) {
    const value = typeof payload[field] === "string" ? payload[field].trim() : "";
    data[field] = value;

    if (["name", "email", "service", "budget", "message"].includes(field) && !value) {
      errors[field] = `${field} is required`;
    } else if (value.length > limits[field]) {
      errors[field] = `${field} must be at most ${limits[field]} characters`;
    }
  }

  if (data.email && !EMAIL_PATTERN.test(data.email)) {
    errors.email = "email must be valid";
  }

  return { data, errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = validateContact;

