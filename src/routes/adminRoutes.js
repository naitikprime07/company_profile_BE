const r = require("express").Router(),
  rateLimit = require("express-rate-limit"),
  auth = require("../middlewares/authenticateAdmin"),
  a = require("../controllers/adminController"),
  o = require("../controllers/openingController");
const applications = require("../controllers/applicationController");
const generalApplications = require("../controllers/generalApplicationController");
const validate = require("../middlewares/validateRequest");
const schemas = require("../validators/joiSchemas");
const leadership = require("../controllers/leadershipController");
const blogs = require("../controllers/blogController");
const portfolio = require("../controllers/portfolioController");
const homeStats = require("../controllers/homeStatController");
const aboutGallery = require("../controllers/aboutGalleryController");

// Brute-force protection for the two public (pre-auth) admin endpoints.
// Only failed attempts are counted, so a real admin is never locked out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many admin creation attempts. Please try again later.",
  },
});

//// admin creation and login
r.post("/create", createLimiter, validate(schemas.adminCredentials), a.createAdmin);
r.post("/login", loginLimiter, validate(schemas.login), a.login);
r.use(auth);

//// dashboard
r.get("/dashboard", a.dashboard);
r.get("/sidebar-counts", a.sidebarCounts);

//// leadership hierarchy
r.post(
  "/leadership/image-upload-url",
  validate(schemas.teamImageUpload),
  leadership.createImageUploadUrl,
);
r.delete(
  "/leadership/image",
  validate({ body: schemas.imageDeleteBody }),
  leadership.removeUnattachedImage,
);
r.delete(
  "/leadership/:id/images/:personId",
  validate({ params: schemas.leadershipImageParams }),
  leadership.removeStoredImage,
);
r.post("/leadership", validate(schemas.leadershipTeam), leadership.create);
r.get("/leadership", leadership.adminList);
r.put(
  "/leadership/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.leadershipTeam }),
  leadership.update,
);
r.delete(
  "/leadership/:id",
  validate({ params: schemas.objectIdParams() }),
  leadership.remove,
);

//// contacts
r.get("/contacts", a.contacts);
r.get(
  "/contacts/search",
  validate({ query: schemas.contactSearch }),
  a.searchContacts,
);
r.get(
  "/contacts/:id",
  validate({ params: schemas.objectIdParams() }),
  a.getContact,
);
r.patch(
  "/contacts/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.contactStatus }),
  a.updateContact,
);
r.delete(
  "/contacts/:id",
  validate({ params: schemas.objectIdParams() }),
  a.deleteContact,
);

///// applications
r.get("/applications", applications.list);
r.get(
  "/applications/search",
  validate({ query: schemas.applicationSearch }),
  applications.search,
);
r.get(
  "/applications/:id",
  validate({ params: schemas.objectIdParams() }),
  applications.getOne,
);
r.patch(
  "/applications/:id",
  validate({
    params: schemas.objectIdParams(),
    body: schemas.applicationStatus,
  }),
  applications.updateStatus,
);
r.delete(
  "/applications/:id",
  validate({ params: schemas.objectIdParams() }),
  applications.remove,
);

////// general applications or applications without opening
r.get("/general-applications", generalApplications.list);
r.get(
  "/general-applications/search",
  validate({ query: schemas.generalApplicationSearch }),
  generalApplications.search,
);
r.get(
  "/general-applications/:id",
  validate({ params: schemas.objectIdParams() }),
  generalApplications.getOne,
);
r.patch(
  "/general-applications/:id",
  validate({
    params: schemas.objectIdParams(),
    body: schemas.generalApplicationStatus,
  }),
  generalApplications.updateStatus,
);
r.delete(
  "/general-applications/:id",
  validate({ params: schemas.objectIdParams() }),
  generalApplications.remove,
);

///// openings
r.post("/openings", validate(schemas.opening), o.create);
r.get("/openings", o.list);
r.get("/openings/search", validate({ query: schemas.openingSearch }), o.search);
r.get(
  "/openings/:id",
  validate({ params: schemas.objectIdParams() }),
  o.getOne,
);
r.put(
  "/openings/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.opening }),
  o.update,
);
r.delete(
  "/openings/:id",
  validate({ params: schemas.objectIdParams() }),
  o.remove,
);

///// blogs
r.get("/blogs", validate({ query: schemas.blogSearch }), blogs.adminList);
r.post(
  "/blogs/image-upload-url",
  validate(schemas.teamImageUpload),
  blogs.createImageUploadUrl,
);
r.delete(
  "/blogs/image",
  validate({ body: schemas.imageDeleteBody }),
  blogs.removeUnattachedImage,
);
r.delete(
  "/blogs/:id/images/:field",
  validate({ params: schemas.blogImageParams }),
  blogs.removeStoredImage,
);
r.post("/blogs", validate(schemas.blog), blogs.create);
r.get(
  "/blogs/:id",
  validate({ params: schemas.objectIdParams() }),
  blogs.getOne,
);
r.put(
  "/blogs/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.blog }),
  blogs.update,
);
r.delete(
  "/blogs/:id",
  validate({ params: schemas.objectIdParams() }),
  blogs.remove,
);

///// portfolio
r.get("/portfolio", validate({ query: schemas.portfolioSearch }), portfolio.adminList);
r.post(
  "/portfolio/image-upload-url",
  validate(schemas.teamImageUpload),
  portfolio.createImageUploadUrl,
);
r.delete(
  "/portfolio/image",
  validate({ body: schemas.imageDeleteBody }),
  portfolio.removeUnattachedImage,
);
r.delete(
  "/portfolio/:id/image",
  validate({ params: schemas.objectIdParams() }),
  portfolio.removeStoredImage,
);
r.delete(
  "/portfolio/:id/images/:field",
  validate({ params: schemas.portfolioImageParams }),
  portfolio.removeStoredImageField,
);
r.post("/portfolio", validate(schemas.portfolio), portfolio.create);
r.get(
  "/portfolio/:id",
  validate({ params: schemas.objectIdParams() }),
  portfolio.getOne,
);
r.put(
  "/portfolio/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.portfolio }),
  portfolio.update,
);
r.delete(
  "/portfolio/:id",
  validate({ params: schemas.objectIdParams() }),
  portfolio.remove,
);

///// home stats (public homepage counters)
r.get("/home-stats", homeStats.list);
r.post("/home-stats", validate(schemas.homeStat), homeStats.create);
r.put(
  "/home-stats/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.homeStat }),
  homeStats.update,
);
r.delete(
  "/home-stats/:id",
  validate({ params: schemas.objectIdParams() }),
  homeStats.remove,
);

//// about page company images
r.post(
  "/about-gallery/image-upload-url",
  validate(schemas.teamImageUpload),
  aboutGallery.createImageUploadUrl,
);
r.delete(
  "/about-gallery/image",
  validate({ body: schemas.imageDeleteBody }),
  aboutGallery.removeUnattachedImage,
);
r.get("/about-gallery", aboutGallery.adminList);
r.post(
  "/about-gallery",
  validate({ body: schemas.aboutGalleryImage }),
  aboutGallery.create,
);
r.put(
  "/about-gallery/:id",
  validate({
    params: schemas.objectIdParams(),
    body: schemas.aboutGalleryImage,
  }),
  aboutGallery.update,
);
r.delete(
  "/about-gallery/:id",
  validate({ params: schemas.objectIdParams() }),
  aboutGallery.remove,
);

module.exports = r;
