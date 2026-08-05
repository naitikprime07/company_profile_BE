const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    company: { type: String, trim: true, maxlength: 150, default: "" },
    service: { type: String, required: true, trim: true, maxlength: 100 },
    budget: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);

