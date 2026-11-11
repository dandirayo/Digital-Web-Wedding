import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DEMO_ASSETS, LEGACY_DEMO_ASSETS, resolveDemoAssetUrl } from "../src/lib/demo-assets.mjs";

test("bundled demo images and legacy replacements resolve to real public files", () => {
  for (const url of Object.values(DEMO_ASSETS)) {
    assert.equal(existsSync(resolve("public", url.slice(1))), true, url);
  }
  for (const [oldUrl, replacement] of Object.entries(LEGACY_DEMO_ASSETS)) {
    assert.equal(resolveDemoAssetUrl(oldUrl), replacement);
    assert.equal(existsSync(resolve("public", replacement.slice(1))), true, oldUrl);
  }
});

test("custom and empty photo URLs are preserved", () => {
  for (const url of ["", "/uploads/custom-bride.jpg", "https://images.example.test/bride.jpg", "__proto__"]) {
    assert.equal(resolveDemoAssetUrl(url), url);
  }
});
