const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    image: { type: String, trim: true, maxlength: 2048, default: "" },
  },
  { _id: true },
);

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    image: { type: String, trim: true, maxlength: 2048, default: "" },
    bio: { type: String, trim: true, maxlength: 50, default: "" },
  },
  { _id: true },
);

employeeSchema.add({ children: { type: [employeeSchema], default: [] } });

const leadershipTeamSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true, maxlength: 120 },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      minlength: 2,
    },
    owner: { type: ownerSchema, required: true },
    members: { type: [employeeSchema], default: [] },
    order: { type: Number, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LeadershipTeam", leadershipTeamSchema);
