// backend/routes/fmpRoutes.js

const express = require("express");
const router = express.Router();
const fmpController = require("../controllers/fmpController"); // Import the controller functions

// Define routes for FMP data
router.get("/market-indices", fmpController.getMarketIndices);
router.get("/top-gainers", fmpController.getTopGainers);
router.get("/top-losers", fmpController.getTopLosers);
router.get("/search", fmpController.searchSymbols);
router.get("/instruments", fmpController.getInstruments);
router.get("/company/profile/:symbol", fmpController.getCompanyProfile);
router.get("/company/quote/:symbol", fmpController.getCompanyQuote);
router.get("/company/key-metrics/:symbol", fmpController.getKeyMetrics);
router.get("/company/:symbol/chart", fmpController.getHistoricalChart);

module.exports = router;
