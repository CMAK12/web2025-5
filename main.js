const http = require('http');
const { program } = require('commander');
const fs = require('fs/promises');
const path = require('path');
const superagent = require('superagent');

program
  .requiredOption('-h, --host <host>', 'server address')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory path');

program.parse(process.argv);
const options = program.opts();

fs.mkdir(options.cache, { recursive: true });

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1);
  const filePath = path.join(options.cache, `${code}.jpg`);

  if (!/^\d{3}$/.test(code)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid path');
  }

  switch (req.method) {
    case 'GET':
      try {
        const file = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(file);
      } catch {
        try {
          const response = await superagent
            .get(`https://http.cat/${code}`)
            .ok(res => res.status < 400)
            .buffer(true)
            .parse(superagent.parse.image);

          await fs.writeFile(filePath, response.body);

          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(response.body);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Image not found');
        }
      }
      break;

    case 'PUT':
      const buffers = [];
      req.on('data', chunk => buffers.push(chunk));
      req.on('end', async () => {
        try {
          const data = Buffer.concat(buffers);
          await fs.writeFile(filePath, data);
          res.writeHead(201, { 'Content-Type': 'text/plain' });
          res.end('Created');
        } catch (err) {
          res.writeHead(500);
          res.end('Internal server error');
        }
      });
      break;

    case 'DELETE':
      try {
        await fs.unlink(filePath);
        res.writeHead(200);
        res.end('Deleted');
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
      break;

    default:
      res.writeHead(405);
      res.end('Method not allowed');
  }
});


superagent.parse.image = (res, callback) => {
  const data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(data)));
};

server.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}`);
});
