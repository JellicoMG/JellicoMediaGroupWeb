import { createServer } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { addEvent, importEvents, listEvents, removeEvent, updateEvent } from "./lib/events.js";
import { getFeed } from "./lib/feeds.js";
import { notFound, resolve as resolvePage } from "./lib/pages.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = resolve(root, "public");
const port = Number(process.env.PORT) || 4317;
const sessions = new Map();

function loadEnvFile() {
  try {
    const text = readFileSync(join(root, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      if (!process.env[key]) process.env[key] = match[2].trim();
    }
  } catch {
    // Render sets environment variables directly.
  }
}

loadEnvFile();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function publicFile(urlPath) {
  const requested = decodeURIComponent(urlPath.split("?")[0]);
  const full = resolve(publicDir, `.${requested}`);
  const safeRoot = publicDir.endsWith(sep) ? publicDir : publicDir + sep;
  if (full !== publicDir && !full.startsWith(safeRoot)) return null;
  return full;
}

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 200_000) {
        reject(new Error("That event is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function readCookies(req) {
  const header = req.headers.cookie || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

function isAdmin(req) {
  const token = readCookies(req).jmg_admin;
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return false;
  }
  return true;
}

function passwordMatches(input) {
  const expected = process.env.JMG_ADMIN_PASSWORD || "";
  const given = Buffer.from(String(input || ""));
  const actual = Buffer.from(expected);
  if (!expected || given.length !== actual.length) return false;
  return timingSafeEqual(given, actual);
}

function adminCookie(token, req) {
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  const value = token ? `${encodeURIComponent(token)}; Max-Age=604800` : "; Max-Age=0";
  return `jmg_admin=${value}; HttpOnly; SameSite=Lax; Path=/${secure}`;
}

async function sendEvents(res) {
  const events = await listEvents();
  send(res, 200, JSON.stringify({ events }), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
  });
}

function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  send(res, 401, JSON.stringify({ error: "Sign in to change the calendar." }), {
    "Content-Type": "application/json; charset=utf-8",
  });
  return false;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/session" && req.method === "GET") {
      send(res, 200, JSON.stringify({ admin: isAdmin(req) }), {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      return;
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      const input = JSON.parse(await readBody(req) || "{}");
      if (!passwordMatches(input.password)) {
        send(res, 401, JSON.stringify({ error: "That password is not right." }), {
          "Content-Type": "application/json; charset=utf-8",
        });
        return;
      }
      const token = randomBytes(32).toString("hex");
      sessions.set(token, { expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      send(res, 200, JSON.stringify({ admin: true }), {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": adminCookie(token, req),
        "Cache-Control": "no-cache",
      });
      return;
    }

    if (url.pathname === "/api/logout" && req.method === "POST") {
      const token = readCookies(req).jmg_admin;
      if (token) sessions.delete(token);
      send(res, 200, JSON.stringify({ admin: false }), {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": adminCookie("", req),
      });
      return;
    }

    if (url.pathname === "/api/events" && req.method === "GET") {
      await sendEvents(res);
      return;
    }

    if (url.pathname === "/api/events/import" && req.method === "POST") {
      if (!requireAdmin(req, res)) return;
      const input = JSON.parse(await readBody(req) || "{}");
      try {
        const result = await importEvents(input.csv);
        send(res, 200, JSON.stringify({
          events: result.events,
          added: result.added,
          updated: result.updated,
        }), {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache",
        });
      } catch (error) {
        send(res, 400, JSON.stringify({ error: error.message || "Could not read that CSV." }), {
          "Content-Type": "application/json; charset=utf-8",
        });
      }
      return;
    }

    if ((url.pathname === "/api/events" || url.pathname === "/api/events/update" || url.pathname === "/api/events/delete") && req.method === "POST") {
      if (!requireAdmin(req, res)) return;
      const input = JSON.parse(await readBody(req) || "{}");
      try {
        if (url.pathname === "/api/events") await addEvent(input);
        else if (url.pathname === "/api/events/update") await updateEvent(input.id, input);
        else await removeEvent(input.id);
      } catch (error) {
        send(res, 400, JSON.stringify({ error: error.message || "Could not update the calendar." }), {
          "Content-Type": "application/json; charset=utf-8",
        });
        return;
      }
      await sendEvents(res);
      return;
    }

    if (url.pathname === "/api/feed") {
      const feed = await getFeed();
      send(res, 200, JSON.stringify(feed), {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      });
      return;
    }

    const filePath = publicFile(url.pathname);
    if (filePath && extname(filePath)) {
      try {
        const file = await readFile(filePath);
        const extension = extname(filePath);
        send(res, 200, file, {
          "Content-Type": types[extension] || "application/octet-stream",
          "Cache-Control": extension === ".css" || extension === ".js" ? "no-cache" : "public, max-age=86400",
        });
        return;
      } catch {
        // Fall through to HTML routes when the file is not on disk.
      }
    }

    const pathname = normalize(url.pathname).replace(/\\/g, "/").replace(/\/$/, "") || "/";
    const html = resolvePage(pathname) || notFound();
    send(res, resolvePage(pathname) ? 200 : 404, html, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
  } catch (error) {
    console.error(error);
    send(res, 500, "Something went wrong.", { "Content-Type": "text/plain; charset=utf-8" });
  }
});

server.listen(port, () => {
  console.log(`Jellico Media Group site listening on ${port}`);
});
