const r = require("express").Router();
const { getOpeningTypeParams } = require("../validators/joiSchemas");
const validate = require("../middlewares/validateRequest");
const schemas = require("../validators/joiSchemas");

r.get(
  "/",
  validate({ query: schemas.getOpeningTypeParams() }),
  require("../controllers/openingController").publicList,
);

r.get(
  "/:id",
  validate({ params: schemas.objectIdParams() }),
  require("../controllers/openingController").getOne,
);

module.exports = r;
