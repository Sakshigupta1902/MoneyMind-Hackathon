const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true },
    password:      { type: String, required: true },
    monthlyIncome: { type: Number, default: 0 },
    phone:         { type: String, trim: true, default: '' },
    occupation:    { type: String, trim: true, default: '' },
    age:           { type: Number, default: null },
    avatar:        { type: String, default: '' }, // initials-based, no file upload needed
    currency:      { type: String, default: '₹' },
    languagePreference: { type: String, enum: ['english', 'hinglish'], default: 'hinglish' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
