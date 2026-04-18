const mongoose = require('mongoose');

const redeemHistorySchema = new mongoose.Schema({
  pointsUsed: Number,
  cashbackValue: Number,
  redeemedAt: { type: Date, default: Date.now },
});

const userRewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    lessonsCompleted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    redeemHistory: [redeemHistorySchema],
    badges: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserReward', userRewardSchema);
