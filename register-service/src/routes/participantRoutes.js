const express = require("express");
const router = express.Router();
const controller = require("../controllers/participantController");

router.post("/", controller.joinTarget);
router.get("/me", controller.getMyParticipants);

module.exports = router;