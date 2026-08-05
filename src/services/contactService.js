const Contact = require("../models/Contact");

async function create(data) {
  return Contact.create(data);
}

module.exports = { create };

