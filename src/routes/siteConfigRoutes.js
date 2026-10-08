const router = require("express").Router();
const { getSiteConfig } = require("../controllers/siteConfigController");

router.get("/", getSiteConfig);

module.exports = router;
