const bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  Admin = require("../models/Admin"),
  Contact = require("../models/Contact"),
  Application = require("../models/Application"),
  GeneralApplication = require("../models/GeneralApplication"),
  Opening = require("../models/Opening");

const serializeContact = (contact) => {
  const value =
    typeof contact.toObject === "function" ? contact.toObject() : contact;
  const id = String(value._id || value.id);
  return { ...value, _id: id, id };
};

///// admin creation and login
const createAdmin = async (req, res, next) => {
  try {
    if (
      !process.env.ADMIN_SETUP_KEY ||
      req.headers["x-admin-setup-key"] !== process.env.ADMIN_SETUP_KEY
    )
      return res
        .status(403)
        .json({ success: false, message: "Invalid admin setup key." });
    const email = String(req.body.email || "")
        .trim()
        .toLowerCase(),
      password = String(req.body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res
        .status(422)
        .json({ success: false, message: "A valid email is required." });
    if (password.length < 12)
      return res.status(422).json({
        success: false,
        message: "Password must be at least 12 characters.",
      });
    if (await Admin.exists({ email }))
      return res.status(409).json({
        success: false,
        message: "An admin with this email already exists.",
      });
    const admin = await Admin.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    return res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      data: { id: admin.id, email: admin.email },
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
        .trim()
        .toLowerCase(),
      admin = await Admin.findOne({ email });
    if (
      !admin ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        admin.passwordHash,
      ))
    )
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    return res.json({
      success: true,
      data: {
        token: jwt.sign({ sub: admin.id, email }, process.env.JWT_SECRET, {
          expiresIn: "8h",
        }),
        admin: { email },
      },
    });
  } catch (e) {
    next(e);
  }
};

////// admin dashboard and contact management
const dashboard = async (req, res, next) => {
  try {
    const [
      totalInquiries,
      newInquiries,
      activeInquiries,
      totalApplications,
      newApplications,
      reviewedApplications,
      newIntroductions,
      applicationPipeline,
      openingVacancies,
      recentContacts,
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: "new" }),
      Contact.countDocuments({ status: "in_progress" }),
      Application.countDocuments(),
      Application.countDocuments({ status: "new" }),
      Application.countDocuments({ status: { $ne: "new" } }),
      GeneralApplication.countDocuments({ status: "new" }),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Opening.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$vacancies", 1] } },
          },
        },
      ]),
      Contact.find().sort({ createdAt: -1 }).limit(4).lean(),
    ]);
    const pipeline = Object.fromEntries(
      applicationPipeline.map(({ _id, count }) => [_id, count]),
    );
    res.json({
      success: true,
      data: {
        counts: {
          totalInquiries,
          newInquiries,
          activeInquiries,
          totalApplications,
          newApplications,
          reviewedApplications,
          newIntroductions,
          openVacancies: openingVacancies[0]?.total || 0,
        },
        applicationPipeline: pipeline,
        recentContacts: recentContacts.map(serializeContact),
      },
    });
  } catch (e) {
    next(e);
  }
};

const sidebarCounts = async (req, res, next) => {
  try {
    const [newInquiries, newApplications, newIntroductions] =
      await Promise.all([
        Contact.countDocuments({ status: "new" }),
        Application.countDocuments({ status: "new" }),
        GeneralApplication.countDocuments({ status: "new" }),
      ]);

    res.json({
      success: true,
      data: {
        inquiries: newInquiries,
        applications: newApplications,
        introductions: newIntroductions,
      },
    });
  } catch (e) {
    next(e);
  }
};

////// contact management
const contacts = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: (await Contact.find().sort({ createdAt: -1 }).lean()).map(
        serializeContact,
      ),
    });
  } catch (e) {
    next(e);
  }
};

const searchContacts = async (req, res, next) => {
  try {
    const { query, status, page, limit, dateRange, fromDate, toDate } =
      req.query;
    const filter = status === "all" ? {} : { status };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setUTCHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    } else if (dateRange !== "all") {
      const since = new Date();
      if (dateRange === "today") since.setHours(0, 0, 0, 0);
      else since.setDate(since.getDate() - Number.parseInt(dateRange, 10));
      filter.createdAt = { $gte: since };
    }
    const words = query.split(/\s+/).filter(Boolean).slice(0, 10);
    if (words.length) {
      const fields = [
        "name",
        "email",
        "company",
        "phone",
        // "service",
        // "budget",
        // "message",
      ];
      filter.$and = words.map((word) => {
        const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: fields.map((field) => ({
            [field]: { $regex: safeWord, $options: "i" },
          })),
        };
      });
    }

    const countFilter = { ...filter };
    delete countFilter.status;

    const [items, total, statusTotals] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
      Contact.aggregate([
        { $match: countFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      success: true,
      data: {
        items: items.map(serializeContact),
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

const getContact = async (req, res, next) => {
  try {
    const item = await Contact.findById(req.params.id).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Inquiry not found." });
    res.json({ success: true, data: serializeContact(item) });
  } catch (e) {
    next(e);
  }
};

const updateContact = async (req, res, next) => {
  try {
    if (!["new", "in_progress", "resolved"].includes(req.body.status))
      return res
        .status(422)
        .json({ success: false, message: "Invalid status." });
    const item = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Inquiry not found." });
    res.json({ success: true, data: serializeContact(item) });
  } catch (e) {
    next(e);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const item = await Contact.findByIdAndDelete(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Inquiry not found." });
    res.json({ success: true, message: "Inquiry deleted successfully." });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createAdmin,
  login,
  dashboard,
  sidebarCounts,
  contacts,
  getContact,
  searchContacts,
  updateContact,
  deleteContact,
};
