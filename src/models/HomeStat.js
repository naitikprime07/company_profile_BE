const mongoose = require("mongoose");
module.exports = mongoose.model(
  "HomeStat",
  new mongoose.Schema(
    {
      value: { type: Number, required: true, min: 0, max: 1000000000 },
      suffix: { type: String, trim: true, maxlength: 8, default: "" },
      label: { type: String, required: true, trim: true, maxlength: 120 },
      order: { type: Number, integer: true, min: 0, max: 9999, default: 0 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
  ),
);
