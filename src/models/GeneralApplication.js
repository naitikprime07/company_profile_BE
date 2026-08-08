const mongoose = require("mongoose");

module.exports = mongoose.model(
  "GeneralApplication",
  new mongoose.Schema(
    {
      firstName: { type: String, required: true, trim: true, maxlength: 60 },
      lastName: { type: String, required: true, trim: true, maxlength: 60 },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
      },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      location: { type: String, required: true, trim: true, maxlength: 120 },
      desiredRole: { type: String, required: true, trim: true, maxlength: 120 },
      skills: { type: String, required: true, trim: true, maxlength: 1000 },
      experience: { type: String, trim: true, maxlength: 120, default: "" },
      interests: { type: String, required: true, trim: true, maxlength: 1000 },
      message: { type: String, required: true, trim: true, maxlength: 3000 },
      portfolioUrl: { type: String, trim: true, maxlength: 500, default: "" },
      linkedInUrl: { type: String, trim: true, maxlength: 500, default: "" },
      githubUrl: { type: String, trim: true, maxlength: 500, default: "" },
      resumeUrl: { type: String, required: true, trim: true, maxlength: 2048 },
      status: {
        type: String,
        enum: ["new", "reviewing", "contacted", "archived"],
        default: "new",
        index: true,
      },
    },
    { timestamps: true, versionKey: false },
  ),
);
