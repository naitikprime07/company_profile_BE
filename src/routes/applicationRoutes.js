const router = require("express").Router();
const { create, createResumeUploadUrl } = require("../controllers/applicationController");
const validate = require("../middlewares/validateRequest");
const { objectIdParams, resumeUpload } = require("../validators/joiSchemas");
const general = require("../controllers/generalApplicationController");
const schemas = require("../validators/joiSchemas");
router.post("/resume-upload-url", validate(resumeUpload), createResumeUploadUrl);
router.post("/general", validate(schemas.generalApplication), general.create);
router.post(
  "/:openingId",
  validate({ params: objectIdParams("openingId") }),
  create,
);
module.exports = router;
