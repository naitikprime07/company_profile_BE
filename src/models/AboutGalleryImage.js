const mongoose = require("mongoose");

const aboutGalleryImageSchema = new mongoose.Schema(
  {
    image: { type: String, required: true, trim: true, maxlength: 2048 },
    alt: { type: String, trim: true, maxlength: 120, default: "" },
    order: { type: Number, min: 0, max: 9999, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AboutGalleryImage", aboutGalleryImageSchema);
