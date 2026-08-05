function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [field, detail.message]),
    );
    return res.status(422).json({ success: false, message: "Validation failed.", errors });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
}

module.exports = errorHandler;

