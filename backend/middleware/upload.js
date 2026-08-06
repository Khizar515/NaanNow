const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    const userIdStr = req.user ? req.user._id.toString() : 'guest';
    // Route based logic to pick folder
    if (req.originalUrl.includes('avatar') || req.originalUrl.includes('profile')) {
      folder += `profiles/${userIdStr}/`;
    } else if (req.originalUrl.includes('docs')) {
      folder += `documents/${userIdStr}/`;
    } else if (req.originalUrl.includes('menu')) {
      folder += 'menu/';
    } else {
      folder += `misc/${userIdStr}/`;
    }
    
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, (req.user ? req.user._id : 'guest') + '_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
