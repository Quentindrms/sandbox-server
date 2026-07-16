import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";

interface Route {
    filePath: string;
    url: string;
    method: "GET" | "POST";
    middleware?: (request: IncomingMessage, response: ServerResponse) => void | boolean | Awaited<void> | Awaited<boolean>
}

const route: Route[] = [
    {
        filePath: "index.html",
        url: "/",
        method: "GET",
        middleware: () => console.log("Middleware is working")
    },
    {
        filePath: "index.html",
        url: "/test",
        method: "GET",
    }
]

export async function router(request: IncomingMessage, response: ServerResponse) {
    response.setHeader("Content-Type", "text/html");
    const target = route.find((item) => item.method === request.method && item.url === request.url)
    if (target) {
        if (target.middleware) {
            target.middleware(request, response)
        }
        response.statusCode = 200;
        const html = await readFile(join(import.meta.dirname, `../../public/${target.filePath}`), "utf8")
        response.end(html)
    }
    else {
        response.statusCode = 404;
        const html = await readFile(join(import.meta.dirname, "../../public/errors/404.html"), "utf8");
        response.end(html)
    }
}