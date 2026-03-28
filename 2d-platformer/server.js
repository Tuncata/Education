const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const db = require("./database");

// Parse JSON request bodies (must be BEFORE routes)
app.use(express.json());

// Serve game files
app.use(express.static("."));

// Connect routes
const authRoutes = require("./routes/auth");
const scoreRoutes = require("./routes/scores");
app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);

// Test route
app.get("/api/hello", (req, res) => {
    res.json({ message: "Server is working!" });
});

// Wait for database to initialize, then start server
db.init().then(() => {
    app.listen(PORT, () => {
        console.log("Server running at http://localhost:" + PORT);
    });
});
