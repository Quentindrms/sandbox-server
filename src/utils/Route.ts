import { readFile, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";

interface Route {
    filePath?: string;
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
    },
    {
        filePath: "",
        url: "/",
        method: "POST",
        contentType: "application/json",
    },
    {
        filePath: "/data/fake.json",
        contentType: "application/json",
        url: "/data",
        method: "GET",
    },
    {
        contentType: "application/json",
        url: "/test",
        method: "GET",
    }
];

/**
 * Take the request object and find statics files, load them and return them with the right content type 
 * @param request IncomingMessage object 
 * @param response ServerResponse object 
 * @returns Promise boolean
 */

async function serveStaticFile(
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
/**
 * Check if the the current URL is part of the route array, if not serve static file or throw an error to the client 
 * @param request 
 * @param response 
 * @returns 
 */

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

/**
 * 
 * @param request 
 * @param response 
 * @param route 
 */

/** 
 * TODO: Modifier la méthode pour ne servir que des fichiers se trouvant côté serveur et plus côté client
 */

async function get(
    request: IncomingMessage,
    response: ServerResponse,
    route: Route,
) {
    try {
        response.setHeader("Content-Type", route.contentType);
        request.statusCode = 200;

        if (route.filePath) {
            const data = await readFile(
                join(import.meta.dirname, `../../public/${route.filePath}`),
                "utf8",
            );
            response.end(data);
        }
        response.end("ok");
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
) {
    const chunks: Buffer[] = []
    request.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
    })
    request.on("end", () => {
        try {
            const body = Buffer.concat(chunks).toString("utf-8");
            if (!body) {
                response.end()
                return;
            };
            console.log(body)
            const parsed = JSON.parse(body);
            response.setHeader("Content-Type", "application/json")
            response.end(JSON.stringify(parsed));
        } catch (error) {
            if (error instanceof Error) {
                console.trace(error.message)
                response.end("An error as occured")
            }
        }

    })
}
