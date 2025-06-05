const express = require("express");
const {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} = require("../controllers/watchlistController");

const router = express.Router();

// ⚠️ Removed requiresAuth() middleware — frontend now handles auth
router.post("/watchlist/add", addToWatchlist);
router.get("/watchlist", getWatchlist);
router.delete("/watchlist/remove", removeFromWatchlist);

module.exports = router;
