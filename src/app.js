const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const contactRoutes = require("./routes/contactRoutes");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const adminRoutes = require("./routes/adminRoutes");
const openingRoutes = require("./routes/openingRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const chatbotRoutes = require("./routes/chatbot");
const leadershipRoutes = require("./routes/leadershipRoutes");
const blogRoutes = require("./routes/blogRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const homeStatRoutes = require("./routes/homeStatRoutes");
const aboutGalleryRoutes = require("./routes/aboutGalleryRoutes");
const siteConfigRoutes = require("./routes/siteConfigRoutes");

function createApp() {
  const app = express();
  const allowedOrigins = (
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5173" ||
    "https://company-profile-be.vercel.app/api"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "API is healthy" });
  });
  app.use("/api/contacts", contactRoutes);
  app.use("/api/openings", openingRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/chatbot", chatbotRoutes);
  app.use("/api/leadership", leadershipRoutes);
  app.use("/api/blogs", blogRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/home-stats", homeStatRoutes);
  app.use("/api/about-gallery", aboutGalleryRoutes);
  app.use("/api/site-config", siteConfigRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
