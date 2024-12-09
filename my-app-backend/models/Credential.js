const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  description: { type: String, required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' },
  issuer: { type: String, required: true },
  verified: { type: Boolean, default: false },
});

module.exports = mongoose.model('Credential', CredentialSchema);
