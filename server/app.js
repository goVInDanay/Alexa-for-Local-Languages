const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { ensureAuthenticated } = require('./config/auth');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { exec } = require('child_process');
const cors = require('cors');
const textToSpeech = require('@google-cloud/text-to-speech');
require('dotenv').config();

const app = express();
app.use(cookieParser());
const port = process.env.PORT || 5000;

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = process.env.MONGO_URI;

app.use(cors({ 
  origin: 'http://localhost:3000', // Your React app's port
  credentials: true 
}));

// Connect to MongoDB
mongoose.connect(db)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log('MongoDB connection error:', err.message || err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// BodyParser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());


// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error_msg');
  next();
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET , (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Define Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/api', require('./routes/users'));
app.use('/api/feedback', require('./utils/feedback'));
app.get('/user/username', async (req, res) => {
  const { email } = req.query; // Get email from query parameter

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      name: user.name,
      profilePicture: user.profilePicture, // Assuming you store the profile picture URL
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post('/api/profile', async (req, res) => {
  try {
    const { email, name, phone, country, city, profilePicture } = req.body;
    // Find user by email and update profile fields
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { name, phone, country, city, profilePicture },
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      res.status(200).json({ message: 'Profile updated successfully', updatedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

app.get('/api/getDetails', async (req, res) => {
  const { email } = req.query; // Get email from query parameter]
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    // Use findOne to get the user details
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Send user details as response
    res.status(200).json({
      name: user.name,
      phone: user.phone,
      country: user.country,
      city: user.city,
      profilePicture: user.profilePicture, // Assuming you store the profile picture URL
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Google Text-to-Speech Client
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: 'alexa-local-language.json'
});

// Route for saving the transcript
app.post('/save-transcript', async (req, res) => {
  const { transcript, language, mode } = req.body;

  console.log('Received request:', { transcript});

  try {
    if (!transcript) {
      throw new Error('Invalid transcript data');
    }

    // Prepare command to execute Python script
    const command = `python ${mode}.py "${transcript}" "${language.trim()}"`;
    exec(command, async (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log(`stdout: ${stdout}`);
      
      try {
        const output = JSON.parse(stdout); // Parse the JSON output from Python

        // Google Text-to-Speech request
        const outputText = output.processedText.trim();
        const request = {
          input: { text: outputText },
          voice: { languageCode: language, ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await client.synthesizeSpeech(request);
        // console.log(response)

        res.json({
          success: true,
          message: 'Transcript saved and processed successfully',
          processedText: output.processedText,
          audioContent: response.audioContent.toString('base64')
        });
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        res.status(500).json({ success: false, error: 'Failed to parse JSON output from Python' });
      }
    });
    
  } catch (error) {
    console.error('Error saving transcript:', error.message || error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
