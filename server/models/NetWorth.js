const mongoose = require('mongoose');

const netWorthSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    assets: {
      savings:      { type: Number, default: 0 },
      fixedDeposit: { type: Number, default: 0 },
      gold:         { type: Number, default: 0 },
      mutualFunds:  { type: Number, default: 0 },
      stocks:       { type: Number, default: 0 },
      realEstate:   { type: Number, default: 0 },
      ppf:          { type: Number, default: 0 },
      other:        { type: Number, default: 0 },
    },
    liabilities: {
      homeLoan:     { type: Number, default: 0 },
      carLoan:      { type: Number, default: 0 },
      personalLoan: { type: Number, default: 0 },
      creditCard:   { type: Number, default: 0 },
      education:    { type: Number, default: 0 },
      other:        { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

netWorthSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('NetWorth', netWorthSchema);
