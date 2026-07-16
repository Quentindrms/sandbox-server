import { createServer } from "node:http";

const port = 3000;
const host = "127.0.0.1";

const server = createServer((request, response) => {
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.end("<h1>Hello world !</h1>");
});

server.listen(port, host);
