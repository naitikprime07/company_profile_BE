const crypto = require("crypto");
const path = require("path");
const { DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const PortfolioItem = require("../models/PortfolioItem");
const { createR2Client, getR2Config } = require("../config/r2");

const pick = (body) => ({
  title: body.title,
  type: body.type,
  category: body.category,
  excerpt: body.excerpt,
  image: body.image || "",
  detailImages: (body.detailImages || []).slice(0, 2),
  projectUrl: body.projectUrl || "",
  appLink: body.appLink || "",
  webLink: body.webLink || "",
  platforms: body.platforms || [],
  technologies: body.technologies || [],
  metric: body.metric || "",
  metricLabel: body.metricLabel || "",
  isPublished: body.isPublished,
  isFeatured: body.isFeatured,
  sortOrder: body.sortOrder,
});

const imageKey = (url) => {
  if (!url) return null;
  try {
    const expected = new URL(`${getR2Config().publicUrl}/`);
    const received = new URL(url);
    if (received.origin !== expected.origin || !received.pathname.startsWith(expected.pathname))
      return null;
    const key = decodeURIComponent(received.pathname.slice(expected.pathname.length));
    return key.startsWith("portfolio/") && !key.includes("..") ? key : null;
  } catch {
    return null;
  }
};

const removeImage = async (url) => {
  const Key = imageKey(url);
  if (!Key) return false;
  await createR2Client().send(new DeleteObjectCommand({ Bucket: getR2Config().bucket, Key }));
  return true;
};

const publicList = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const filter = { isPublished: true };
    if (req.query.type && req.query.type !== "all") filter.type = req.query.type;
    const [items, total] = await Promise.all([
      PortfolioItem.find(filter)
        .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PortfolioItem.countDocuments(filter),
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
      },
    });
  } catch (error) {
    next(error);
  }
};

const publicGetOne = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findOne({ _id: req.params.id, isPublished: true }).lean();
    if (!item)
      return res.status(404).json({ success: false, message: "Portfolio project not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const adminList = async (req, res, next) => {
  try {
    const { query, type, status, page, limit } = req.query;
    const filter = {};
    if (type !== "all") filter.type = type;
    if (status === "published") filter.isPublished = true;
    if (status === "draft") filter.isPublished = false;
    if (query) {
      const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["title", "category", "excerpt", "technologies"].map(
        (field) => ({ [field]: { $regex: safe, $options: "i" } }),
      );
    }
    const [items, total] = await Promise.all([
      PortfolioItem.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PortfolioItem.countDocuments(filter),
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
      },
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findById(req.params.id).lean();
    if (!item)
      return res.status(404).json({ success: false, message: "Portfolio item not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const item = await PortfolioItem.create(pick(req.body));
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const current = await PortfolioItem.findById(req.params.id);
    if (!current)
      return res.status(404).json({ success: false, message: "Portfolio item not found." });
    const oldImages = [current.image, ...(current.detailImages || [])];
    Object.assign(current, pick(req.body));
    await current.save();
    const nextKeys = new Set([current.image, ...(current.detailImages || [])].map(imageKey).filter(Boolean));
    await Promise.all(oldImages.filter((url) => {
      const key = imageKey(url);
      return key && !nextKeys.has(key);
    }).map(removeImage));
    const item = current;
    if (!item)
      return res.status(404).json({ success: false, message: "Portfolio item not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findByIdAndDelete(req.params.id);
    if (!item)
      return res.status(404).json({ success: false, message: "Portfolio item not found." });
    await Promise.all([item.image, ...(item.detailImages || [])].map(removeImage));
    res.json({ success: true, message: "Portfolio item deleted." });
  } catch (error) {
    next(error);
  }
};

const createImageUploadUrl = async (req, res, next) => {
  try {
    const extension = path.extname(req.body.fileName).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension))
      return res.status(422).json({ success: false, message: "Only JPG, PNG, and WEBP images are accepted." });
    const { bucket, publicUrl } = getR2Config();
    const previousKey = imageKey(req.body.previousImage);
    const key = previousKey || `portfolio/${crypto.randomUUID()}${extension}`;
    const uploadUrl = await getSignedUrl(
      createR2Client(),
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: req.body.contentType }),
      { expiresIn: 300 },
    );
    res.json({ success: true, data: { uploadUrl, fileUrl: `${publicUrl}/${key}?v=${crypto.randomUUID()}` } });
  } catch (error) {
    next(error);
  }
};

const removeStoredImage = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Portfolio item not found." });
    await removeImage(item.image);
    item.image = "";
    await item.save();
    res.json({ success: true, data: item, message: "Project image removed." });
  } catch (error) {
    next(error);
  }
};

const removeStoredImageField = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Portfolio item not found." });
    const field = req.params.field;
    let imageUrl = "";
    if (field === "poster") {
      imageUrl = item.image;
      item.image = "";
    } else {
      const index = Number(field.split("-")[1]);
      imageUrl = item.detailImages?.[index] || "";
      const images = [...(item.detailImages || [])];
      images[index] = "";
      item.detailImages = images;
    }
    await removeImage(imageUrl);
    await item.save();
    res.json({ success: true, data: item, message: "Project image removed." });
  } catch (error) {
    next(error);
  }
};

const removeUnattachedImage = async (req, res, next) => {
  try {
    if (!imageKey(req.body.imageUrl))
      return res.status(422).json({ success: false, message: "This is not a valid Portfolio R2 image URL." });
    await removeImage(req.body.imageUrl);
    res.json({ success: true, message: "Project image removed." });
  } catch (error) {
    next(error);
  }
};

module.exports = { publicList, publicGetOne, adminList, getOne, create, update, remove, createImageUploadUrl, removeStoredImage, removeStoredImageField, removeUnattachedImage };
