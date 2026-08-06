const contactService = require("../services/contactService");

async function createContact(req, res, next) {
  try {
    const contact = await contactService.create(req.body);
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
