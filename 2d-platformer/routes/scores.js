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

// Get top 10 rankings (only highest score per player)
router.get("/ranking", (req, res) => {
    const rankings = db.prepare(`
        SELECT u.username, s.score, s.level_reached
        FROM scores s
        JOIN users u ON u.id = s.user_id
        WHERE s.score = (
            SELECT MAX(s2.score) FROM scores s2 WHERE s2.user_id = s.user_id
        )
        GROUP BY s.user_id
        ORDER BY s.score DESC
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