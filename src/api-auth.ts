import type { RequestHandler } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const issuer = process.env.ISSUER_BASE_URL;
const audience = process.env.API_AUDIENCE;

if (!issuer || !audience) {
  throw new Error("Nedostaje ISSUER_BASE_URL ili API_AUDIENCE");
}

const issuerUrl = new URL(issuer.endsWith("/") ? issuer : issuer + "/");

const JWKS = createRemoteJWKSet(
  new URL(".well-known/jwks.json", issuerUrl)
);

export function requireScope(scope: string): RequestHandler {
  return async (req, res, next) => {
    const authorization = req.get("Authorization");

    if (!authorization || !/^Bearer \S+$/i.test(authorization)) {
      res.sendStatus(401);
      return;
    }

    const token = authorization.replace(/^Bearer\s+/i, "");

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: issuerUrl.href,
        audience,
        algorithms: ["RS256"]
      });

      const scopes =
        typeof payload.scope === "string"
          ? payload.scope.split(" ")
          : [];

      if (!scopes.includes(scope)) {
        res.sendStatus(403);
        return;
      }

      next();
    } catch (error) {
      console.error("Nevaljan pristupni token:", error);
      res.sendStatus(401);
    }
  };
}
