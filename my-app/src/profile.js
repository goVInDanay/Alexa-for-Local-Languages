const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const User = require('../models/User');

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // specify the directory to save images
    },
    filename: (req, file, cb) => {
        // Save the file with original name and timestamp to avoid conflicts
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create the multer upload middleware
const upload = multer({ storage });

// Update user profile
router.put('/update-profile/:email', upload.single('profileImage'), async (req, res) => {
    const { name, phone, country, city } = req.body;
    const profileImage = req.file ? req.file.path : null; // Get the uploaded image path

    try {
        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            { name, phone, country, city, profileImage },
            { new: true, runValidators: true } // Return the updated document and run validation
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
