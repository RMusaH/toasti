// Toasti server: serves index.html (and lite.html at /lite) and stores the data in data.json. Run: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/data' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!Array.isArray(data.people) || 'days' in data) throw 0; // 'days' = a tab still running the old page
      } catch {
        res.writeHead(400);
        return res.end();
      }
      fs.writeFileSync(FILE + '.tmp', body); // write-then-rename so a crash can't leave half a file
      fs.renameSync(FILE + '.tmp', FILE);
      res.end();
    });
  } else if (url === '/data') {
    // x-version = when a page last changed; open pages reload themselves when it does
    const version = Math.max(...['index.html', 'lite.html'].map(f => fs.statSync(path.join(__dirname, f)).mtimeMs));
    res.writeHead(200, { 'content-type': 'application/json', 'x-version': version });
    res.end(fs.existsSync(FILE) ? fs.readFileSync(FILE) : '{}');
  } else if (url === '/capisoft-logo.png') {
    const logo = path.join(__dirname, 'capisoft-logo.png'); // gitignored, so a fresh clone has none
    if (!fs.existsSync(logo)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'content-type': 'image/png' });
    res.end(fs.readFileSync(logo));
  } else if (url === '/lite') { // for slow or old TV browsers
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'lite.html')));
  } else {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
}).listen(PORT, () => console.log(`Toasti on http://localhost:${PORT}  (edit: /#edit)`));
