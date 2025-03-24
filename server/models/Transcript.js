const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  transcripts: [{
    transcript: { type: String, required: true }
  }]
});

const Transcript = mongoose.model('Transcript', transcriptSchema);

module.exports = Transcript;
