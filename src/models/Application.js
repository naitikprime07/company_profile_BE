const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    opening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opening",
      required: true,
      index: true,
    },
    openingTitle: { type: String, required: true },
    opportunityType: {
      type: String,
      enum: ["internship", "experienced"],
      required: true,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    currentCompany: { type: String, trim: true, maxlength: 120, default: "" },
    currentRole: { type: String, trim: true, maxlength: 120, default: "" },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    experienceMonths: { type: Number, min: 0, max: 11, default: 0 },
    noticePeriod: { type: String, trim: true, maxlength: 60, default: "" },
    currentCtc: { type: Number, min: 0, default: 0 },
    expectedCtc: { type: Number, min: 0, default: 0 },
    portfolioUrl: { type: String, trim: true, maxlength: 500, default: "" },
    linkedInUrl: { type: String, trim: true, maxlength: 500, default: "" },
    githubUrl: { type: String, trim: true, maxlength: 500, default: "" },
    coverLetter: { type: String, trim: true, maxlength: 3000, default: "" },
    resumeUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    status: {
      type: String,
      enum: ["new", "reviewing", "shortlisted", "rejected", "hired"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

applicationSchema.index({ opening: 1, email: 1 }, { unique: true });
module.exports = mongoose.model("Application", applicationSchema);
