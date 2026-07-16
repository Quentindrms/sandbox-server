import { readFile, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";

interface Route {
    filePath: string;
    url: string;
    method: "GET" | "POST";
    contentType:
    | "text/html"
    | "text/plain"
    | "text/css"
    | "text/javascript"
    | "application/json";
    middleware?: (
        request: IncomingMessage,
        response: ServerResponse,
    ) => void | boolean | Awaited<void> | Awaited<boolean>;
}

const publicDir = join(import.meta.dirname, "../../public");

const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
};

const route: Route[] = [
    {
        filePath: "index.html",
        url: "/",
        method: "GET",
        contentType: "text/html",
        middleware: () => console.log("Middleware is working"),
    },
    {
        filePath: "/data/fake.json",
        contentType: "application/json",
        url: "/data",
        method: "GET",
    },
];

export async function serveStaticFile(
    request: IncomingMessage,
    response: ServerResponse,
): Promise<boolean> {
    if (request.method !== "GET" || !request.url) return false;

    const urlPath = request.url.split("?")[0] ?? "/";
    const safePath = normalize(join(publicDir, urlPath));

    if (!safePath.startsWith(publicDir)) return false;

    try {
        const fileStat = await stat(safePath);
        if (!fileStat.isFile()) return false;

        const contentType = mimeTypes[extname(safePath)] ?? "application/octet-stream";
        const content = await readFile(safePath);

        response.setHeader("Content-Type", contentType);
        response.statusCode = 200;
        response.end(content);
        return true;
    } catch {
        return false;
    }
}

export async function router(
    request: IncomingMessage,
    response: ServerResponse,
) {
    const target = route.find(
        (item) => item.method === request.method && item.url === request.url,
    );

    if (target) {
        if (target.middleware) {
            target.middleware(request, response);
        }
        if (target.method === "POST") {
            post(request, response, target);
        } else {
            await get(request, response, target);
        }
        return;
    }

    const served = await serveStaticFile(request, response);
    if (served) return;

    response.statusCode = 404;
    const html = await readFile(
        join(import.meta.dirname, "../../public/errors/404.html"),
        "utf8",
    );
    response.end(html);
}

async function get(
    request: IncomingMessage,
    response: ServerResponse,
    route: Route,
) {
    try {
        const data = await readFile(
            join(import.meta.dirname, `../../public/${route.filePath}`),
            "utf8",
        );
        response.setHeader("Content-Type", route.contentType);
        request.statusCode = 200;
        response.end(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            const html = await readFile(
                join(import.meta.dirname, `../../public/errors/500.html`),
                "utf8",
            );
            response.statusCode = 500;
            response.end(html);
        }
    }
}

function post(
    request: IncomingMessage,
    response: ServerResponse,
    route: Route,
) { }
