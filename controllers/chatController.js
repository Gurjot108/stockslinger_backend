// controllers/chatController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to fetch stock info (optional)
async function getStockInfo(symbol) {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
    );
    const data = response.data.quoteResponse.result[0];
    if (!data) return null;

    return {
      name: data.shortName,
      price: data.regularMarketPrice,
      change: data.regularMarketChangePercent,
    };
  } catch (err) {
    console.error("Stock fetch error:", err);
    return null;
  }
}

// Main chat handler
exports.getGeminiResponse = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Build context
    let context = "You are a friendly financial assistant.";
    const match = query.match(/\b[A-Z]{2,5}\b/);
    if (match) {
      const stock = await getStockInfo(match[0]);
      if (stock) {
        context += ` The user mentioned ${stock.name} (${
          match[0]
        }), trading at $${stock.price} (${stock.change.toFixed(2)}%).`;
      }
    }

    // Generate response from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`${context}\n\nUser: ${query}`);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Failed to fetch Gemini response" });
  }
};
