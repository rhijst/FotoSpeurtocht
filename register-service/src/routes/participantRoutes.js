const express = require("express");
const router = express.Router();
const controller = require("../controllers/participantController");
const upload = require("../config/multer");

router.post("/", controller.joinTarget);
router.get("/me", controller.getMyParticipants);
router.post("/submit", upload.single("image"), controller.submitTarget);

module.exports = router;