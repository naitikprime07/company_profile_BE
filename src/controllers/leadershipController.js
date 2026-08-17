const crypto = require("crypto");
const path = require("path");
const { DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const LeadershipTeam = require("../models/LeadershipTeam");
const { createR2Client, getR2Config } = require("../config/r2");

// const slugify = (value) =>
//   value
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "")
//     .slice(0, 52) || "department";

// const createSlug = async (department) => {
//   const base = slugify(department);
//   let slug = base;
//   let suffix = 2;
//   while (await LeadershipTeam.exists({ slug })) slug = `${base}-${suffix++}`;
//   return slug;
// };

const serialize = (item) => {
  const value = typeof item.toObject === "function" ? item.toObject() : item;
  return { ...value, _id: String(value._id), id: String(value._id) };
};

const imageKey = (url) => {
  if (!url) return null;
  try {
    const expected = new URL(`${getR2Config().publicUrl}/`);
    const received = new URL(url);
    if (
      received.origin !== expected.origin ||
      !received.pathname.startsWith(expected.pathname)
    )
      return null;
    const key = decodeURIComponent(
      received.pathname.slice(expected.pathname.length),
    );
    return key.startsWith("team/") && !key.includes("..") ? key : null;
  } catch {
    return null;
  }
};

const employeeImages = (members = []) =>
  members
    .flatMap((member) => [
      member.image,
      ...employeeImages(member.children || []),
    ])
    .filter(Boolean);

const imageUrls = (team) =>
  [team?.owner?.image, ...employeeImages(team?.members || [])].filter(Boolean);

const removeImages = async (urls) => {
  const keys = [...new Set(urls.map(imageKey).filter(Boolean))];
  if (!keys.length) return;
  const { bucket } = getR2Config();
  await Promise.all(
    keys.map((Key) =>
      createR2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key })),
    ),
  );
};

const publicList = async (req, res, next) => {
  try {
    const items = await LeadershipTeam.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: items.map(serialize) });
  } catch (error) {
    next(error);
  }
};

const adminList = async (req, res, next) => {
  try {
    const items = await LeadershipTeam.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: items.map(serialize) });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if ((await LeadershipTeam.countDocuments()) >= 2)
      return res.status(409).json({
        success: false,
        message: "Only two owner teams can be created.",
      });
    const position = await LeadershipTeam.countDocuments();
    const item = await LeadershipTeam.create({
      ...req.body,
      order: position,
      isActive: true,
    });
    res.status(201).json({ success: true, data: serialize(item) });
  } catch (error) {
    if (error?.code === 11000)
      return res
        .status(409)
        .json({ success: false, message: "This team slug already exists." });
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const previous = await LeadershipTeam.findById(req.params.id).lean();
    if (!previous)
      return res
        .status(404)
        .json({ success: false, message: "Leadership team not found." });
    const item = await LeadershipTeam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    const retained = new Set(imageUrls(req.body));
    await removeImages(imageUrls(previous).filter((url) => !retained.has(url)));
    res.json({ success: true, data: serialize(item) });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await LeadershipTeam.findByIdAndDelete(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Leadership team not found." });
    await removeImages(imageUrls(item));
    res.json({
      success: true,
      message: "Leadership team deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const createImageUploadUrl = async (req, res, next) => {
  try {
    const extension = path.extname(req.body.fileName).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension))
      return res.status(422).json({
        success: false,
        message: "Only JPG, PNG, and WEBP images are accepted.",
      });
    const { bucket, publicUrl } = getR2Config();
    const previousKey = imageKey(req.body.previousImage);
    const key = previousKey || `team/${crypto.randomUUID()}${extension}`;
    const uploadUrl = await getSignedUrl(
      createR2Client(),
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: req.body.contentType,
      }),
      { expiresIn: 300 },
    );
    res.json({
      success: true,
      data: {
        uploadUrl,
        fileUrl: `${publicUrl}/${key}?v=${crypto.randomUUID()}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  createImageUploadUrl,
  remove,
  update,
  publicList,
  adminList,
};
