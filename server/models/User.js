const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure that email is unique
        lowercase: true, // Store emails in lowercase
        trim: true // Trim whitespace
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false, // Made not required
        trim: true // Trim whitespace
    },
    country: {
        type: String,
        required: false, // Made not required
        default: 'India', // Default value
        trim: true // Trim whitespace
    },
    city: {
        type: String,
        required: false, // Made not required
        default: 'New Delhi', // Default value
        trim: true // Trim whitespace
    },
    profilePicture: {
        type: String, // URL or path to the image file
        default: null // Default value if no image is provided
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Create the user model
const User = mongoose.model('User', UserSchema);
module.exports = User;
