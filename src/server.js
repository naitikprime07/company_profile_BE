require("dotenv").config();

const createApp = require("./app");
const connectDatabase = require("./config/database");

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

async function start() {
  try {
    await connectDatabase(mongoUri);
    createApp().listen(port, () => console.log(`API listening on port ${port}`));
  } catch (error) {
    console.error("Failed to start API", error);
    process.exit(1);
  }
}

start();

