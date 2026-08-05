const test = require("node:test");
const assert = require("node:assert/strict");
const validateContact = require("../src/utils/validateContact");

test("accepts and trims a valid contact submission", () => {
  const result = validateContact({
    name: "  Ada Lovelace ",
    email: " ada@example.com ",
    company: " Example Ltd ",
    service: "Web development",
    budget: "$10k - $25k",
    message: " Build a new website ",
  });

  assert.equal(result.isValid, true);
  assert.equal(result.data.name, "Ada Lovelace");
  assert.equal(result.data.message, "Build a new website");
});

test("rejects missing required fields and invalid email", () => {
  const result = validateContact({ email: "invalid" });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.name, "name is required");
  assert.equal(result.errors.email, "email must be valid");
  assert.equal(result.errors.message, "message is required");
});
