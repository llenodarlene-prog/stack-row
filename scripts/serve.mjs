import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

await import('./build.mjs');
const root = path.resolve('dist');
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    let target = path.join(root, pathname.replace(/^\//, ''));
    if (pathname.endsWith('/')) target = path.join(target, 'index.html');
    else if (!(await stat(target).catch(() => null))) target = path.join(target, 'index.html');
    if (!target.startsWith(root)) throw new Error('unsafe path');
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, () => console.log(`Preview: http://localhost:${port}`));
