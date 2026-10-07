const router = require("express").Router();
const controller = require("../controllers/portfolioController");
const validate = require("../middlewares/validateRequest");
const schemas = require("../validators/joiSchemas");

router.get("/", validate({ query: schemas.publicPortfolioSearch }), controller.publicList);
router.get(
  "/:id",
  validate({ params: schemas.objectIdParams() }),
  controller.publicGetOne,
);

module.exports = router;
