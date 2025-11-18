const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const newsRoutes = require("./routes/newsRoutes");
const fmpRoutes = require("./routes/fmpRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const chatRoutes = require("./routes/chatRoutes");
//const recommendRoutes = require("./routes/recommendRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Logging only in development
if (process.env.NODE_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// Dynamic CORS origin for dev/prod

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // your production frontend URL like https://your-frontend.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman or mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// Body parser
app.use(express.json());

// Routes
app.use("/api", newsRoutes);
app.use("/api", fmpRoutes);
app.use("/api", watchlistRoutes);
app.use("/api/chat", chatRoutes);
//app.use("/api/recommend", recommendRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
