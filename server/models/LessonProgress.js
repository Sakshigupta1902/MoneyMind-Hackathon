const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  answered: { type: Boolean, default: false },
  correct: { type: Boolean, default: false },
  selectedIndex: { type: Number, default: null },
  pointsEarned: { type: Number, default: 0 },
});

lessonProgressSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
