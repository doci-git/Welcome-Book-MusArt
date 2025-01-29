const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const questionRoutes = require("./routes/questions");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "https://doci-git.github.io/Welcome-Book-MusArt/", // URL del frontend
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Temporaneamente permette tutte le origini
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Connessione a MongoDB
mongoose
  .connect("mongodb://localhost:27017/chatbot", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connesso a MongoDB"))
  .catch((err) => console.error("Errore di connessione:", err));

// Rotte
app.use("/api/questions", questionRoutes);

// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
