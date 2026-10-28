// Zavrsni test API-ja: node --env-file=.env test-api.mjs
// Ne sprema i ne ispisuje tajne ili tokene i ne mijenja bazu podataka.
import { getToken } from "./dist/task2/automat.js";

const base = process.env.API_BASE_URL || "https://web-propusnice.onrender.com";
for (const key of ["ISSUER_BASE_URL", "API_AUDIENCE", "M2M_CLIENT_ID", "M2M_CLIENT_SECRET"]) {
  if (!process.env[key]) throw new Error(`Nedostaje ${key} u .env`);
}
const uuid = "00000000-0000-4000-8000-000000000001";
let failed = 0;
async function check(label, expected, path, options = {}) {
  const response = await fetch(new URL(path, base), { redirect: "manual", ...options });
  const ok = response.status === expected;
  console.log(`${ok ? "OK" : "GRESKA"} ${label}: HTTP ${response.status} (ocekivano ${expected})`);
  if (!ok) failed++;
}
const createToken = await getToken(
  process.env.ISSUER_BASE_URL, process.env.API_AUDIENCE,
  process.env.M2M_CLIENT_ID, process.env.M2M_CLIENT_SECRET, "create:passes"
);
const readToken = await getToken(
  process.env.ISSUER_BASE_URL, process.env.API_AUDIENCE,
  process.env.M2M_CLIENT_ID, process.env.M2M_CLIENT_SECRET, "read:passes"
);
await check("GET bez tokena", 401, `/passes/${uuid}`);
await check("POST bez tokena", 401, "/passes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "X", document: "Y" }) });
await check("POST bez dokumenta", 400, "/passes", { method: "POST", headers: { authorization: `Bearer ${createToken}`, "content-type": "application/json" }, body: JSON.stringify({ name: "X" }) });
await check("GET bez read:passes", 403, `/passes/${uuid}`, { headers: { authorization: `Bearer ${createToken}` } });
await check("POST bez create:passes", 403, "/passes", { method: "POST", headers: { authorization: `Bearer ${readToken}`, "content-type": "application/json" }, body: JSON.stringify({ name: "X", document: "Y" }) });
await check("GET nepostojece propusnice", 404, `/passes/${uuid}`, { headers: { authorization: `Bearer ${readToken}` } });
await check("Javna stranica nepostojece propusnice", 404, `/info/${uuid}`);
if (failed) process.exitCode = 1;
else console.log("Svi API testovi su prosli.");
