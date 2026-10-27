
import express from "express";
import { pool } from "./database.js";

const app = express();
const PORT = 3000;


app.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active
      FROM passes
    `);

    const total = Number(result.rows[0].total);
    const active = Number(result.rows[0].active);

    res.send(
      `Ukupno propusnica: ${total}, Aktivnih propusnica: ${active}`
    );
  } catch (error) {
    console.error("Greška pri dohvaćanju propusnica:", error);
    res.status(500).send("Greška na serveru.");
  }
});


app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});
