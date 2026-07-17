import type { IncomingMessage, ServerResponse } from "node:http";

export default function testMiddleware(request: IncomingMessage, response: ServerResponse) {
    const socket = request.socket;
    console.log(socket.remoteAddress);
    return
}