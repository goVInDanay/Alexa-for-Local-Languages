const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const otpStorage = {};
const { sendOTP } = require('../utils/otp'); // Correct import
require('dotenv').config();
// User Model
const User = require('../models/User');



// Register Handle
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all the fields' });
    }

    // Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check pass length
    if (password.length < 8) {
        errors.push({ msg: 'Password must be at least 8 characters long' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    } 
    else{
        // Validation passed
        User.findOne({ email: email }).then((user) => {
            if (user) {
                // User exists
                errors.push({ msg: 'Email is already registered' });
                return res.status(400).json({ errors });
            } else {
                // Store registration details in session
                req.session.tempUser = {
                    name,
                    email,
                    password, 
                };

                // Generate OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();


                // Store OTP in memory with expiry
                otpStorage[email] = {
                    otp,
                    expires: Date.now() + 10 * 60 * 1000,
                    name: req.body.name,
                    password: req.body.password,
                };

                // Send OTP to user's email
                sendOTP(email, otp);

                // Render OTP verification page
                return res.status(200).json({ message: 'OTP sent to email' });
            }
        });
    }
});

// Verify OTP Route for Registration
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    
    if (!otpStorage[email]) {
        req.flash('error_msg', 'No OTP found. Please register again.');
        return res.redirect('/users/register');
    }
    const { otp: storedOTP, expires, name, password } = otpStorage[email];

    if (Date.now() > expires) {
        req.flash('error_msg', 'OTP has expired. Please register again.');
        return res.redirect('/users/register');
    }

    if (otp === storedOTP) {
        // OTP is correct, complete registration

        const newUser = new User({
            name,
            email,
            password, 
        });

        // Hash password before saving
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;

                // Save new user to database
                newUser
                    .save()
                    .then((user) => {
                        delete otpStorage[email]; // Remove OTP after success
                        return res.status(200).json({ message: 'You are now registered and can log in.' });
                    })
                    .catch((err) =>{
                        return res.status(500).json({ message: 'Error saving user', error: err });
                    });
            });
        });
    } else {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
});


// Login Handle with OTP
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Wrong email or password' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        
        otpStorage[user.email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

        // Create a plain object for the JWT payload
        const payload = {
            id: user._id,
            email: user.email,
        };

        // Sign the token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1day' });
        // Send OTP to user's email
        sendOTP(user.email, otp).then(() => {
            res.status(200).json({
                success: true,
                message: 'OTP sent to email',
                email: user.email, // Return the email for OTP verification
            });
        }).catch((error) => {
            console.error('Error sending OTP:', error);
            res.status(500).json({ success: false, message: 'Failed to send OTP' });
        });
    })(req, res, next);
});

// OTP Verification Route for Login
router.post('/verify-otp-login', (req, res) => {
    const { email, otp } = req.body;

    if (otpStorage[email] && otpStorage[email].otp === otp && Date.now() < otpStorage[email].expires) {
        // OTP is valid, log in the user
        User.findOne({ email: email }).then((user) => {
            req.logIn(user, (err) => {
                if (err){
                    return res.status(500).json({
                        success: false,
                        message: 'Login failed',
                        error: err.message,
                });
            }
            delete otpStorage[email];
            const payload = {
                name: user.name,
                id: user._id,
                email: user.email,
            };
    
            // Sign the token
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1day' });
            return res.status(200).json({
                success: true,
                message: 'OTP verified successfully',
                token: token, 
            });
            });
        }).catch(err => {
            return res.status(500).json({
                success: false,
                message: 'An error occurred while retrieving the user',
                error: err.message,
            });
        });
    } else {
            return res.status(400).json({
            success: false,
            message: 'Invalid or expired OTP',
        });
    }
});

router.post('/resend-otp', (req, res) => {
    const { email } = req.body;

    // Check if user exists
    User.findOne({ email }).then(user => {
        if (!user) {
            return res.status(400).json({ success: false, message: 'No account with that email found.' });
        }

        // Generate new OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store new OTP with expiry
        otpStorage[email] = {
            otp: newOtp,
            expires: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
        };

        // Send new OTP
        sendOTP(email, newOtp);

        res.json({ success: true, message: 'OTP resent successfully.' });
    }).catch(err => {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    });
});


router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    
    User.findOne({ email }).then((user) => {
        if (!user) {
            return res.status(400).json({ message: 'No account found with that email address.' });
        }
        
        // Generate OTP for password reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in memory with expiry time
        otpStorage[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // OTP expires in 10 minutes
        
        // Send OTP to user's email
        sendOTP(email, otp);
        
        // Render OTP verification page with expiry time
        return res.status(200).json({ message: 'OTP sent to email for password reset' });
    }).catch((err) => console.log(err));
});
// Resend OTP Route for Forgot Password
router.post('/resend-otp-reset', (req, res) => {
    const { email } = req.body;

    if (!otpStorage[email]) {
        return res.status(400).json({ message: 'No OTP found. Please request a new OTP.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();    

    // Update OTP in storage
    otpStorage[email] = {
        otp,
        expires: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
    };

    // Send new OTP
    sendOTP(email, otp).then(() => {
        return res.status(200).json({ message: 'New OTP sent successfully.' });
    }).catch(err => {
        console.error('Error sending OTP:', err);
        return res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
    });
});

// Verify OTP for Password Reset
router.post('/verify-otp-reset', (req, res) => {
    const { email, otp } = req.body;

    if (!otpStorage[email] || Date.now() > otpStorage[email].expires) {
        return res.status(400).json({ message: 'OTP has expired or is invalid. Please try again.' });
    }

    if (otp === otpStorage[email].otp) {
        // OTP is correct, return success response
        return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
});
router.post('/getName', (req, res) => {
    const { email } = req.body; // Destructuring to extract email from request body

    User.findOne({ email }).then((user) => {
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: user.name }); // Sending user's name in the response
    }).catch(err => {
        return res.status(500).json({ message: 'Server error', error: err.message });
    });
});

// Handle Password Reset
router.post('/reset-password', (req, res) => {
    const { email, password } = req.body;
    // Validate new password
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Find the user and update the password
    User.findOne({ email }).then((user) => {
        if (!user) {
            return res.status(404).json({ message: 'No account found.' });
        }

        // Hash the new password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                return res.status(500).json({ message: 'Error generating salt.' });
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    return res.status(500).json({ message: 'Error hashing password.' });
                }
                
                // Set the new hashed password
                user.password = hash;

                // Save the updated user
                user.save()
                    .then(() => {
                        delete otpStorage[email]; // Clear OTP storage
                        return res.status(200).json({ message: 'Password successfully reset. You can now log in.' });
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.status(500).json({ message: 'Error saving new password.' });
                    });
            });
        });
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: 'Error finding user.' });
    });
});
router.post("/update-password", async (req, res) => {
    const { email, oldPassword, newPassword} = req.body;
    console.log({ email, oldPassword, newPassword })
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Check if oldPassword matches hashed password in the database
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Old password is incorrect" });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );
  
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });

module.exports = router;