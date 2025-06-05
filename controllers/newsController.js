const axios = require("axios");

const FINANCE_KEYWORDS = [
  "finance",
  "stock",
  "money",
  "forex",
  "crypto",
  "economy",
  "market",
  "investment",
];

const containsFinanceKeywords = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return FINANCE_KEYWORDS.some((keyword) => lowerText.includes(keyword));
};

const getNews = async (req, res) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    const category = "general";

    const response = await axios.get("https://finnhub.io/api/v1/news", {
      params: { category, token: apiKey },
    });

    let articles = response.data;

    // Deduplicate by headline
    const seen = new Set();
    articles = articles.filter((article) => {
      if (seen.has(article.headline)) return false;
      seen.add(article.headline);
      return true;
    });

    // Filter finance-related articles
    const filteredArticles = articles.filter(
      (article) =>
        containsFinanceKeywords(article.headline) ||
        containsFinanceKeywords(article.summary)
    );

    res.status(200).json({ results: filteredArticles });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ error: "Failed to fetch news articles" });
  }
};

module.exports = { getNews };
