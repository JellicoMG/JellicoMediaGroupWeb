import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const filePath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "contributors.json");

let queue = Promise.resolve();

function clean(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function website(value) {
  const raw = clean(value, 300);
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Use a website like example.com, or leave it blank.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Use a website like example.com, or leave it blank.");
  }
  return parsed.toString();
}

export function listContributors() {
  try {
    const items = JSON.parse(readFileSync(filePath, "utf8"));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function readContributors() {
  const raw = await readFile(filePath, "utf8");
  const items = JSON.parse(raw);
  return Array.isArray(items) ? items : [];
}

function change(mutator) {
  const run = queue.then(async () => {
    const items = await readContributors();
    const result = await mutator(items);
    const next = Array.isArray(result) ? result : result.contributors;
    await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`);
    return Array.isArray(result) ? next : { ...result, contributors: next };
  });
  queue = run.then(() => {}, () => {});
  return run;
}

export function contributorFromInput(input, id) {
  const name = clean(input.name, 120);
  const line = clean(input.line, 180);
  if (!name) throw new Error("Add a name.");
  return { id, name, url: website(input.url), line };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === "\"") {
        if (source[index + 1] === "\"") {
          cell += "\"";
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
}

function columnIndex(header, names) {
  return header.findIndex((cell) => names.includes(cell));
}

function sameName(left, right) {
  const normalize = (value) => value.toLowerCase().replace(/[^\w]+/g, " ").trim();
  return normalize(left) === normalize(right);
}

export function importContributors(csv) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one advertiser.");
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const nameCol = columnIndex(header, ["name", "advertiser", "business", "contributor", "sponsor"]);
  const urlCol = columnIndex(header, ["website", "url", "link", "site"]);
  const lineCol = columnIndex(header, ["line", "about", "description", "tagline"]);
  if (nameCol < 0) throw new Error("The CSV needs a Name column.");

  const incoming = rows.slice(1).map((row, index) => {
    const lineNumber = index + 2;
    try {
      return contributorFromInput({
        name: row[nameCol],
        url: urlCol >= 0 ? row[urlCol] : "",
        line: lineCol >= 0 ? row[lineCol] : "",
      }, `csv-${lineNumber}`);
    } catch (error) {
      throw new Error(`Row ${lineNumber}: ${error.message}`);
    }
  });

  return change((items) => {
    const next = items.map((item) => ({ ...item }));
    let added = 0;
    let updated = 0;
    for (const item of incoming) {
      const match = next.find((entry) => sameName(entry.name, item.name));
      if (match) {
        match.name = item.name;
        match.url = item.url;
        match.line = item.line;
        updated += 1;
      } else {
        next.push({ ...item, id: randomUUID() });
        added += 1;
      }
    }
    return { contributors: next, added, updated };
  });
}

export function addContributor(input) {
  return change((items) => [...items, contributorFromInput(input, randomUUID())]);
}

export function updateContributor(id, input) {
  return change((items) => {
    if (!items.some((item) => item.id === id)) throw new Error("That advertiser is no longer listed.");
    return items.map((item) => (item.id === id ? contributorFromInput(input, id) : item));
  });
}

export function removeContributor(id) {
  return change((items) => items.filter((item) => item.id !== id));
}
