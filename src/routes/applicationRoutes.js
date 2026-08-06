const router = require("express").Router();
const { upload } = require("../config/resumeUpload");
const { create } = require("../controllers/applicationController");
router.post("/:openingId", upload.single("resume"), create);
module.exports = router;
