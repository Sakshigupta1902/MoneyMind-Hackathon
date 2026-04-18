const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],   // always 4 options
  correctIndex: Number, // 0-3
  explanation: String,
});

const dailyLessonSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
  topic: String,
  paragraph: String,
  mcq: mcqSchema,
});

module.exports = mongoose.model('DailyLesson', dailyLessonSchema);
