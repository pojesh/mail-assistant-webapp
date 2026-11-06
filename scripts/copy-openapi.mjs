// Copy the server's OpenAPI schema into this repo (step 1 of `pnpm gen:api`).
// OPENAPI_SOURCE can be a path (default: the server repo next to this one) or a URL.
import { readFile, writeFile } from "node:fs/promises";

const source = process.env.OPENAPI_SOURCE ?? "../mail-assistant-server/openapi.json";

async function readSchema() {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not download ${source}: HTTP ${response.status}`);
    return await response.text();
  }
  return await readFile(source, "utf8");
}

const text = await readSchema();
JSON.parse(text); // fail early on a broken file
await writeFile("openapi.json", text.endsWith("\n") ? text : `${text}\n`);
console.log(`Copied OpenAPI schema from ${source}`);
