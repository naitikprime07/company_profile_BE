const r = require("express").Router();

r.get("/", require("../controllers/homeStatController").publicList);

module.exports = r;
