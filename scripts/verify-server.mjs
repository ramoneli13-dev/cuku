import { spawn } from "node:child_process";

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3210"],
  { stdio: ["ignore", "pipe", "pipe"], env: process.env },
);

let logs = "";
server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
server.stderr.on("data", (chunk) => { logs += chunk.toString(); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:3210");
      if (response.ok) {
        const html = await response.text();
        if (!html.includes("Cúku") || !html.includes("Lo encontramos")) {
          throw new Error("La portada no contiene el contenido principal esperado.");
        }
        ready = true;
        break;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (!ready) throw new Error(`El servidor no quedó disponible.\n${logs}`);
  process.env.APP_URL = "http://127.0.0.1:3210";
  await import("./api-smoke.mjs");
} finally {
  server.kill("SIGTERM");
}
