const mongoose = require("mongoose");
const Contact = require("../models/Contact");

async function removeLegacyContactEmailIndex() {
  let indexes;

  try {
    indexes = await Contact.collection.indexes();
  } catch (error) {
    // A fresh database does not have a contacts collection yet.
    if (error?.code === 26 || error?.codeName === "NamespaceNotFound") return;
    throw error;
  }

  const legacyIndex = indexes.find(
    (index) =>
      index.name === "email_1" &&
      index.unique === true &&
      Object.keys(index.key).length === 1 &&
      index.key.email === 1,
  );

  if (legacyIndex) {
    await Contact.collection.dropIndex(legacyIndex.name);
    console.log("Removed legacy unique contact email index");
  }
}

async function connectDatabase(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  await removeLegacyContactEmailIndex();
  console.log("MongoDB connected");
}

module.exports = connectDatabase;
module.exports.removeLegacyContactEmailIndex = removeLegacyContactEmailIndex;
