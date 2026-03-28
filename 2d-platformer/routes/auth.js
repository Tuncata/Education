const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../database");

const router = express.Router();

// Register a new user
router.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Check if fields are provided
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Check if username already exists
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        return res.status(400).json({ error: "Username already taken" });
    }

    // Hash the password and save the user
    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, password_hash);

    res.json({ message: "Account created!", userId: result.lastInsertRowid });
});

// Login
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Find the user
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) {
        return res.status(400).json({ error: "Invalid username or password" });
    }

    // Compare password with hash
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
        return res.status(400).json({ error: "Invalid username or password" });
    }

    res.json({ message: "Login successful!", userId: user.id, username: user.username });
});

module.exports = router;