import { writeFile } from "node:fs/promises";

// Dohvaća OAuth2 pristupni token.
export async function getToken(
  authority: string,
  audience: string,
  clientId: string,
  clientSecret: string,
  scope: string
): Promise<string> {

  const tokenUrl = new URL(
    "/oauth/token",
    authority.endsWith("/") ? authority : authority + "/"
  );

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      scope
    })
  });

  if (!response.ok) {
    throw new Error(
      `Dohvaćanje tokena nije uspjelo: HTTP ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string"
  ) {
    throw new Error("Auth0 nije vratio valjani access_token.");
  }

  return data.access_token;
}


// Izdaje propusnicu i sprema QR kod kao UUID.png.
export async function issuePass(
  url: string,
  token: string,
  name: string,
  document: string
): Promise<void> {

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      document
    })
  });

  if (!response.ok) {
    throw new Error(
      `Izdavanje propusnice nije uspjelo: HTTP ${response.status}`
    );
  }

  const location = response.headers.get("Location");

  if (!location) {
    throw new Error("Odgovor ne sadrži Location zaglavlje.");
  }

  const locationUrl = new URL(location, url);
  const id = locationUrl.pathname.split("/").pop();

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new Error("Location ne sadrži valjani UUID.");
  }

  const contentType = response.headers.get("Content-Type");

  if (!contentType?.toLowerCase().startsWith("image/png")) {
    throw new Error("API nije vratio PNG sliku.");
  }

  const image = Buffer.from(await response.arrayBuffer());

  await writeFile(`${id}.png`, image);
}
