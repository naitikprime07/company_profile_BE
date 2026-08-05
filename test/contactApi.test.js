const test = require("node:test");
const assert = require("node:assert/strict");
const createApp = require("../src/app");
const contactService = require("../src/services/contactService");

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test("POST /api/contacts validates and stores a project brief", async () => {
  const originalCreate = contactService.create;
  let storedData;
  contactService.create = async (data) => {
    storedData = data;
    return { id: "contact-123", createdAt: new Date("2026-08-05T00:00:00.000Z") };
  };

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/contacts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Ada Lovelace",
          email: "ADA@EXAMPLE.COM",
          phone: "+919876543210",
          company: "Analytical Engines",
          service: "Web development",
          budget: "Not decided",
          message: "We need a new company website.",
        }),
      });
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.id, "contact-123");
      assert.equal(storedData.email, "ada@example.com");
    });
  } finally {
    contactService.create = originalCreate;
  }
});

test("POST /api/contacts returns field errors for invalid input", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/contacts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const body = await response.json();

    assert.equal(response.status, 422);
    assert.equal(body.success, false);
    assert.equal(body.errors.name, "name is required");
    assert.equal(body.errors.email, "email must be valid");
  });
});
