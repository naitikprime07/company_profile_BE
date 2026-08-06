const fs = require("fs/promises");
const path = require("path");
const Application = require("../models/Application");
const Opening = require("../models/Opening");
const { uploadDirectory } = require("../config/resumeUpload");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;
const clean = (value) => (typeof value === "string" ? value.trim() : "");
const removeUpload = async (file) => {
  if (file) await fs.unlink(file.path).catch(() => {});
};

async function create(req, res, next) {
  try {
    const opening = await Opening.findOne({
      _id: req.params.openingId,
      isActive: true,
    });
    if (!opening) {
      await removeUpload(req.file);
      return res.status(404).json({
        success: false,
        message: "This opening is no longer available.",
      });
    }
    if (!req.file)
      return res.status(422).json({
        success: false,
        message: "Resume is required.",
        errors: { resume: "Please upload your resume." },
      });
    const email = clean(req.body.email).toLowerCase();
    const phone = clean(req.body.phone).replace(/[\s()-]/g, "");
    const errors = {};
    for (const field of ["firstName", "lastName", "email", "phone", "location"])
      if (!clean(req.body[field])) errors[field] = `${field} is required`;
    if (email && !emailPattern.test(email))
      errors.email = "email must be valid";
    if (phone && !phonePattern.test(phone))
      errors.phone = "phone must be valid";
    if (opening.type === "experienced" && !clean(req.body.noticePeriod))
      errors.noticePeriod = "noticePeriod is required";
    if (Object.keys(errors).length) {
      await removeUpload(req.file);
      return res.status(422).json({
        success: false,
        message: "Please correct the highlighted fields.",
        errors,
      });
    }
    const application = await Application.create({
      opening: opening.id,
      openingTitle: opening.title,
      opportunityType: opening.type,
      firstName: clean(req.body.firstName),
      lastName: clean(req.body.lastName),
      email,
      phone,
      location: clean(req.body.location),
      currentCompany: clean(req.body.currentCompany),
      currentRole: clean(req.body.currentRole),
      experienceYears: Number(req.body.experienceYears) || 0,
      experienceMonths: Number(req.body.experienceMonths) || 0,
      noticePeriod: clean(req.body.noticePeriod),
      currentCtc: Number(req.body.currentCtc) || 0,
      expectedCtc: Number(req.body.expectedCtc) || 0,
      portfolioUrl: clean(req.body.portfolioUrl),
      linkedInUrl: clean(req.body.linkedInUrl),
      githubUrl: clean(req.body.githubUrl),
      coverLetter: clean(req.body.coverLetter),
      resume: {
        storedName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
    return res.status(201).json({
      success: true,
      message: "Your application has been submitted successfully.",
      data: { id: application.id, createdAt: application.createdAt },
    });
  } catch (error) {
    await removeUpload(req.file);
    return next(error);
  }
}

async function list(_req, res, next) {
  try {
    return res.json({
      success: true,
      data: await Application.find().sort({ createdAt: -1 }).lean(),
    });
  } catch (error) {
    return next(error);
  }
}
async function updateStatus(req, res, next) {
  try {
    if (
      !["new", "reviewing", "shortlisted", "rejected", "hired"].includes(
        req.body.status,
      )
    )
      return res
        .status(422)
        .json({ success: false, message: "Invalid application status." });
    const item = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Application not found." });
    return res.json({ success: true, data: item });
  } catch (error) {
    return next(error);
  }
}
async function downloadResume(req, res, next) {
  try {
    const item = await Application.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Application not found." });
    return res.download(
      path.join(uploadDirectory, path.basename(item.resume.storedName)),
      item.resume.originalName,
    );
  } catch (error) {
    return next(error);
  }
}
module.exports = { create, list, updateStatus, downloadResume };
