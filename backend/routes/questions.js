const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// Salva una domanda
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    const question = new Question({ text });
    await question.save();
    res.status(201).json({ message: "Domanda salvata" });
  } catch (error) {
    res.status(500).json({ error: "Errore del server" });
  }
});

// Recupera tutte le domande
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find().sort({ timestamp: -1 });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: "Errore del server" });
  }
});

module.exports = router;
