const router = require("express").Router();
const gallery = require("../controllers/aboutGalleryController");
router.get("/", gallery.publicList);
module.exports = router;
