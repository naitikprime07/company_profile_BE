const validateContact = require("../validators/contactValidator");

function validateContactRequest(req, res, next) {
  const { data, errors, isValid } = validateContact(req.body);

  if (!isValid) {
    return res.status(422).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors,
    });
  }

  req.validatedBody = data;
  return next();
}

module.exports = validateContactRequest;

