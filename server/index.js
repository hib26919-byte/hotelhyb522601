// server/index.js
require("dotenv").config();

const cors    = require("cors");
const express = require("express");
const paymentRoutes = require("./routes/payment");
const webhookRoutes = require("./routes/webhook");

const app  = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);

// PayU sends webhook callbacks as application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "bael-tree-hotels-server" });
});

app.use("/api/payment", paymentRoutes);
app.use("/api/webhook", webhookRoutes);

app.use((error, _request, response, _next) => {
  response.status(500).json({ message: error.message || "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`Bael Tree Hotels server running on port ${port}`);
});