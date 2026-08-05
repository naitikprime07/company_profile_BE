const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const contactRoutes = require("../routes/contactRoutes");

function createApp() {
  const app = express();
  const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "20kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "API is healthy" });
  });
  app.use("/api/contacts", contactRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  });

  return app;
}

module.exports = createApp;

