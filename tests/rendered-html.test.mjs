import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("ships the hardened application surface", async () => {
  const [layout, security, middleware, events, payments, uploads, packageJson] = await Promise.all([
    read("app/layout.tsx"), read("app/security.ts"), read("proxy.ts"), read("app/api/events/route.ts"), read("app/api/payments/order/route.ts"), read("app/api/uploads/route.ts"), read("package.json"),
  ]);
  assert.match(layout, /CookieConsent/);
  assert.match(layout, /EducationalOrganization/);
  assert.match(security, /rateLimit/);
  assert.match(security, /requireSameOrigin/);
  assert.match(middleware, /content-security-policy/);
  assert.match(events, /events\.status, "published"/);
  assert.match(payments, /event\.offerPrice/);
  assert.match(uploads, /validSignature/);
  assert.match(packageJson, /"next": "16\.2\.11"/);
});
