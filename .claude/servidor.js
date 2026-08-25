const http = require("http");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const PUERTO = 4173;
const TIPOS = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".webmanifest":"application/manifest+json", ".png":"image/png", ".jpg":"image/jpeg",
  ".svg":"image/svg+xml", ".ico":"image/x-icon", ".woff2":"font/woff2"
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  if (rel === "/config.js") {
    res.writeHead(200, {"content-type":"text/javascript; charset=utf-8","cache-control":"no-store"});
    res.end('window.APP_CONFIG = { url:"", key:"" };');
    return;
  }
  if (rel === "/sw.js") { res.writeHead(404).end("sin service worker en desarrollo"); return; }
  const file = path.join(RAIZ, rel);
  if (!file.startsWith(RAIZ)) { res.writeHead(403).end("no"); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, {"content-type":"text/plain"}).end("404 " + rel); return; }
    res.writeHead(200, {"content-type": TIPOS[path.extname(file)] || "application/octet-stream",
                        "cache-control": "no-store"});
    res.end(buf);
  });
}).listen(PUERTO, () => console.log("Fractale en http://localhost:" + PUERTO));
