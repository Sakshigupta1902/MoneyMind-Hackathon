const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  note: { type: String, trim: true },
  date: { type: Date, default: Date.now },
});

const savingsGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true },
    savedAmount: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    emoji: { type: String, default: '🎯' },
    category: {
      type: String,
      enum: ['Emergency Fund', 'Vacation', 'Education', 'Vehicle', 'Home', 'Wedding', 'Gadget', 'Other'],
      default: 'Other',
    },
    isCompleted: { type: Boolean, default: false },
    contributions: [contributionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
