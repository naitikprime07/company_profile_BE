const crypto = require("crypto");
const path = require("path");
const { DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Application = require("../models/Application");
const Opening = require("../models/Opening");
const { createR2Client, getR2Config } = require("../config/r2");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;
const clean = (value) => (typeof value === "string" ? value.trim() : "");

const isConfiguredResumeUrl = (value) => {
  try {
    const { publicUrl } = getR2Config();
    const expected = new URL(`${publicUrl}/`);
    const received = new URL(value);
    return (
      received.origin === expected.origin &&
      received.pathname.startsWith(`${expected.pathname}resumes/`)
    );
  } catch {
    return false;
  }
};

const getResumeObjectKey = (value) => {
  try {
    const { publicUrl } = getR2Config();
    const expected = new URL(`${publicUrl}/`);
    const received = new URL(value);
    if (
      received.origin !== expected.origin ||
      !received.pathname.startsWith(expected.pathname)
    )
      return null;
    const key = decodeURIComponent(
      received.pathname.slice(expected.pathname.length),
    );
    return key.startsWith("resumes/") && !key.includes("..") ? key : null;
  } catch {
    return null;
  }
};

///// public controllers
const createResumeUploadUrl = async (req, res, next) => {
  try {
    const { bucket, publicUrl } = getR2Config();
    const extension = path.extname(req.body.fileName).toLowerCase();
    const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

    if (!allowedExtensions.has(extension)) {
      return res.status(422).json({
        success: false,
        message: "Only PDF, DOC, and DOCX resumes are accepted.",
        errors: { fileName: "Resume file extension is not supported" },
      });
    }

    const key = `resumes/${crypto.randomUUID()}${extension}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: req.body.contentType,
    });
    const uploadUrl = await getSignedUrl(createR2Client(), command, {
      expiresIn: 300,
    });

    return res.json({
      success: true,
      data: { uploadUrl, fileUrl: `${publicUrl}/${key}` },
    });
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const opening = await Opening.findOne({
      _id: req.params.openingId,
      isActive: true,
    });
    if (!opening) {
      return res.status(404).json({
        success: false,
        message: "This opening is no longer available.",
      });
    }
    const email = clean(req.body.email).toLowerCase();
    const phone = clean(req.body.phone).replace(/[\s()-]/g, "");
    const errors = {};
    for (const field of ["firstName", "lastName", "email", "phone", "location"])
      if (!clean(req.body[field])) errors[field] = `${field} is required`;
    if (email && !emailPattern.test(email))
      errors.email = "email must be valid";
    if (phone && !phonePattern.test(phone))
      errors.phone = "phone must be valid";
    if (!isConfiguredResumeUrl(req.body.resumeUrl))
      errors.resumeUrl = "A valid uploaded resume is required";
    if (opening.type === "experienced" && !clean(req.body.noticePeriod))
      errors.noticePeriod = "noticePeriod is required";
    if (Object.keys(errors).length) {
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
      resumeUrl: clean(req.body.resumeUrl),
    });
    return res.status(201).json({
      success: true,
      message: "Your application has been submitted successfully.",
      data: { id: application.id, createdAt: application.createdAt },
    });
  } catch (error) {
    return next(error);
  }
};

////// admin controllers
const list = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await Application.find().sort({ createdAt: -1 }).lean(),
    });
  } catch (error) {
    return next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const { query, status, page, limit, fromDate, toDate } = req.query,
      filter = status === "all" ? {} : { status };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const d = new Date(fromDate);
        d.setUTCHours(0, 0, 0, 0);
        filter.createdAt.$gte = d;
      }
      if (toDate) {
        const d = new Date(toDate);
        d.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = d;
      }
    }
    const words = String(query).split(/\s+/).filter(Boolean),
      fields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "location",
        "openingTitle",
        "currentRole",
      ];
    if (words.length)
      filter.$and = words.map((word) => {
        const safe = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: fields.map((field) => ({
            [field]: { $regex: safe, $options: "i" },
          })),
        };
      });

    const [items, total, statusTotals] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Application.countDocuments(filter),
      Application.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        statusCounts: Object.fromEntries(
          statusTotals.map(({ _id, count }) => [_id, count]),
        ),
      },
    });
  } catch (e) {
    next(e);
  }
};

const getOne = async (req, res, next) => {
  try {
    const item = await Application.findById(req.params.id).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Application not found." });
    return res.json({ success: true, data: item });
  } catch (error) {
    return next(error);
  }
};

const updateStatus = async (req, res, next) => {
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
};

const remove = async (req, res, next) => {
  try {
    const item = await Application.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Application not found." });

    const resumeKey = getResumeObjectKey(item.resumeUrl);
    if (resumeKey) {
      const { bucket } = getR2Config();
      await createR2Client().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: resumeKey }),
      );
    }

    await Application.deleteOne({ _id: item._id });
    return res.json({
      success: true,
      message: "Application and resume deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  create,
  createResumeUploadUrl,
  getOne,
  list,
  remove,
  search,
  updateStatus,
};
