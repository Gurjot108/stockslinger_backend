const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String },
  exchange: { type: String },
  sector: { type: String },
  logoUrl: { type: String },
  priceAtAdd: { type: Number, required: true },
  currentPrice: { type: Number },
  priceChange: { type: Number },
  percentChange: { type: Number },
  lastUpdated: { type: Date },
  addedAt: { type: Date, default: Date.now },
});

const watchlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  watchlist: [watchlistItemSchema],
});

module.exports =
  mongoose.models?.Watchlist || mongoose.model("Watchlist", watchlistSchema);
