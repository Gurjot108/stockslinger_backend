const express = require("express");
const router = express.Router();
const { getNews } = require("../controllers/newsController");

// Route: GET /api/news
router.get("/news", getNews);

module.exports = router;
