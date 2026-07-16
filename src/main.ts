import { createServer } from "node:http";
import { router } from "./utils/Route";

const port = 3000;
const host = "127.0.0.1";

const server = createServer((request, response) => {
    router(request, response)
});

server.listen(port, host);
