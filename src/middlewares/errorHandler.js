function errorHandler(error, _req, res, _next) {
  if (
    error?.code === 11000 &&
    error?.keyPattern?.opening &&
    error?.keyPattern?.email
  )
    return res
      .status(409)
      .json({
        success: false,
        message: "You have already applied for this opening with this email.",
      });
  if (error?.code === 11000 && error?.keyPattern?.email)
    return res.status(409).json({
      success: false,
      message:
        "A submission with this email already exists. Please try again after the server restarts.",
    });
  console.error(error);

  if (error.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [
        field,
        detail.message,
      ]),
    );
    return res
      .status(422)
      .json({ success: false, message: "Validation failed.", errors });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
}

module.exports = errorHandler;
