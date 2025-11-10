const express = require("express");
const axios = require("axios");
const Watchlist = require("../models/Watchlist");

const router = express.Router();

// FastAPI model endpoint
const RECOMMENDER_API_URL =
  process.env.RECOMMENDER_API_URL || "https://stock-recommender.onrender.com";

// Get personalized stock recommendations for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Fetch user's watchlist from MongoDB
    const userWatchlist = await Watchlist.findOne({ userId });
    if (!userWatchlist || userWatchlist.watchlist.length === 0) {
      return res.json({
        message: "No stocks in watchlist",
        recommendations: [],
      });
    }

    // Extract all stock symbols
    const userSymbols = userWatchlist.watchlist.map((item) => item.symbol);

    // Pick one symbol for now (you can extend this later for portfolio-average)
    const baseSymbol = userSymbols[0];

    console.log(`[Recommend] User ${userId}, base symbol: ${baseSymbol}`);

    // Call FastAPI recommender
    const response = await axios.get(`${RECOMMENDER_API_URL}/recommend`, {
      params: { symbol: baseSymbol, n: 5 },
    });

    // Return combined response
    res.json({
      userId,
      base: baseSymbol,
      recommendations: response.data.recommendations || [],
    });
  } catch (error) {
    console.error("[Recommend] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

module.exports = router;
