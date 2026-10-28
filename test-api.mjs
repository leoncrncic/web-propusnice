// Pokretanje: node --env-file=.env test-api.mjs
// Test ne otkriva tokene i ne stvara / brise propusnice.
import { getToken } from "./dist/task2/automat.js";

const base = process.env.API_BASE_URL || "https://web-propusnice.onrender.com";
for (const key of ["ISSUER_BASE_URL", "API_AUDIENCE", "M2M_CLIENT_ID", "M2M_CLIENT_SECRET"]) {
  if (!process.env[key]) throw new Error(`Nedostaje ${key} u .env`);
}
const uuid = "00000000-0000-4000-8000-000000000001";
let failed = 0;
let skipped = 0;

async function check(label, expected, path, options = {}) {
  const response = await fetch(new URL(path, base), { redirect: "manual", ...options });
  const ok = response.status === expected;
  console.log(`${ok ? "OK" : "GRESKA"} ${label}: HTTP ${response.status} (ocekivano ${expected})`);
  if (!ok) failed++;
}

function scopesIn(token) {
  const part = token.split(".")[1];
  if (!part) throw new Error("Pristupni token nije JWT");
  const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  return typeof payload.scope === "string" ? payload.scope.split(/\s+/).filter(Boolean) : [];
}

const createToken = await getToken(
  process.env.ISSUER_BASE_URL, process.env.API_AUDIENCE,
  process.env.M2M_CLIENT_ID, process.env.M2M_CLIENT_SECRET, "create:passes"
);
const readToken = await getToken(
  process.env.ISSUER_BASE_URL, process.env.API_AUDIENCE,
  process.env.M2M_CLIENT_ID, process.env.M2M_CLIENT_SECRET, "read:passes"
);
const createScopes = scopesIn(createToken);
const readScopes = scopesIn(readToken);
console.log("Dozvole tokena za create zahtjev:", createScopes.join(", ") || "(nema)");
console.log("Dozvole tokena za read zahtjev:", readScopes.join(", ") || "(nema)");
// Ovo je samo citanje JWT claimova radi dijagnostike, NE zamjena za serverovu provjeru potpisa.
await check("GET bez tokena", 401, `/passes/${uuid}`);
await check("POST bez tokena", 401, "/passes", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "X", document: "Y" })
});
if (!createScopes.includes("create:passes")) {
  console.log("PRESKOCENO POST validacija: token nema create:passes"); skipped++;
} else {
  await check("POST bez dokumenta", 400, "/passes", {
    method: "POST", headers: { authorization: `Bearer ${createToken}`, "content-type": "application/json" },
    body: JSON.stringify({ name: "X" })
  });
}
if (createScopes.includes("read:passes")) {
  console.log("PRESKOCENO GET bez read:passes: Auth0 je tokenu dodijelio read:passes"); skipped++;
} else {
  await check("GET bez read:passes", 403, `/passes/${uuid}`, {
    headers: { authorization: `Bearer ${createToken}` }
  });
}
if (readScopes.includes("create:passes")) {
  console.log("PRESKOCENO POST bez create:passes: Auth0 je tokenu dodijelio create:passes"); skipped++;
} else {
  await check("POST bez create:passes", 403, "/passes", {
    method: "POST", headers: { authorization: `Bearer ${readToken}`, "content-type": "application/json" },
    body: JSON.stringify({ name: "X", document: "Y" })
  });
}
if (readScopes.includes("read:passes")) {
  await check("GET nepostojece propusnice", 404, `/passes/${uuid}`, {
    headers: { authorization: `Bearer ${readToken}` }
  });
} else {
  console.log("PRESKOCENO GET nepostojece propusnice: nema read:passes"); skipped++;
}
await check("Javna stranica nepostojece propusnice", 404, `/info/${uuid}`);
console.log(`Rezultat: ${failed} gresaka, ${skipped} preskocenih testova.`);
if (skipped) console.log("Za pravi 403 test koristi zasebnu M2M aplikaciju s jednom dodijeljenom dozvolom.");
if (failed) process.exitCode = 1;
