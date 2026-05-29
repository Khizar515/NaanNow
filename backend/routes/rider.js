const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/riders/submit-proofs
// @desc    Upload bike and license proofs for Admin review
// @access  Protected (Riders Only)
router.post('/submit-proofs', protect, authorize('rider'), upload.array('documents', 5), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (req.files && req.files.length > 0) {
            const safeName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
            const targetDir = `uploads/riders/${safeName}_${user._id}`;
            
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const finalFilePaths = [];

            req.files.forEach(file => {
                const targetPath = path.join(targetDir, file.filename);
                fs.renameSync(file.path, targetPath);
                finalFilePaths.push(`/${targetPath.replace(/\\/g, '/')}`);
            });

            user.riderProofs = finalFilePaths;
            user.isApprovedRider = false; // Resets approval if they upload new documents
            await user.save();

            res.status(200).json({ message: 'Proofs submitted successfully! Pending Admin review.', proofs: finalFilePaths });
        } else {
            res.status(400).json({ message: 'No files were uploaded.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error uploading proofs' });
    }
});

module.exports = router;