const NetWorth = require('../models/NetWorth');

const calcTotals = (assets, liabilities) => {
  const totalAssets      = Object.values(assets).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalLiabilities = Object.values(liabilities).reduce((s, v) => s + (Number(v) || 0), 0);
  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
};

// POST /api/networth  — save or update current month
exports.saveNetWorth = async (req, res) => {
  try {
    const { assets, liabilities } = req.body;
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const entry = await NetWorth.findOneAndUpdate(
      { user: req.user.id, month, year },
      { assets, liabilities },
      { upsert: true, new: true }
    );

    const { totalAssets, totalLiabilities, netWorth } = calcTotals(assets, liabilities);
    res.json({ ...entry.toObject(), totalAssets, totalLiabilities, netWorth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/networth/current
exports.getCurrent = async (req, res) => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const entry = await NetWorth.findOne({ user: req.user.id, month, year });
    if (!entry) return res.json({ hasData: false });

    const { totalAssets, totalLiabilities, netWorth } = calcTotals(entry.assets, entry.liabilities);
    res.json({ hasData: true, ...entry.toObject(), totalAssets, totalLiabilities, netWorth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/networth/history  — last 6 months for chart
exports.getHistory = async (req, res) => {
  try {
    const entries = await NetWorth.find({ user: req.user.id })
      .sort({ year: 1, month: 1 })
      .limit(12);

    const history = entries.map((e) => {
      const { totalAssets, totalLiabilities, netWorth } = calcTotals(e.assets, e.liabilities);
      const monthName = new Date(e.year, e.month - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      return { month: monthName, totalAssets, totalLiabilities, netWorth };
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
