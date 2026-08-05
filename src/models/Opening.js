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
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000,
      },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
  ),
);
