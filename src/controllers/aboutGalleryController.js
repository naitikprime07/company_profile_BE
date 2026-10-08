const crypto = require("crypto");
const path = require("path");
const { DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const AboutGalleryImage = require("../models/AboutGalleryImage");
const { createR2Client, getR2Config } = require("../config/r2");

const serialize = (item) => {
  const value = typeof item.toObject === "function" ? item.toObject() : item;
  return { ...value, _id: String(value._id), id: String(value._id) };
};

// Only keys under the about-gallery/ prefix belong to this feature, so
// admin-supplied URLs can never delete objects outside the gallery.
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
    return key.startsWith("about-gallery/") && !key.includes("..")
      ? key
      : null;
  } catch {
    return null;
  }
};

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

const pick = (body) => ({
  image: body.image,
  alt: body.alt,
  order: Number(body.order) || 0,
  isActive: body.isActive,
});

//// public controller (active images only, ordered)
const publicList = async (_req, res, next) => {
  try {
    const items = await AboutGalleryImage.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: items.map(serialize) });
  } catch (error) {
    next(error);
  }
};

////// admin controllers
const adminList = async (_req, res, next) => {
  try {
    const items = await AboutGalleryImage.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: items.map(serialize) });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const position = await AboutGalleryImage.countDocuments();
    const item = await AboutGalleryImage.create({
      ...pick(req.body),
      order: pick(req.body).order || position,
    });
    res.status(201).json({ success: true, data: serialize(item) });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const previous = await AboutGalleryImage.findById(req.params.id).lean();
    if (!previous)
      return res
        .status(404)
        .json({ success: false, message: "Gallery image not found." });
    const item = await AboutGalleryImage.findByIdAndUpdate(
      req.params.id,
      pick(req.body),
      { new: true, runValidators: true },
    );
    if (previous.image && previous.image !== item.image)
      await removeImages([previous.image]);
    res.json({ success: true, data: serialize(item) });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await AboutGalleryImage.findByIdAndDelete(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Gallery image not found." });
    await removeImages([item.image]);
    res.json({
      success: true,
      message: "Gallery image deleted successfully.",
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
        message: "This is not a valid Company Images R2 image URL.",
      });
    await removeImages([req.body.imageUrl]);
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
    const key = previousKey || `about-gallery/${crypto.randomUUID()}${extension}`;
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
  adminList,
  create,
  createImageUploadUrl,
  publicList,
  remove,
  removeUnattachedImage,
  update,
};
