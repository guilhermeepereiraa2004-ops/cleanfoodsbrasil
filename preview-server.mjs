import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const host = process.env.HOST || '127.0.0.1';
const preferredPort = Number(process.env.PORT) || 4173;
const maxPort = preferredPort + 20;
let port = preferredPort;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = createServer((request, response) => {
  const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, safePath === '/' ? 'index.html' : safePath);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(root, 'index.html');
  }
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(response);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && port < maxPort) {
    const occupiedPort = port;
    port += 1;
    console.warn(`Porta ${occupiedPort} ocupada. Tentando ${port}...`);
    server.listen(port, host);
    return;
  }

  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  const browserHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log('\nClean Foods Brasil esta rodando.');
  console.log(`Abra no navegador: http://${browserHost}:${port}\n`);
});
