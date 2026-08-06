const r = require("express").Router(),
  auth = require("../middlewares/authenticateAdmin"),
  a = require("../controllers/adminController"),
  o = require("../controllers/openingController");
const applications = require("../controllers/applicationController");
const validate = require("../middlewares/validateRequest");
const schemas = require("../validators/joiSchemas");
r.post("/create", validate(schemas.adminCredentials), a.createAdmin);
r.post("/login", validate(schemas.login), a.login);
r.use(auth);
r.get("/contacts", a.contacts);
r.patch(
  "/contacts/:id",
  validate({ params: schemas.objectIdParams(), body: schemas.contactStatus }),
  a.updateContact,
);
r.get("/applications", applications.list);
r.patch(
  "/applications/:id",
  validate({
    params: schemas.objectIdParams(),
    body: schemas.applicationStatus,
  }),
  applications.updateStatus,
);
r.get("/openings", o.list);
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
