import { Router } from "express";
import { pool } from "./database.js";
import { requiresAuth } from "./auth.js";
import { isValidUuid } from "./validation.js";

export const adminRouter = Router();

// Sve rute u ovom routeru zahtijevaju prijavu.
adminRouter.use(requiresAuth());

// Zaštita obrazaca koji mijenjaju podatke.
adminRouter.use((req, res, next) => {
  if (req.method !== "POST") {
    return next();
  }

  const expectedOrigin = new URL(
    process.env.BASE_URL!
  ).origin;

  if (req.get("origin") !== expectedOrigin) {
    return res.sendStatus(403);
  }

  next();
});

// Prikaz svih propusnica.
adminRouter.get("/passes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, document, issued_at, status
      FROM passes
      ORDER BY issued_at DESC
    `);

    res.render("admin-passes", {
      passes: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Greška pri dohvaćanju propusnica.");
  }
});

// Poništavanje propusnice.
adminRouter.post("/passes/:id/cancel", async (req, res) => {
  const id = req.params.id;

  if (typeof id !== "string" || !isValidUuid(id)) {
    return res.sendStatus(404);
  }

  try {
    const result = await pool.query(
      `UPDATE passes
       SET status = 'CANCELLED'
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.sendStatus(404);
    }

    res.redirect(303, "/admin/passes");
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Trajno brisanje propusnice.
adminRouter.post("/passes/:id/delete", async (req, res) => {
  const id = req.params.id;

  if (typeof id !== "string" || !isValidUuid(id)) {
    return res.sendStatus(404);
  }

  try {
    const result = await pool.query(
      `DELETE FROM passes
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.sendStatus(404);
    }

    res.redirect(303, "/admin/passes");
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
