const router = require("express").Router();
const leadership = require("../controllers/leadershipController");
router.get("/", leadership.publicList);
module.exports = router;
