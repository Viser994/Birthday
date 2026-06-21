#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

console.log("\n=== Brampton SafeTurn — Doctor ===\n");
console.log("Platform:", process.platform);
console.log("Node:", process.version);
console.log("Folder:", root);

const checks = [
  { name: "package.json", ok: fs.existsSync(path.join(root, "package.json")) },
  { name: "node_modules", ok: fs.existsSync(path.join(root, "node_modules")) },
  { name: ".env.local", ok: fs.existsSync(path.join(root, ".env.local")) },
];

for (const c of checks) {
  console.log(c.ok ? "✓" : "✗", c.name);
}

if (!checks[1].ok) {
  console.log("\nFix: run  npm install  inside brampton-safeturn\n");
  process.exit(1);
}

let port = 3000;
for (let p = 3000; p <= 3010; p++) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${p}`, { encoding: "utf8" });
      if (!out.includes("LISTENING")) {
        port = p;
        break;
      }
    } else {
      execSync(`ss -tln | grep :${p} `, { stdio: "ignore" });
    }
  } catch {
    port = p;
    break;
  }
}

console.log("\nRecommended URL: http://localhost:" + port);
console.log("\nTo start the app:");
if (process.platform === "win32") {
  console.log("  Double-click: scripts\\start.bat");
  console.log("  Or run: npm run dev");
} else {
  console.log("  npm run dev");
}
console.log("\nIMPORTANT: localhost only works on YOUR computer");
console.log("after YOU start the server. It is not a public link.\n");
