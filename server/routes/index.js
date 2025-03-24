const express =  require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const authenticateToken = require('../middleware/authenticateToken');

// for multer and speech to text api
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');


const upload = multer({ dest: 'uploads/' });
const path = require('path');
const speechClient = new SpeechClient({
  keyFilename: './alexa-local-language.json' 
});

//Dashboard
router.get('/dashboard', authenticateToken, (req, res) => {
  const fullName = req.user.name;
  const firstName = fullName.split(' ')[0];
    return res.status(200).json({
        name: firstName
    });
});

// multer audio file upload => upload -> work -> delete

router.post('/upload-audio', upload.single('audio'), async (req, res) => {

  const audioFile = req.file.path;
  const language =  req.body.languageCode;
  // console.log(language);
  const audio = {
      content: fs.readFileSync(audioFile).toString('base64'),
  };
  fs.unlinkSync(audioFile); // Clean up the temporary file
//   console.log('Deleted');
// Audio Speech to text
  const request = {
      audio: audio,
      config: {
          encoding: 'WEBM',
          sampleRateHertz: 48000,
          languageCode: language,
      },
  };

  try {
      const [response] = await speechClient.recognize(request);
      const transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
      console.log(transcription);
      res.json({ text: transcription });
  } catch (error) {
    console.log(error)
      res.status(500).json({ error: 'Failed to transcribe audio' });
  } 
});


module.exports = router;