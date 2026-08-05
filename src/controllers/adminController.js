const bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  Admin = require("../models/Admin"),
  Contact = require("../models/Contact");
async function createAdmin(req, res, next) {
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
      return res
        .status(422)
        .json({
          success: false,
          message: "Password must be at least 12 characters.",
        });
    if (await Admin.exists({ email }))
      return res
        .status(409)
        .json({
          success: false,
          message: "An admin with this email already exists.",
        });
    const admin = await Admin.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Admin created successfully.",
        data: { id: admin.id, email: admin.email },
      });
  } catch (e) {
    next(e);
  }
}
async function login(req, res, next) {
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
}
async function contacts(_req, res, next) {
  try {
    res.json({
      success: true,
      data: await Contact.find().sort({ createdAt: -1 }).lean(),
    });
  } catch (e) {
    next(e);
  }
}
async function updateContact(req, res, next) {
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
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
}
module.exports = { createAdmin, login, contacts, updateContact };
