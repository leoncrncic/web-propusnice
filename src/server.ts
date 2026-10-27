
import express from "express";
import { pool } from "./database.js";
import { getPassById } from "./passes.js";
import { isValidUuid } from "./validation.js";
import path from "node:path";


const app = express();
const PORT = 3000;


app.set("view engine", "pug");
app.set("views", path.resolve("views"));


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

    res.render("home", { total, active });

  } catch (error) {
    console.error("Greška pri dohvaćanju statistike:", error);
    res.status(500).send("Greška na serveru.");
  }
});



app.get("/info/:id", async (req, res) => {
  const id = req.params.id;

  if (typeof id !== "string" || !isValidUuid(id)) {
    res.status(404).send("Propusnica ne postoji.");
    return;
  }

  try {
    const pass = await getPassById(id);

    if (pass === null) {
      res.status(404).send("Propusnica ne postoji.");
      return;
    }

    res.render("pass", { pass });

  } catch (error) {
    console.error("Greška pri dohvaćanju propusnice:", error);
    res.status(500).send("Greška na serveru.");
  }
});


app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});
