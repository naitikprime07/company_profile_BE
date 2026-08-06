const test = require("node:test");
const assert = require("node:assert/strict");
const Joi = require("joi");
const validateRequest = require("../src/middlewares/validateRequest");

function createResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("returns all Joi field errors in a consistent response", () => {
  const middleware = validateRequest(
    Joi.object({
      name: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
    }),
  );
  const req = { body: { name: "", email: "invalid" } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 422);
  assert.equal(res.payload.success, false);
  assert.match(res.payload.errors.name, /empty/);
  assert.match(res.payload.errors.email, /valid email/);
});

test("passes normalized values to the next middleware", () => {
  const middleware = validateRequest({
    body: Joi.object({
      email: Joi.string().trim().lowercase().email().required(),
    }),
    params: Joi.object({ id: Joi.number().integer().positive().required() }),
  });
  const req = {
    body: { email: " USER@EXAMPLE.COM " },
    params: { id: "42" },
  };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.email, "user@example.com");
  assert.equal(req.params.id, 42);
});
