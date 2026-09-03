import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const root = new URL(".", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidate = normalize(join(root, relative));
  if (!candidate.startsWith(root)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const info = await stat(candidate);
    const file = info.isDirectory() ? join(candidate, "index.html") : candidate;
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(port, () => console.log(`Bridge Studio running at http://localhost:${port}`));
