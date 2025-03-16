const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Ensure it uses the right path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current time as filename
  }
});

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  fileFilter: function (req, file, cb) {
    console.log("📂 File upload attempt:", file);
    const filetypes = /jpeg|jpg|png|gif|avif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      console.error("❌ Invalid file type:", file.mimetype);
      cb("Error: Only images (jpg, png, gif) allowed!");
    }
  }
}).single("image"); // ✅ Make sure this matches your form field name

module.exports = upload;

