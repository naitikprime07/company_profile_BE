const express = require("express");
const rateLimit = require("express-rate-limit");
const { createContact } = require("../controllers/contactController");
const validateContactRequest = require("../middlewares/validateContact");

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." },
});

router.post("/", contactLimiter, validateContactRequest, createContact);

module.exports = router;

