const mongoose = require("mongoose");
const {
  BUDGET_OPTIONS,
  SERVICE_OPTIONS,
  CONTACT_STATUSES,
} = require("../constants/contactOptions");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    company: { type: String, trim: true, maxlength: 150, default: "" },
    service: { type: String, required: true, enum: SERVICE_OPTIONS },
    budget: { type: String, required: true, enum: BUDGET_OPTIONS },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: CONTACT_STATUSES,
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, value) => {
        value.id = value._id.toString();
        delete value._id;
        return value;
      },
    },
  },
);

contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);
