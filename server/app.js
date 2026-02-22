const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const apiRoutes = require("./routes/apiRoutes");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// 🔓 Allow requests from everywhere
app.use(cors());

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRoutes);

app.use((err, _, res, __) => {
  console.error(err);
  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ error: message });
});

module.exports = app;