function errorHandler(error, _req, res, _next) {
  if (error?.code === "LIMIT_FILE_SIZE")
    return res
      .status(413)
      .json({ success: false, message: "Resume must be 5 MB or smaller." });
  if (error?.message === "Only PDF, DOC, and DOCX resumes are accepted.")
    return res.status(422).json({ success: false, message: error.message });
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
