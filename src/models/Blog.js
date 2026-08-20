const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Blog",
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 160 },
      slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
        maxlength: 180,
      },
      excerpt: { type: String, required: true, trim: true, maxlength: 500 },
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1e9,
      },
      coverImage: { type: String, trim: true, maxlength: 2048, default: "" },
      author: { type: String, required: true, trim: true, maxlength: 100 },
      authorDetails: {
        designation: { type: String, trim: true, maxlength: 100, default: "" },
        bio: { type: String, trim: true, maxlength: 600, default: "" },
        linkedin: { type: String, trim: true, maxlength: 2048, default: "" },
        image: { type: String, trim: true, maxlength: 2048, default: "" },
      },
      category: { type: String, required: true, trim: true, maxlength: 80 },
      tags: [{ type: String, trim: true, maxlength: 40 }],
      isPublished: { type: Boolean, default: false, index: true },
      isFeatured: { type: Boolean, default: false },
      publishedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
  ),
);
