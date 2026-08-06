const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.resolve(__dirname, "../../uploads/resumes");
fs.mkdirSync(uploadDirectory, { recursive: true });
const allowedTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(allowedTypes.has(file.mimetype) ? null : new Error("Only PDF, DOC, and DOCX resumes are accepted."), allowedTypes.has(file.mimetype)),
});

module.exports = { upload, uploadDirectory };
