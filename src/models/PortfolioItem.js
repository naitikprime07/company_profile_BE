const mongoose = require("mongoose");

module.exports = mongoose.model(
  "PortfolioItem",
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 120 },
      type: { type: String, required: true, enum: ["app", "web"], index: true },
      category: { type: String, required: true, trim: true, maxlength: 80 },
      excerpt: { type: String, required: true, trim: true, maxlength: 300 },
      image: { type: String, trim: true, maxlength: 2048, default: "" },
      detailImages: {
        type: [{ type: String, trim: true, maxlength: 2048 }],
        default: [],
        validate: [(items) => items.length <= 2, "Only two detail images are allowed."],
      },
      projectUrl: { type: String, trim: true, maxlength: 2048, default: "" },
      appLink: { type: String, trim: true, maxlength: 2048, default: "" },
      webLink: { type: String, trim: true, maxlength: 2048, default: "" },
      platforms: [{ type: String, trim: true, maxlength: 40 }],
      technologies: [{ type: String, trim: true, maxlength: 40 }],
      metric: { type: String, trim: true, maxlength: 30, default: "" },
      metricLabel: { type: String, trim: true, maxlength: 80, default: "" },
      isPublished: { type: Boolean, default: true, index: true },
      isFeatured: { type: Boolean, default: false },
      sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false },
  ),
);
