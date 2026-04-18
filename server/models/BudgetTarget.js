const mongoose = require('mongoose');

const budgetTargetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One active target per user per month
budgetTargetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('BudgetTarget', budgetTargetSchema);
