const multer = require('multer');
const fs = require('fs');

// 1. Tell Multer to temporarily store incoming files here
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempPath = 'uploads/temp/';
        // Ensure the temp folder exists
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
        }
        cb(null, tempPath);
    },
    filename: function (req, file, cb) {
        // Keep the original extension (e.g., .jpg, .pdf)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;