import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const filePath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "notice.json");

const empty = {
  active: false,
  title: "",
  message: "",
  linkLabel: "",
  linkUrl: "",
  updated: "",
};

let queue = Promise.resolve();

function clean(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function link(value) {
  const raw = clean(value, 300);
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Use a link like /calendar or example.com, or leave it blank.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Use a link like /calendar or example.com, or leave it blank.");
  }
  return parsed.toString();
}

function present(value) {
  if (!value || typeof value !== "object") return { ...empty };
  return {
    active: Boolean(value.active),
    title: clean(value.title, 80),
    message: clean(value.message, 500),
    linkLabel: clean(value.linkLabel, 40),
    linkUrl: typeof value.linkUrl === "string" ? value.linkUrl : "",
    updated: clean(value.updated, 40),
  };
}

export function getNotice() {
  try {
    return present(JSON.parse(readFileSync(filePath, "utf8")));
  } catch {
    return { ...empty };
  }
}

export function saveNotice(input) {
  const run = queue.then(async () => {
    const active = Boolean(input.active);
    const title = clean(input.title, 80);
    const message = clean(input.message, 500);
    const linkLabel = clean(input.linkLabel, 40);
    const linkUrl = link(input.linkUrl);
    if (active && !title && !message) throw new Error("Add a heading or a message before showing the alert.");
    if ((linkLabel && !linkUrl) || (!linkLabel && linkUrl)) {
      throw new Error("Add both a button label and a link, or leave both blank.");
    }
    const notice = {
      active,
      title,
      message,
      linkLabel,
      linkUrl,
      updated: new Date().toISOString(),
    };
    await writeFile(filePath, `${JSON.stringify(notice, null, 2)}\n`);
    return notice;
  });
  queue = run.then(() => {}, () => {});
  return run;
}
