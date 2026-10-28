import { Router } from "express";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";

import { pool } from "./database.js";
import { getPassById } from "./passes.js";
import { isValidUuid } from "./validation.js";
import { requireScope } from "./api-auth.js";

export const apiRouter = Router();

// GET /passes/:id
apiRouter.get(
  "/passes/:id",
  requireScope("read:passes"),
  async (req, res) => {
    const id = req.params.id;

    if (typeof id !== "string" || !isValidUuid(id)) {
      res.sendStatus(404);
      return;
    }

    try {
      const pass = await getPassById(id);

      if (!pass) {
        res.sendStatus(404);
        return;
      }

      res.json({
        id: pass.id,
        name: pass.name,
        document: pass.document,
        issuedAt: pass.issuedAt,
        status: pass.status
      });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  }
);

// POST /passes
apiRouter.post(
  "/passes",
  requireScope("create:passes"),
  async (req, res) => {
    const { name, document } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof document !== "string" ||
      !name.trim() ||
      !document.trim()
    ) {
      res.status(400).json({
        error: "Name i document su obavezni neprazni stringovi."
      });
      return;
    }

    const id = randomUUID();

    const publicUrl =
      new URL(`/info/${id}`, process.env.BASE_URL).href;

    const apiUrl =
      new URL(`/passes/${id}`, process.env.BASE_URL).href;

    try {
      const qr = await QRCode.toBuffer(publicUrl, {
        type: "png"
      });

      await pool.query(
        `INSERT INTO passes (id, name, document)
         VALUES ($1, $2, $3)`,
        [id, name.trim(), document.trim()]
      );

      res.status(201);
      res.set("Location", apiUrl);
      res.type("png");
      res.send(qr);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  }
);
