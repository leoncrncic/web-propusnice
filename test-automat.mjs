import { getToken, issuePass } from "./dist/task2/automat.js";

// Pokretanje: node --env-file=.env test-automat.mjs
// M2M tajne ostaju u lokalnom .env, nikad u GitHub repozitoriju.
for (const key of ["ISSUER_BASE_URL", "API_AUDIENCE", "M2M_CLIENT_ID", "M2M_CLIENT_SECRET"]) {
  if (!process.env[key]) throw new Error(`Nedostaje varijabla ${key} u .env`);
}

const token = await getToken(
  process.env.ISSUER_BASE_URL,
  process.env.API_AUDIENCE,
  process.env.M2M_CLIENT_ID,
  process.env.M2M_CLIENT_SECRET,
  "create:passes"
);
console.log("Token uspješno dobiven!");

await issuePass(
  new URL("/passes", process.env.API_BASE_URL || "https://web-propusnice.onrender.com").href,
  token,
  "Automatski test Render",
  "RENDER-001"
);
console.log("Propusnica izdana i QR kod spremljen!");
