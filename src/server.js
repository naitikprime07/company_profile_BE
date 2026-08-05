require("dotenv").config();

const createApp = require("./app");
const connectDatabase = require("./config/database");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

async function start() {
  try {
    await connectDatabase(mongoUri);
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const email=process.env.ADMIN_EMAIL.trim().toLowerCase();
      if (!await Admin.exists({email})) await Admin.create({email,passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD,12)});
    }
    createApp().listen(port, () => console.log(`API listening on port ${port}`));
  } catch (error) {
    console.error("Failed to start API", error);
    process.exit(1);
  }
}

start();
