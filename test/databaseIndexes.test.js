const test = require("node:test");
const assert = require("node:assert/strict");
const Contact = require("../src/models/Contact");
const {
  removeLegacyContactEmailIndex,
} = require("../src/config/database");

test("removes only the legacy unique contact email index", async () => {
  const originalIndexes = Contact.collection.indexes;
  const originalDropIndex = Contact.collection.dropIndex;
  let droppedIndex;

  Contact.collection.indexes = async () => [
    { name: "_id_", key: { _id: 1 } },
    { name: "email_1", key: { email: 1 }, unique: true },
    { name: "createdAt_-1", key: { createdAt: -1 } },
  ];
  Contact.collection.dropIndex = async (name) => {
    droppedIndex = name;
  };

  try {
    await removeLegacyContactEmailIndex();
    assert.equal(droppedIndex, "email_1");
  } finally {
    Contact.collection.indexes = originalIndexes;
    Contact.collection.dropIndex = originalDropIndex;
  }
});

test("keeps a non-unique contact email index", async () => {
  const originalIndexes = Contact.collection.indexes;
  const originalDropIndex = Contact.collection.dropIndex;
  let dropCalled = false;

  Contact.collection.indexes = async () => [
    { name: "email_1", key: { email: 1 } },
  ];
  Contact.collection.dropIndex = async () => {
    dropCalled = true;
  };

  try {
    await removeLegacyContactEmailIndex();
    assert.equal(dropCalled, false);
  } finally {
    Contact.collection.indexes = originalIndexes;
    Contact.collection.dropIndex = originalDropIndex;
  }
});
