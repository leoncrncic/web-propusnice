import { getToken, issuePass } from "./dist/task2/automat.js";

const token = await getToken(
  "https://dev-thsvhin1wbx430fa.eu.auth0.com",
  "https://web-propusnice-api",
  process.env.CLIENT_ID_M2M,
  process.env.CLIENT_SECRET_M2M,
  "create:passes"
);

await issuePass(
  "http://localhost:3000/passes",
  token,
  "Automatski test",
  "AUTO-123"
);

console.log("Propusnica izdana, QR kod spremljen!");
