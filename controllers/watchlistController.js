const Watchlist = require("../models/Watchlist");
const axios = require("axios");
const FMP_API_KEY = process.env.FMP_API_KEY; // Make sure it's in your .env
const FMP_QUOTE_URL = "https://financialmodelingprep.com/api/v3/quote";

// Add a company/item to user's watchlist
const addToWatchlist = async (req, res) => {
  try {
    const {
      userId,
      symbol,
      name,
      exchange,
      sector,
      logoUrl,
      priceAtAdd,
      currentPrice,
      priceChange,
      percentChange,
      lastUpdated,
    } = req.body;

    if (!userId || !symbol || !priceAtAdd) {
      return res
        .status(400)
        .json({ message: "userId, symbol and priceAtAdd are required" });
    }

    let userWatchlist = await Watchlist.findOne({ userId });

    if (!userWatchlist) {
      userWatchlist = new Watchlist({ userId, watchlist: [] });
    }

    const exists = userWatchlist.watchlist.find(
      (item) => item.symbol === symbol
    );
    if (exists) {
      return res.status(400).json({ message: "Item already in watchlist" });
    }

    userWatchlist.watchlist.push({
      symbol,
      name,
      exchange,
      sector,
      logoUrl,
      priceAtAdd,
      currentPrice,
      priceChange,
      percentChange,
      lastUpdated,
      addedAt: new Date(),
    });

    await userWatchlist.save();
    res.status(201).json(userWatchlist);
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getWatchlist = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      console.warn("[getWatchlist] Missing userId");
    }

    const userWatchlist = await Watchlist.findOne({ userId });

    if (!userWatchlist || userWatchlist.watchlist.length === 0) {
      return res.json({ watchlist: [] });
    }

    const enrichedWatchlist = await Promise.all(
      userWatchlist.watchlist.map(async (item) => {
        try {
          const { data } = await axios.get(
            `${FMP_QUOTE_URL}/${item.symbol}?apikey=${FMP_API_KEY}`
          );

          const quote = data[0];
          return {
            ...item.toObject(),
            currentPrice: quote?.price ?? item.currentPrice,
            priceChange: quote?.change ?? item.priceChange,
            percentChange: quote?.changesPercentage ?? item.percentChange,
            lastUpdated: new Date(),
          };
        } catch (err) {
          console.error(
            `[getWatchlist] Failed fetching quote for ${item.symbol}:`,
            err.message
          );
          return {
            ...item.toObject(),
            lastUpdated: new Date(),
          };
        }
      })
    );
    res.json({ watchlist: enrichedWatchlist });
  } catch (error) {
    console.error("[getWatchlist] Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove an item from watchlist
const removeFromWatchlist = async (req, res) => {
  try {
    const { userId, symbol } = req.body;

    if (!userId || !symbol) {
      return res
        .status(400)
        .json({ message: "userId and symbol are required" });
    }

    const userWatchlist = await Watchlist.findOne({ userId });
    if (!userWatchlist) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    const initialLength = userWatchlist.watchlist.length;
    userWatchlist.watchlist = userWatchlist.watchlist.filter(
      (item) => item.symbol !== symbol
    );

    if (userWatchlist.watchlist.length === initialLength) {
      return res.status(404).json({ message: "Item not found in watchlist" });
    }

    await userWatchlist.save();

    res.json({ message: "Item removed", watchlist: userWatchlist.watchlist });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
};
