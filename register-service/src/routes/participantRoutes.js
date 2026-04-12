const express = require("express");
const router = express.Router();
const controller = require("../controllers/participantController");
const upload = require("../config/multer");

router.post("/", controller.joinTarget);
router.get("/me", controller.getMyParticipants);
router.post("/submit", upload.single("image"), controller.submitTarget);
router.get("/submissions/me", controller.getMySubmissions);
router.get("/submissions/on-my-targets", controller.getSubmissionsOnMyTargets);
router.delete("/submissions/:id", controller.deleteSubmission);
router.patch("/submissions/:id/remove-photo", controller.removePhoto);

module.exports = router;