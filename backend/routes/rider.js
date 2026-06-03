const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /riders/submit-proofs
// @desc    Show proof upload form
// @access  Protected (Riders Only)
router.get('/submit-proofs', protect, authorize('rider'), (req, res) => {
    res.render('riders/submit-proofs', { title: 'Submit Proofs' });
});

// @route   POST /riders/submit-proofs
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

            // Update session with new proof data
            req.session.user.riderProofs = finalFilePaths;
            req.session.user.isApprovedRider = false;

            req.flash('success_msg', 'Proofs submitted successfully! Pending Admin review.');
        } else {
            req.flash('error_msg', 'No files were uploaded.');
        }

        res.redirect('/riders/submit-proofs');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error uploading proofs.');
        res.redirect('/riders/submit-proofs');
    }
});

module.exports = router;