const router = require("express").Router();
const controller = require("../controllers/blogController");
const validate = require("../middlewares/validateRequest");
const schemas = require("../validators/joiSchemas");

router.get("/", validate({ query: schemas.publicBlogSearch }), controller.publicList);
router.get("/:slug", validate({ params: schemas.blogSlugParams }), controller.publicGetOne);

module.exports = router;
