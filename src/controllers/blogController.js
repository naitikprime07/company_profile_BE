const crypto = require("crypto");
const path = require("path");
const { DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Blog = require("../models/Blog");
const { createR2Client, getR2Config } = require("../config/r2");

const ALLOWED_CONTENT_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "small",
  "big",
  "font",
  "h2",
  "h3",
  "blockquote",
  "ul",
  "ol",
  "li",
]);
const sanitizeContent = (value = "") =>
  String(value)
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, name) => {
      const normalized = name.toLowerCase();
      if (!ALLOWED_CONTENT_TAGS.has(normalized)) return "";
      const closing = /^<\s*\//.test(tag);
      if (normalized === "font") {
        if (closing) return "</font>";
        const size = tag.match(
          /\bdata-font-size\s*=\s*["']?(12|14|16|18|20|24|28|32)/i,
        )?.[1];
        return `<font data-font-size="${size || "16"}">`;
      }
      return normalized === "br"
        ? "<br>"
        : "<" + (closing ? "/" : "") + normalized + ">";
    })
    .trim();

const sanitizePublicItem = (item) => ({
  ...item,
  content: sanitizeContent(item.content),
});

const pick = (body) => ({
  title: body.title,
  slug: body.slug,
  excerpt: body.excerpt,
  content: sanitizeContent(body.content),
  coverImage: body.coverImage || "",
  author: body.author,
  authorDetails: body.authorDetails || {},
  category: body.category,
  tags: body.tags || [],
  isPublished: body.isPublished,
  isFeatured: body.isFeatured,
});

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
    return key.startsWith("blogs/") && !key.includes("..") ? key : null;
  } catch {
    return null;
  }
};

const removeImage = async (url) => {
  const Key = imageKey(url);
  if (!Key) return false;
  await createR2Client().send(
    new DeleteObjectCommand({ Bucket: getR2Config().bucket, Key }),
  );
  return true;
};

const withPublishDate = (values, previous = null) => ({
  ...values,
  publishedAt: values.isPublished ? previous?.publishedAt || new Date() : null,
});

////// public controllers
const publicList = async (req, res, next) => {
  try {
    const { page, limit, category, query, all } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (query) {
      const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["title", "excerpt", "author", "category", "tags"].map(
        (field) => ({ [field]: { $regex: safe, $options: "i" } }),
      );
    }
    const [items, total, categories] = await Promise.all([
      Blog.find(filter)
        .sort({ isFeatured: -1, publishedAt: -1 })
        .skip(all ? 0 : (page - 1) * limit)
        .limit(all ? 0 : limit)
        .lean(),
      Blog.countDocuments(filter),
      Blog.distinct("category", { isPublished: true }),
    ]);
    res.json({
      success: true,
      data: {
        items: items.map(sanitizePublicItem),
        categories: categories
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
        pagination: {
          page: all ? 1 : page,
          limit: all ? total : limit,
          total,
          totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const publicGetOne = async (req, res, next) => {
  try {
    const item = await Blog.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found." });
    res.json({ success: true, data: sanitizePublicItem(item) });
  } catch (error) {
    next(error);
  }
};

///// admin-only controllers

const create = async (req, res, next) => {
  try {
    const item = await Blog.create(withPublishDate(pick(req.body)));
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const adminList = async (req, res, next) => {
  try {
    const { query, status, page, limit } = req.query;
    const filter = {};
    if (status === "published") filter.isPublished = true;
    if (status === "draft") filter.isPublished = false;
    if (query) {
      const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["title", "author", "category", "excerpt"].map((field) => ({
        [field]: { $regex: safe, $options: "i" },
      }));
    }
    const [items, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
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
    const item = await Blog.findById(req.params.id).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const current = await Blog.findById(req.params.id);
    if (!current)
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found." });
    const values = withPublishDate(pick(req.body), current);
    const oldImage = current.coverImage;
    const oldAuthorImage = current.authorDetails?.image;
    Object.assign(current, values);
    await current.save();
    if (oldImage && imageKey(oldImage) !== imageKey(current.coverImage))
      await removeImage(oldImage);
    if (
      oldAuthorImage &&
      imageKey(oldAuthorImage) !== imageKey(current.authorDetails?.image)
    )
      await removeImage(oldAuthorImage);
    res.json({ success: true, data: current });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await Blog.findByIdAndDelete(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found." });
    await removeImage(item.coverImage);
    await removeImage(item.authorDetails?.image);
    res.json({ success: true, message: "Blog post deleted." });
  } catch (error) {
    next(error);
  }
};

const removeStoredImage = async (req, res, next) => {
  try {
    const item = await Blog.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found." });

    const isCover = req.params.field === "cover";
    const imageUrl = isCover ? item.coverImage : item.authorDetails?.image;
    if (!imageUrl)
      return res.json({
        success: true,
        data: item,
        message: "Image is already removed.",
      });

    await removeImage(imageUrl);
    if (isCover) item.coverImage = "";
    else item.authorDetails.image = "";
    await item.save();

    res.json({
      success: true,
      data: item,
      message: isCover
        ? "Cover image removed successfully."
        : "Author image removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const removeUnattachedImage = async (req, res, next) => {
  try {
    if (!imageKey(req.body.imageUrl))
      return res.status(422).json({
        success: false,
        message: "This is not a valid Blog R2 image URL.",
      });
    await removeImage(req.body.imageUrl);
    res.json({ success: true, message: "Image removed successfully." });
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
    const key = previousKey || `blogs/${crypto.randomUUID()}${extension}`;
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
  publicList,
  publicGetOne,
  adminList,
  getOne,
  create,
  update,
  remove,
  removeStoredImage,
  removeUnattachedImage,
  createImageUploadUrl,
};
