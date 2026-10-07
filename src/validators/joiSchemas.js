const Joi = require("joi");
const {
  BUDGET_OPTIONS,
  CONTACT_STATUSES,
  SERVICE_OPTIONS,
} = require("../constants/contactOptions");

const requiredString = (maximum) => Joi.string().trim().max(maximum).required();

const objectIdParams = (field = "id") =>
  Joi.object({
    [field]: Joi.string().hex().length(24).required(),
  });

const getOpeningTypeParams = (field = "type") =>
  Joi.object({
    [field]: Joi.string().valid("internship", "experienced", "").required(),
  });

const contact = Joi.object({
  name: requiredString(100).min(2),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  phone: Joi.string()
    .trim()
    .replace(/[\s()-]/g, "")
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .required(),
  company: Joi.string().trim().max(150).allow("").default(""),
  service: Joi.string()
    .trim()
    .valid(...SERVICE_OPTIONS)
    .required(),
  budget: Joi.string()
    .trim()
    .valid(...BUDGET_OPTIONS)
    .required(),
  message: requiredString(500).min(10),
}).messages({
  "any.required": "{#key} is required",
  "string.empty": "{#key} is required",
  "string.email": "email must be valid",
  "string.pattern.base": "phone must be valid",
  "any.only": "{#key} is not supported",
});

const adminCredentials = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().min(12).max(128).required(),
});

const login = adminCredentials.fork("password", (schema) => schema.min(1));

const opening = Joi.object({
  title: requiredString(120),
  type: Joi.string().valid("internship", "experienced").required(),
  location: requiredString(120),
  experience: requiredString(100),
  commitment: requiredString(100),
  vacancies: Joi.number().integer().min(1).max(500).required(),
  description: requiredString(1000),
  roleOverview: requiredString(3000),
  keyRequirements: requiredString(4000),
  isActive: Joi.boolean().default(true),
});

const contactStatus = Joi.object({
  status: Joi.string()
    .valid(...CONTACT_STATUSES)
    .required(),
});

const contactSearch = Joi.object({
  query: Joi.string().trim().max(150).allow("").default(""),
  status: Joi.string()
    .valid("all", ...CONTACT_STATUSES)
    .default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(5).max(50).default(10),
  dateRange: Joi.string().valid("all", "today", "7d", "30d").default("all"),
  fromDate: Joi.date().iso().allow("").default(""),
  toDate: Joi.date().iso().allow("").default(""),
}).custom((value, helpers) => {
  if (value.fromDate && value.toDate && value.toDate < value.fromDate)
    return helpers.message({ custom: "toDate must be on or after fromDate" });
  return value;
});

const applicationStatus = Joi.object({
  status: Joi.string()
    .valid("new", "reviewing", "shortlisted", "rejected", "hired")
    .required(),
});
const generalApplication = Joi.object({
  firstName: requiredString(60).min(2),
  lastName: requiredString(60).min(2),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .required(),
  location: requiredString(120),
  desiredRole: requiredString(120),
  skills: requiredString(1000).min(3),
  experience: Joi.string().trim().max(120).allow("").default(""),
  interests: requiredString(1000).min(3),
  message: requiredString(3000).min(20),
  portfolioUrl: Joi.string().trim().uri().max(500).allow("").default(""),
  linkedInUrl: Joi.string().trim().uri().max(500).allow("").default(""),
  githubUrl: Joi.string().trim().uri().max(500).allow("").default(""),
  resumeUrl: Joi.string().trim().uri().max(2048).required(),
});
const generalApplicationStatus = Joi.object({
  status: Joi.string()
    .valid("new", "reviewing", "contacted", "archived")
    .required(),
});
const paginatedSearch = (statuses) =>
  Joi.object({
    query: Joi.string().trim().max(150).allow("").default(""),
    status: Joi.string()
      .valid("all", ...statuses)
      .default("all"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(5).max(50).default(10),
    fromDate: Joi.date().iso().allow("").default(""),
    toDate: Joi.date().iso().allow("").default(""),
  }).custom((value, helpers) =>
    value.fromDate && value.toDate && value.toDate < value.fromDate
      ? helpers.message({ custom: "toDate must be on or after fromDate" })
      : value,
  );
const applicationSearch = paginatedSearch([
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "hired",
]);
const generalApplicationSearch = paginatedSearch([
  "new",
  "reviewing",
  "contacted",
  "archived",
]);
const openingSearch = paginatedSearch([
  "active",
  "inactive",
  "experienced",
  "internship",
]);

const resumeUpload = Joi.object({
  fileName: Joi.string().trim().max(255).required(),
  contentType: Joi.string()
    .valid(
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    .required(),
  size: Joi.number()
    .integer()
    .min(1)
    .max(5 * 1024 * 1024)
    .required(),
  previousImage: Joi.string().trim().uri().max(2048).allow("").default(""),
});

const employee = Joi.object({
  name: requiredString(100).min(2),
  role: requiredString(120).min(2),
  bio: requiredString(50),
  image: Joi.string().trim().uri().max(2048).allow("").default(""),
  children: Joi.array().items(Joi.link("#employee")).max(100).default([]),
}).id("employee");
const owner = Joi.object({
  name: requiredString(100).min(2),
  role: requiredString(120).min(2),
  image: Joi.string().trim().uri().max(2048).allow("").default(""),
});
const leadershipTeam = Joi.object({
  department: requiredString(120).min(2),
  summary: requiredString(120).min(2),
  owner: owner.required(),
  members: Joi.array().items(employee).max(100).default([]),
});
const teamImageUpload = Joi.object({
  fileName: Joi.string().trim().max(255).required(),
  contentType: Joi.string()
    .valid("image/jpeg", "image/png", "image/webp")
    .required(),
  size: Joi.number()
    .integer()
    .min(1)
    .max(5 * 1024 * 1024)
    .required(),
  previousImage: Joi.string().trim().uri().max(2048).allow("").default(""),
});
const imageDeleteBody = Joi.object({
  imageUrl: Joi.string().trim().uri().max(2048).required(),
});
const blogImageParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
  field: Joi.string().valid("cover", "author").required(),
});
const leadershipImageParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
  personId: Joi.alternatives()
    .try(
      Joi.string().valid("owner"),
      Joi.string().hex().length(24),
    )
    .required(),
});

const blog = Joi.object({
  title: requiredString(160).min(3),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(180)
    .required(),
  excerpt: requiredString(500).min(20),
  content: requiredString(1e9).min(50),
  coverImage: Joi.string().trim().uri().max(2048).allow("").default(""),
  author: requiredString(100).min(2),
  authorDetails: Joi.object({
    designation: Joi.string().trim().max(100).allow("").default(""),
    bio: Joi.string().trim().max(600).allow("").default(""),
    linkedin: Joi.string().trim().uri().max(2048).allow("").default(""),
    image: Joi.string().trim().uri().max(2048).allow("").default(""),
  }).default({}),
  category: requiredString(80).min(2),
  tags: Joi.array().items(Joi.string().trim().max(40)).max(10).default([]),
  isPublished: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false),
});
const blogSearch = Joi.object({
  query: Joi.string().trim().max(150).allow("").default(""),
  status: Joi.string().valid("all", "published", "draft").default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(8),
});
const publicBlogSearch = Joi.object({
  query: Joi.string().trim().max(150).allow("").default(""),
  all: Joi.boolean().default(false),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(24).default(9),
  category: Joi.string().trim().max(80).allow("").default(""),
});
const blogSlugParams = Joi.object({
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(180)
    .required(),
});

const portfolio = Joi.object({
  title: requiredString(120).min(2),
  type: Joi.string().valid("app", "web").required(),
  category: requiredString(80).min(2),
  excerpt: requiredString(300).min(10),
  image: Joi.string().trim().uri().max(2048).allow("").default(""),
  detailImages: Joi.array()
    .items(Joi.string().trim().uri().max(2048).allow(""))
    .max(2)
    .default([]),
  projectUrl: Joi.string().trim().uri().max(2048).allow("").default(""),
  appLink: Joi.string().trim().uri().max(2048).allow("").default(""),
  webLink: Joi.string().trim().uri().max(2048).allow("").default(""),
  platforms: Joi.array().items(Joi.string().trim().max(40)).max(10).default([]),
  technologies: Joi.array().items(Joi.string().trim().max(40)).max(15).default([]),
  metric: Joi.string().trim().max(30).allow("").default(""),
  metricLabel: Joi.string().trim().max(80).allow("").default(""),
  isPublished: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
});
const portfolioSearch = Joi.object({
  query: Joi.string().trim().max(150).allow("").default(""),
  type: Joi.string().valid("all", "app", "web").default("all"),
  status: Joi.string().valid("all", "published", "draft").default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
const portfolioImageParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
  field: Joi.string().valid("poster", "detail-0", "detail-1").required(),
});
const publicPortfolioSearch = Joi.object({
  type: Joi.string().valid("all", "app", "web").default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10).default(10),
});

const homeStat = Joi.object({
  value: Joi.number().integer().min(0).max(1000000000).required(),
  suffix: Joi.string().trim().max(8).allow("").default(""),
  label: requiredString(120).min(2),
  order: Joi.number().integer().min(0).max(9999).default(0),
  isActive: Joi.boolean().default(true),
});

module.exports = {
  adminCredentials,
  applicationStatus,
  applicationSearch,
  generalApplication,
  generalApplicationStatus,
  generalApplicationSearch,
  contact,
  contactSearch,
  contactStatus,
  login,
  objectIdParams,
  getOpeningTypeParams,
  opening,
  openingSearch,
  resumeUpload,
  leadershipTeam,
  teamImageUpload,
  imageDeleteBody,
  blogImageParams,
  leadershipImageParams,
  blog,
  blogSearch,
  publicBlogSearch,
  blogSlugParams,
  portfolio,
  portfolioSearch,
  publicPortfolioSearch,
  portfolioImageParams,
  homeStat,
};
