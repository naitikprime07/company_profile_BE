const r = require("express").Router();
r.get("/", require("../controllers/openingController").publicList);
module.exports = r;
