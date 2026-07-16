import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";

interface Route {
    filePath: string;
    url: string;
    method: "GET" | "POST";
    contentType: "text/html" | "text/plain" | "text/css" | "text/javascript" | "application/json";
    middleware?: (request: IncomingMessage, response: ServerResponse) => void | boolean | Awaited<void> | Awaited<boolean>
}

const route: Route[] = [
    {
        filePath: "index.html",
        url: "/",
        method: "GET",
        contentType: "text/plain",
        middleware: () => console.log("Middleware is working")
    },
    {
        filePath: "/data/fake.json",
        contentType: "application/json",
        url: "/data",
        method: "GET",
    }
]

export async function router(request: IncomingMessage, response: ServerResponse) {
    const target = route.find((item) => item.method === request.method && item.url === request.url)
    if (target) {
        if (target.middleware) {
            target.middleware(request, response)
        }
        else if (target.method === "GET") {
            get(request, response, target)
        }
        else if (target.method === "POST") {
            post(request, response, target);
        }
    }
    else {
        response.statusCode = 404;
        const html = await readFile(join(import.meta.dirname, "../../public/errors/404.html"), "utf8");
        response.end(html)
    }
}

async function get(request: IncomingMessage, response: ServerResponse, route: Route) {
    try {
        const data = await readFile(join(import.meta.dirname, `../../public/${route.filePath}`), "utf8");
        response.setHeader("Content-Type", route.contentType);
        request.statusCode = 200;
        response.end(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            const html = await readFile(join(import.meta.dirname, `../../public/errors/500.html`), "utf8");
            response.statusCode = 500;
            response.end(html)
        }
    }
}

function post(request: IncomingMessage, response: ServerResponse, route: Route) { }