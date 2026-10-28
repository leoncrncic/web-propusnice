
import express from "express";
import { pool } from "./database.js";
import { getPassById } from "./passes.js";
import { isValidUuid } from "./validation.js";
import path from "node:path";
import { authMiddleware, requiresAuth } from "./auth.js";


const app = express();
const PORT = 3000;


app.set("view engine", "pug");
app.set("views", path.resolve("views"));
app.use(authMiddleware);


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

    
    res.render("home", {
      total,
      active,
      isAuthenticated: req.oidc.isAuthenticated(),
      user: req.oidc.user
    });


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


app.post("/logout", (req, res) => {
  res.oidc.logout({
    returnTo: process.env.BASE_URL
  });
});


app.get("/profile", requiresAuth(), (req, res) => {
  const user = req.oidc.user;

  res.render("profile", { user });
});


app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});
