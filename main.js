const http = require('http');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'server address')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache path');

program.parse(process.argv);
const options = program.opts();

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Server is running');
});

server.listen(options.port, options.host, () => {
  console.log(`Server is running on http://${options.host}:${options.port}`);
});
