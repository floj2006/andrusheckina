const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const publicFiles = new Set(['index.html', 'styles.css', 'app.js', 'gallery.css', 'gallery.js', 'favicon.svg']);
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const target = path.resolve(root, relative);
  const photoRoot = path.join(root, 'photo anna') + path.sep;
  if (!(publicFiles.has(relative) || (target.startsWith(photoRoot) && path.extname(target).toLowerCase() === '.jpg'))) {
    res.writeHead(404); return res.end('Not found');
  }
  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Content-Length': stat.size, 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(target);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
});
server.listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => console.log('Anna website: http://localhost:' + server.address().port));
