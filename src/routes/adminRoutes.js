const r = require("express").Router(),
  auth = require("../middlewares/authenticateAdmin"),
  a = require("../controllers/adminController"),
  o = require("../controllers/openingController");
const applications = require("../controllers/applicationController");
const generalApplications = require("../controllers/generalApplicationController");
const validate = require("../middlewares/validateRequest");
const schemas = require("../validators/joiSchemas");

r.post("/create", validate(schemas.adminCredentials), a.createAdmin);
r.post("/login", validate(schemas.login), a.login);
r.use(auth);
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
r.get("/applications", applications.list);
r.get(
  "/applications/search",
  validate({ query: schemas.applicationSearch }),
  applications.search,
);
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
r.get("/openings", o.list);
r.get(
  "/openings/:id",
  validate({ params: schemas.objectIdParams() }),
  o.getOne,
);
r.post("/openings", validate(schemas.opening), o.create);
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
module.exports = r;
