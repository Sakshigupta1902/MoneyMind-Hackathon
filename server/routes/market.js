const router = require('express').Router();
const { getFDRates, getGoldPrice, getMutualFunds, getCurrency, getGovtSchemes } = require('../controllers/marketController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/fd-rates',      getFDRates);
router.get('/gold',          getGoldPrice);
router.get('/currency',      getCurrency);
router.get('/mutual-funds',  getMutualFunds);
router.get('/govt-schemes',  getGovtSchemes);


module.exports = router;
