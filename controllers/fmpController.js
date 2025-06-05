const axios = require("axios");

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

const callFmpApi = async (endpoint) => {
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY is not configured in environment variables.");
  }
  const url = `${FMP_BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }apikey=${FMP_API_KEY}`;

  console.log(`Fetching from FMP: ${url}`);

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `FMP API Error for ${endpoint}: Status ${error.response.status} - Data:`,
        error.response.data
      );
      throw new Error(
        `FMP API returned status ${error.response.status}: ${JSON.stringify(
          error.response.data
        )}`
      );
    } else if (error.request) {
      console.error(
        `FMP API Error for ${endpoint}: No response received -`,
        error.message
      );
      throw new Error(
        `No response from FMP API for ${endpoint}: ${error.message}`
      );
    } else {
      console.error(
        `Error setting up FMP API request for ${endpoint}:`,
        error.message
      );
      throw new Error(`Error setting up FMP API request: ${error.message}`);
    }
  }
};

exports.getMarketIndices = async (req, res) => {
  if (!FMP_API_KEY) {
    console.error("FMP_API_KEY is not configured.");
    return res.status(500).json({ error: "FMP API Key is missing." });
  }

  // Define the symbols you want to fetch
  const symbols = ["^GSPC", "^IXIC", "^N225", "^FTSE"]; // S&P 500, NASDAQ, Dow Jones
  const baseUrl = "https://financialmodelingprep.com/stable/quote";

  try {
    // Prepare all requests
    const requests = symbols.map((symbol) =>
      axios.get(`${baseUrl}?symbol=${symbol}&apikey=${FMP_API_KEY}`)
    );

    // Execute all in parallel
    const responses = await Promise.all(requests);

    // Combine and transform all results
    const allData = responses.flatMap((response) => {
      const data = response.data;
      if (!Array.isArray(data) || data.length === 0) return [];
      return data.map((item) => ({
        symbol: item.symbol,
        name: item.name,
        price: item.price,
        changePercentage: item.changePercentage,
        change: item.change,
        volume: item.volume,
        dayLow: item.dayLow,
        dayHigh: item.dayHigh,
        yearHigh: item.yearHigh,
        yearLow: item.yearLow,
        marketCap: item.marketCap,
        priceAvg50: item.priceAvg50,
        priceAvg200: item.priceAvg200,
        exchange: item.exchange,
        open: item.open,
        previousClose: item.previousClose,
        timestamp: item.timestamp,
      }));
    });

    res.json(allData);
  } catch (error) {
    console.error("Error fetching indices:", error.message);
    res.status(500).json({
      error: "Failed to fetch market indices",
      details: error.message,
    });
  }
};

exports.getTopGainers = async (req, res) => {
  try {
    const data = await callFmpApi("/stock_market/gainers");
    res.json(data);
  } catch (error) {
    console.error("Error in getTopGainers:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch top gainers", details: error.message });
  }
};

exports.getTopLosers = async (req, res) => {
  try {
    const data = await callFmpApi("/stock_market/losers");
    res.json(data);
  } catch (error) {
    console.error("Error in getTopLosers:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch top losers", details: error.message });
  }
};

exports.getInstruments = async (req, res) => {
  const { category, query } = req.query;

  let symbolsToFetch = [];

  switch (category) {
    case "stocks":
      symbolsToFetch = [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "NVDA",
        "META",
        "ADBE",
        "CRM",
        "INTC",
        "JNJ",
        "PFE",
        "UNH",
        "LLY",
        "ABBV",
        "JPM",
        "BAC",
        "V",
        "MA",
        "GS",
        "TSLA",
        "HD",
        "MCD",
        "NKE",
        "PG",
        "KO",
        "PEP",
        "WMT",
        "GE",
        "CAT",
        "UPS",
        "XOM",
        "CVX",
        "NEE",
        "DUK",
        "T",
        "VZ",
        "NFLX",
        "LIN",
        "DOW",
      ];
      break;
    case "etfs":
      symbolsToFetch = [
        "SPY",
        "QQQ",
        "VTI",
        "IVV",
        "VOO",
        "IWM",
        "DIA",
        "XLK",
        "XLF",
        "XLV",
        "XLE",
        "XLI",
        "ARKK",
        "SMH",
        "SOXX",
        "GLD",
        "SLV",
        "AGG",
        "BND",
      ];
      break;
    case "mf":
      symbolsToFetch = [
        "VTSAX",
        "VFINX",
        "FBGRX",
        "SWPPX",
        "PRWCX",
        "MGK",
        "VOO",
        "VTIAX",
      ];
      break;
    case "commodities":
      symbolsToFetch = [
        "GC=F",
        "CL=F",
        "SI=F",
        "NG=F",
        "HG=F",
        "ZC=F",
        "ZS=F",
        "ZT=F",
        "USO",
        "UNG",
        "GDX",
      ];
      break;
    default:
      return res
        .status(400)
        .json({ error: "Invalid instrument category provided." });
  }

  try {
    const data = await callFmpApi(`/quote/${symbolsToFetch.join(",")}`);

    let instruments = data;

    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      instruments = instruments.filter(
        (item) =>
          (item.symbol && item.symbol.toLowerCase().includes(lowerCaseQuery)) ||
          (item.name && item.name.toLowerCase().includes(lowerCaseQuery))
      );
    }

    const transformedInstruments = instruments.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      change: item.change,
      volume: item.volume ? `${(item.volume / 1000000).toFixed(1)}M` : "N/A",
    }));

    res.json(transformedInstruments);
  } catch (error) {
    console.error("Error in getInstruments:", error.message);
    res.status(500).json({
      error: `Failed to fetch ${category} instruments`,
      details: error.message,
    });
  }
};

exports.searchSymbols = async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Query parameter is required." });
  }

  // Define acceptable US exchange names (case-insensitive)
  const usExchanges = [
    "NASDAQ",
    "NASDAQGS",
    "NASDAQGM",
    "NASDAQCM",
    "NYSE",
    "NEW YORK STOCK EXCHANGE",
    "NYSE AMERICAN",
    "ARCA",
  ];

  try {
    const data = await callFmpApi(
      `/search?query=${encodeURIComponent(query)}&limit=10`
    );

    const simplifiedResults = data
      .map((item) => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.stockExchange,
      }))
      .filter(
        (item) =>
          item.exchange &&
          usExchanges.some((ex) =>
            item.exchange.toUpperCase().includes(ex.toUpperCase())
          )
      );

    res.json(simplifiedResults);
  } catch (error) {
    console.error("Error in searchSymbols:", error.message);
    res.status(500).json({
      error: "Failed to perform symbol search",
      details: error.message,
    });
  }
};

exports.getCompanyProfile = async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol parameter is required." });
  }

  try {
    const data = await callFmpApi(`/profile/${encodeURIComponent(symbol)}`);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Company profile not found." });
    }

    // Usually data is an array with one object for that symbol
    const profile = data[0];

    res.json({
      symbol: profile.symbol,
      companyName: profile.companyName,
      industry: profile.industry,
      sector: profile.sector,
      description: profile.description,
      ceo: profile.ceo,
      website: profile.website,
      country: profile.country,
      exchange: profile.exchange,
      image: profile.image,
      price: profile.price,
      beta: profile.beta,
      volAvg: profile.volAvg,
      mktCap: profile.mktCap,
      lastDiv: profile.lastDiv,
      range: profile.range,
      changes: profile.changes,
      currency: profile.currency,
    });
  } catch (error) {
    console.error("Error fetching company profile:", error.message);
    res.status(500).json({
      error: "Failed to fetch company profile",
      details: error.message,
    });
  }
};

exports.getCompanyQuote = async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol parameter is required." });
  }

  try {
    const data = await callFmpApi(`/quote/${encodeURIComponent(symbol)}`);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Company quote not found." });
    }

    const quote = data[0];

    res.json({
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      changesPercentage: quote.changesPercentage,
      change: quote.change,
      dayLow: quote.dayLow,
      dayHigh: quote.dayHigh,
      yearHigh: quote.yearHigh,
      yearLow: quote.yearLow,
      volume: quote.volume,
      avgVolume: quote.avgVolume,
      previousClose: quote.previousClose,
      open: quote.open,
      exchange: quote.exchange,
      timestamp: quote.timestamp,
    });
  } catch (error) {
    console.error("Error fetching company quote:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch company quote", details: error.message });
  }
};

exports.getKeyMetrics = async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol parameter is required." });
  }

  try {
    const data = await callFmpApi(
      `/key-metrics-ttm/${encodeURIComponent(symbol)}`
    );

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Key metrics not found." });
    }

    const metrics = data[0];

    res.json({
      marketCap: metrics.marketCap,
      peRatio: metrics.peRatio,
      pbRatio: metrics.pbRatio,
      eps: metrics.eps,
      roe: metrics.roe,
      roa: metrics.roa,
      profitMargin: metrics.netProfitMarginTTM,
      operatingMargin: metrics.operatingProfitMarginTTM,
      currentRatio: metrics.currentRatioTTM,
      debtToEquity: metrics.debtToEquityTTM,
      dividendYield: metrics.dividendYieldTTM,
    });
  } catch (error) {
    console.error("Error fetching key metrics:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch key metrics", details: error.message });
  }
};

exports.getHistoricalChart = async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol parameter is required." });
  }

  try {
    const data = await callFmpApi(
      `/historical-price-full/${symbol}?serietype=line&timeseries=360`
    );

    if (!data.historical || data.historical.length === 0) {
      return res.status(404).json({ error: "No historical data found." });
    }

    const chartData = data.historical.map((entry) => ({
      date: entry.date,
      close: entry.close,
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Error in getHistoricalChart:", error.message);
    res.status(500).json({
      error: "Failed to fetch historical chart data",
      details: error.message,
    });
  }
};
