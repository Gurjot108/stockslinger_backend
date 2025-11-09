const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper: Clean Gemini Markdown ---
function sanitizeGeminiText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove **bold**
    .replace(/\*(.*?)\*/g, "$1") // remove *italic*
    .replace(/#+\s?/g, "") // remove # headings
    .replace(/[-•]\s*/g, "• ") // normalize bullet points
    .replace(/\n{2,}/g, "\n") // collapse multiple newlines
    .trim();
}

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

exports.getGeminiResponse = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    let context = "You are a friendly and concise financial assistant.";
    const match = query.match(/\b[A-Z]{2,5}\b/);
    if (match) {
      const stock = await getStockInfo(match[0]);
      if (stock) {
        context += ` The user mentioned ${stock.name} (${
          match[0]
        }), trading at $${stock.price} (${stock.change.toFixed(2)}%).`;
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${context}\n\nUser: ${query}` }],
        },
      ],
    });

    const reply = result.response.text();
    const cleanReply = sanitizeGeminiText(reply);
    res.json({ reply: cleanReply });
  } catch (err) {
    console.error("🚨 Gemini API error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch Gemini response" });
  }
};
