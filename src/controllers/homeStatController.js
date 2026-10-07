const HomeStat = require("../models/HomeStat");
const pick = (b) => ({
  value: Number(b.value),
  suffix: b.suffix,
  label: b.label,
  order: Number(b.order),
  isActive: b.isActive,
});

///// public controller (active stats, ordered)
const publicList = async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: await HomeStat.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .lean(),
    });
  } catch (e) {
    next(e);
  }
};

/////// admin controllers
const list = async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: await HomeStat.find().sort({ order: 1, createdAt: 1 }).lean(),
    });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    res
      .status(201)
      .json({ success: true, data: await HomeStat.create(pick(req.body)) });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const updated = await HomeStat.findByIdAndUpdate(req.params.id, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Home stat not found." });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await HomeStat.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Home stat not found." });
    res.json({ success: true, message: "Home stat deleted." });
  } catch (e) {
    next(e);
  }
};

module.exports = { publicList, list, create, update, remove };
