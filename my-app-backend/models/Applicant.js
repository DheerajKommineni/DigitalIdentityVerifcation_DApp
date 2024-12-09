const mongoose = require('mongoose');

const ApplicantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  resumeHash: { type: String, required: true },
  credentials: [
    {
      description: { type: String },
      issuer: { type: String },
      verified: { type: Boolean, default: false },
    },
  ],
});

module.exports = mongoose.model('Applicant', ApplicantSchema);
