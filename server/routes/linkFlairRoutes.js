const express = require("express");
const router = express.Router();
const LinkFlair = require("../models/linkflairs");

router.post("/", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required." });
    }
    const newLinkFlair = await LinkFlair.create({ content });
    res.json(newLinkFlair);
  } catch (err) {
    console.error("Error creating community:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const allLinkFlairs = await LinkFlair.find().exec();
    res.json(allLinkFlairs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;