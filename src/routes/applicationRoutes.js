const router = require("express").Router();
const {
  create,
  createResumeUploadUrl,
} = require("../controllers/applicationController");
const validate = require("../middlewares/validateRequest");
const {
  objectIdParams,
  resumeUpload,
  generalApplication,
} = require("../validators/joiSchemas");
const general = require("../controllers/generalApplicationController");

//// resume upload url and application creation
router.post(
  "/resume-upload-url",
  validate(resumeUpload),
  createResumeUploadUrl,
);

////// general application creation
router.post("/general", validate(generalApplication), general.create);

///// opening-specific application creation
// Dynamic parameter routes must remain after static routes such as /general.
router.post(
  "/:openingId",
  validate({ params: objectIdParams("openingId") }),
  create,
);

module.exports = router;
