const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const questionRoutes = require("./routes/questions");

const app = express();
const port = 3000;

app.listen(3000, () => {}); // ✅
// Middleware
app.use(bodyParser.json());
app.use();
const corsOptions = {
  origin: [
    "https://doci-git.github.io/Welcome-Book-MusArt/",
    "http://localhost:5500",
  ], // Frontend su Live Server (5500)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // ✅

// Connessione a MongoDB
mongoose
  .connect("mongodb://localhost:27017/chatbot", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connesso a MongoDB"))
  .catch((err) => console.error("❌ Errore MongoDB:", err));

// Rotta principale
app.get("/", (req, res) => {
  res.send("Server attivo!");
});

// Collegamento delle rotte
app.use("/api/questions", questionRoutes);

// Avvia il server
app.listen(port, () => {
  console.log(`🚀 Server in ascolto su http://localhost:${port}`);
});
app.use(
  cors({
    origin: "http://localhost:5500", // Porta del live server del frontend
    methods: ["GET", "POST"], // Abilita POST
  })
);
