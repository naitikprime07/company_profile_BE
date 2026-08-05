const test = require("node:test");
const assert = require("node:assert/strict");
const validateContact = require("../src/validators/contactValidator");

test("accepts and trims a valid contact submission", () => {
  const result = validateContact({
    name: "  Ada Lovelace ",
    email: " ada@example.com ",
    phone: "+91 98765 43210",
    company: " Example Ltd ",
    service: "Web development",
    budget: "$10k – $25k",
    message: " Build a new website ",
  });

  assert.equal(result.isValid, true);
  assert.equal(result.data.name, "Ada Lovelace");
  assert.equal(result.data.email, "ada@example.com");
  assert.equal(result.data.message, "Build a new website");
});

test("rejects unsupported service and budget values", () => {
  const result = validateContact({
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+919876543210",
    service: "Unknown service",
    budget: "Unlimited",
    message: "Please build our new product.",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.service, "service is not supported");
  assert.equal(result.errors.budget, "budget is not supported");
});

test("rejects missing required fields and invalid email", () => {
  const result = validateContact({ email: "invalid" });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.name, "name is required");
  assert.equal(result.errors.email, "email must be valid");
  assert.equal(result.errors.message, "message is required");
});
