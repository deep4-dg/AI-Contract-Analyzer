const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const contractRoutes = require("./routes/contractRoutes");
const adminRoutes = require("./routes/adminRoute");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/auth", authRoutes);
app.use("/contracts", contractRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "AI Contract Analyzer Backend Running",
    status: "OK"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});