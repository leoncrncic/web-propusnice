import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Pozdrav iz aplikacije za propusnice!");
});

app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});
