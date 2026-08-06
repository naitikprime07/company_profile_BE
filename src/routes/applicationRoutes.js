const router = require("express").Router();
const { create } = require("../controllers/applicationController");
const validate = require("../middlewares/validateRequest");
const { objectIdParams } = require("../validators/joiSchemas");
router.post(
  "/:openingId",
  validate({ params: objectIdParams("openingId") }),
  create,
);
module.exports = router;
