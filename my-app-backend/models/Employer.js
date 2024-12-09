const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Employer', EmployerSchema);
