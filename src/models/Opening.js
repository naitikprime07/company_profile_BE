const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Opening",
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 120 },
      type: {
        type: String,
        required: true,
        enum: ["internship", "experienced"],
      },
      location: { type: String, required: true, trim: true, maxlength: 120 },
      experience: { type: String, required: true, trim: true, maxlength: 100 },
      commitment: { type: String, required: true, trim: true, maxlength: 100 },
      vacancies: { type: Number, required: true, min: 1, max: 500 },
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
      roleOverview: { type: String, required: true, trim: true, maxlength: 3000 },
      keyRequirements: { type: String, required: true, trim: true, maxlength: 4000 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
  ),
);
