const r = require("express").Router(),
  auth = require("../middlewares/authenticateAdmin"),
  a = require("../controllers/adminController"),
  o = require("../controllers/openingController");
const applications = require("../controllers/applicationController");
r.post("/create", a.createAdmin);
r.post("/login", a.login);
r.use(auth);
r.get("/contacts", a.contacts);
r.patch("/contacts/:id", a.updateContact);
r.get("/applications", applications.list);
r.patch("/applications/:id", applications.updateStatus);
r.get("/applications/:id/resume", applications.downloadResume);
r.get("/openings", o.list);
r.post("/openings", o.create);
r.put("/openings/:id", o.update);
r.delete("/openings/:id", o.remove);
module.exports = r;
