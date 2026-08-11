const Opening = require("../models/Opening");
const pick = (b) => ({
  title: b.title,
  type: b.type,
  location: b.location,
  experience: b.experience,
  commitment: b.commitment,
  vacancies: Number(b.vacancies),
  description: b.description,
  roleOverview: b.roleOverview,
  keyRequirements: b.keyRequirements,
  isActive: b.isActive,
});

/////  public controllers
const publicList = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await Opening.find({
        isActive: true,
        type:
          req.query.type === ""
            ? { $in: ["internship", "experienced"] }
            : req.query.type,
      })
        .sort({ createdAt: -1 })
        .lean(),
    });
  } catch (e) {
    next(e);
  }
};

/////// admin controllers
const create = async (req, res, next) => {
  try {
    res
      .status(201)
      .json({ success: true, data: await Opening.create(pick(req.body)) });
  } catch (e) {
    next(e);
  }
};

const list = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await Opening.find().sort({ createdAt: -1 }).lean(),
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const { query, status, page, limit, fromDate, toDate } = req.query;
    const filter = {};
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    else if (["experienced", "internship"].includes(status))
      filter.type = status;
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
    }
    const words = String(query).split(/\s+/).filter(Boolean).slice(0, 10);
    if (words.length)
      filter.$and = words.map((word) => {
        const safe = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: [
            "title",
            "location",
            "experience",
            "commitment",
            "description",
          ].map((field) => ({ [field]: { $regex: safe, $options: "i" } })),
        };
      });
    const [items, total] = await Promise.all([
      Opening.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Opening.countDocuments(filter),
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
  } catch (e) {
    next(e);
  }
};

const getOne = async (req, res, next) => {
  try {
    const item = await Opening.findById(req.params.id).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Opening not found." });
    res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const updateddata = await Opening.findByIdAndUpdate(
      req.params.id,
      pick(req.body),
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updateddata)
      return res
        .status(404)
        .json({ success: false, message: "Opening not found." });
    res.json({ success: true, data: updateddata });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const x = await Opening.findByIdAndDelete(req.params.id);
    if (!x)
      return res
        .status(404)
        .json({ success: false, message: "Opening not found." });
    res.json({ success: true, message: "Opening deleted." });
  } catch (e) {
    next(e);
  }
};

module.exports = { publicList, list, search, getOne, create, update, remove };
