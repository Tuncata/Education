const express = require("express");
const db = require("../database");

const router = express.Router();

// Save a score
router.post("/save", (req, res) => {
    const { userId, score, levelReached } = req.body;

    if (!userId || score === undefined || !levelReached) {
        return res.status(400).json({ error: "userId, score, and levelReached are required" });
    }

    // Check user exists
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    db.prepare("INSERT INTO scores (user_id, score, level_reached) VALUES (?, ?, ?)").run(userId, score, levelReached);

    res.json({ message: "Score saved!" });
});

// Get top 10 rankings
router.get("/ranking", (req, res) => {
    const rankings = db.prepare(`
        SELECT users.username, scores.score, scores.level_reached, scores.created_at
        FROM scores
        JOIN users ON users.id = scores.user_id
        ORDER BY scores.score DESC
        LIMIT 10
    `).all();

    res.json(rankings);
});

// Get scores for a specific user
router.get("/user/:userId", (req, res) => {
    const scores = db.prepare(`
        SELECT score, level_reached, created_at
        FROM scores
        WHERE user_id = ?
        ORDER BY score DESC
    `).all(req.params.userId);

    res.json(scores);
});

module.exports = router;