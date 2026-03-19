const multer = require("multer");
const path = require("path");

// maak het pad absoluut, binnen de container
const uploadPath = path.join(__dirname, "../uploads"); // ../ omdat dit vaak in /app/config staat

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // absoluut pad naar uploads volume
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;