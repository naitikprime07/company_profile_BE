const Contact = require("../models/Contact");
const validateContact = require("../utils/validateContact");

async function createContact(req, res, next) {
  try {
    const { data, errors, isValid } = validateContact(req.body);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const contact = await Contact.create(data);
    return res.status(201).json({
      success: true,
      message: "Thank you. Your project brief has been received.",
      data: { id: contact.id, createdAt: contact.createdAt },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createContact };

