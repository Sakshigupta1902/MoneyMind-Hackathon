const https = require('https');

// Simple fetch helper
const fetchJSON = (url, options = {}) =>
  new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MoneyMind/1.0' }, ...options }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });

// 15 min cache
const cache = {};
const CACHE_TTL = 15 * 60 * 1000;
const getCached = async (key, fetcher) => {
  if (cache[key] && Date.now() - cache[key].time < CACHE_TTL) return cache[key].data;
  const data = await fetcher();
  cache[key] = { data, time: Date.now() };
  return data;
};

// ── Accurate FD Rates (manually maintained — banks rarely change these) ──────
const FD_RATES = [
  { bank: 'SBI',            rates: { '1yr': 6.80, '2yr': 7.00, '3yr': 6.75, '5yr': 6.50 }, seniorCitizen: '+0.50%', minAmount: '₹1,000'  },
  { bank: 'HDFC Bank',      rates: { '1yr': 6.60, '2yr': 7.00, '3yr': 7.00, '5yr': 7.00 }, seniorCitizen: '+0.25%', minAmount: '₹5,000'  },
  { bank: 'ICICI Bank',     rates: { '1yr': 6.70, '2yr': 7.00, '3yr': 7.00, '5yr': 7.00 }, seniorCitizen: '+0.25%', minAmount: '₹10,000' },
  { bank: 'Axis Bank',      rates: { '1yr': 6.70, '2yr': 7.10, '3yr': 7.10, '5yr': 7.00 }, seniorCitizen: '+0.25%', minAmount: '₹5,000'  },
  { bank: 'Kotak Bank',     rates: { '1yr': 7.10, '2yr': 7.10, '3yr': 7.10, '5yr': 6.20 }, seniorCitizen: '+0.25%', minAmount: '₹5,000'  },
  { bank: 'PNB',            rates: { '1yr': 6.80, '2yr': 6.80, '3yr': 6.80, '5yr': 6.50 }, seniorCitizen: '+0.50%', minAmount: '₹1,000'  },
  { bank: 'Bank of Baroda', rates: { '1yr': 6.85, '2yr': 7.00, '3yr': 7.00, '5yr': 6.50 }, seniorCitizen: '+0.50%', minAmount: '₹1,000'  },
  { bank: 'Canara Bank',    rates: { '1yr': 6.85, '2yr': 6.85, '3yr': 6.85, '5yr': 6.70 }, seniorCitizen: '+0.50%', minAmount: '₹1,000'  },
];

// ── GET /api/market/fd-rates ──────────────────────────────────────────────────
exports.getFDRates = (req, res) => {
  try {
    const best1yr = [...FD_RATES].sort((a, b) => b.rates['1yr'] - a.rates['1yr'])[0];
    const best5yr = [...FD_RATES].sort((a, b) => b.rates['5yr'] - a.rates['5yr'])[0];
    res.json({
      rates: FD_RATES,
      best1yr: { bank: best1yr.bank, rate: best1yr.rates['1yr'] },
      best5yr: { bank: best5yr.bank, rate: best5yr.rates['5yr'] },
      lastUpdated: 'June 2025',
      note: 'Rates are accurate as of June 2025. Verify on bank website before investing.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/market/gold — Real live price ────────────────────────────────────
exports.getGoldPrice = async (req, res) => {
  try {
    const goldData = await getCached('gold', async () => {
      try {
        const data = await fetchJSON('https://api.metals.live/v1/spot/gold');
        const priceUSD = data[0]?.price;
        if (!priceUSD) throw new Error('No price');

        // Get live USD/INR rate
        let usdToInr = 83.5;
        try {
          const fx = await fetchJSON('https://open.er-api.com/v6/latest/USD');
          usdToInr = fx.rates?.INR || 83.5;
        } catch { /* use fallback */ }

        const per1gINR  = Math.round((priceUSD / 31.1035) * usdToInr);
        const per10gINR = per1gINR * 10;
        return { priceUSD: priceUSD.toFixed(2), per1gINR, per10gINR, usdToInr: usdToInr.toFixed(2), isLive: true };
      } catch {
        return { priceUSD: 2350, per1gINR: 6300, per10gINR: 63000, usdToInr: '83.50', isLive: false };
      }
    });

    res.json({
      ...goldData,
      lastUpdated: new Date().toLocaleTimeString('en-IN'),
      tip: 'Gold mein 10-20% portfolio rakho. Sovereign Gold Bond (SGB) best option hai — extra 2.5% interest milta hai.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/market/currency — Live USD/INR ───────────────────────────────────
exports.getCurrency = async (req, res) => {
  try {
    const fxData = await getCached('currency', async () => {
      const data = await fetchJSON('https://open.er-api.com/v6/latest/USD');
      if (!data.rates) throw new Error('No rates');
      return {
        usdInr: data.rates.INR?.toFixed(2),
        eurInr: (data.rates.INR / data.rates.EUR)?.toFixed(2),
        gbpInr: (data.rates.INR / data.rates.GBP)?.toFixed(2),
        jpyInr: (data.rates.INR / data.rates.JPY)?.toFixed(4),
        lastUpdated: data.time_last_update_utc,
        isLive: true,
      };
    });
    res.json(fxData);
  } catch (err) {
    // Fallback
    res.json({ usdInr: '83.50', eurInr: '90.20', gbpInr: '105.30', jpyInr: '0.5520', isLive: false });
  }
};

// ── GET /api/market/mutual-funds — Live NAV from mfapi.in ─────────────────────
exports.getMutualFunds = async (req, res) => {
  try {
    const topFunds = [
      { schemeCode: 120503, name: 'Mirae Asset Large Cap Fund',       category: 'Large Cap' },
      { schemeCode: 118989, name: 'Axis Bluechip Fund',               category: 'Large Cap' },
      { schemeCode: 120716, name: 'Parag Parikh Flexi Cap Fund',      category: 'Flexi Cap' },
      { schemeCode: 119598, name: 'SBI Small Cap Fund',               category: 'Small Cap' },
      { schemeCode: 125354, name: 'Mirae Asset Emerging Bluechip',    category: 'Mid Cap'   },
    ];

    const fundsWithNAV = await getCached('mf', async () => {
      const results = await Promise.allSettled(
        topFunds.map(async (fund) => {
          const data = await fetchJSON(`https://api.mfapi.in/mf/${fund.schemeCode}/latest`);
          const nav     = parseFloat(data.data?.[0]?.nav || 0);
          const prevNav = parseFloat(data.data?.[1]?.nav || nav);
          const change  = prevNav > 0 ? (((nav - prevNav) / prevNav) * 100).toFixed(2) : '0.00';
          return {
            ...fund,
            nav: nav.toFixed(2),
            change: parseFloat(change),
            isPositive: parseFloat(change) >= 0,
            date: data.data?.[0]?.date,
          };
        })
      );
      return results.map((r) => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
    });

    res.json({
      funds: fundsWithNAV,
      lastUpdated: new Date().toLocaleTimeString('en-IN'),
      isLive: true,
      tip: 'SIP se invest karo — har mahine fixed amount lagao. Long term mein compounding ka fayda milta hai.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/market/govt-schemes — Accurate government scheme rates ────────────
exports.getGovtSchemes = (req, res) => {
  res.json({
    schemes: [
      { name: 'PPF',  fullName: 'Public Provident Fund',       rate: 7.1, tenure: '15 years',  taxBenefit: '80C + Tax-free returns', minAmount: '₹500/year',  maxAmount: '₹1.5L/year', risk: 'None', emoji: '🏛️' },
      { name: 'NSC',  fullName: 'National Savings Certificate', rate: 7.7, tenure: '5 years',   taxBenefit: '80C',                    minAmount: '₹1,000',     maxAmount: 'No limit',   risk: 'None', emoji: '📜' },
      { name: 'SSY',  fullName: 'Sukanya Samriddhi Yojana',    rate: 8.2, tenure: '21 years',  taxBenefit: '80C + Tax-free',         minAmount: '₹250/year',  maxAmount: '₹1.5L/year', risk: 'None', emoji: '👧' },
      { name: 'SCSS', fullName: 'Senior Citizen Savings Scheme',rate: 8.2, tenure: '5 years',  taxBenefit: '80C',                    minAmount: '₹1,000',     maxAmount: '₹30L',       risk: 'None', emoji: '👴' },
      { name: 'RD',   fullName: 'Post Office Recurring Deposit',rate: 6.7, tenure: '5 years',  taxBenefit: 'None',                   minAmount: '₹100/month', maxAmount: 'No limit',   risk: 'None', emoji: '📮' },
      { name: 'MIS',  fullName: 'Post Office Monthly Income',   rate: 7.4, tenure: '5 years',  taxBenefit: 'None',                   minAmount: '₹1,000',     maxAmount: '₹9L',        risk: 'None', emoji: '💌' },
    ],
    lastUpdated: 'Q1 2025',
    note: 'Rates are set by Government of India. Updated quarterly.',
  });
};
