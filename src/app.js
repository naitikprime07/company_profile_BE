const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const contactRoutes = require("./routes/contactRoutes");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const adminRoutes = require("./routes/adminRoutes");
const openingRoutes = require("./routes/openingRoutes");

function createApp() {
  const app = express();
  const allowedOrigins = (
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5173" ||
    "https://company-profile-6ii9o5thg-prime-softech.vercel.app"
  )
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
  app.use("/api/openings", openingRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
