
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./db");

const authRoutes = require("./routes/authRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
    res.send("LocalServe MySQL API is running");
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
        process.exit(1);
    }
}

startServer();

