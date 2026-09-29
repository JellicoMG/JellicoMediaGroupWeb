import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sports } from "./catalog.js";

const filePath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "events.json");
const categories = ["Sports", "School", "Community", "JMG"];

let queue = Promise.resolve();

function present(event) {
  const sport = sports.find((item) => item.slug === event.sport);
  return { ...event, sportName: sport ? sport.name : "" };
}

async function readEvents() {
  const raw = await readFile(filePath, "utf8");
  const events = JSON.parse(raw);
  if (!Array.isArray(events)) return [];
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

function change(mutator) {
  const run = queue.then(async () => {
    const events = await readEvents();
    const result = await mutator(events);
    const next = Array.isArray(result) ? result : result.events;
    next.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
    await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`);
    const presented = next.map(present);
    return Array.isArray(result) ? presented : { ...result, events: presented };
  });
  queue = run.then(() => {}, () => {});
  return run;
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

export async function listEvents() {
  return (await readEvents()).map(present);
}

function eventFromInput(input, id) {
  const name = clean(input.name, 140);
  const date = clean(input.date, 10);
  const time = clean(input.time, 40);
  const location = clean(input.location, 140);
  const description = clean(input.description, 500);
  const category = categories.includes(input.category) ? input.category : "";
  const sport = sports.some((item) => item.slug === input.sport) ? input.sport : "";

  if (!name) throw new Error("Add an event name.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    throw new Error("Choose a date.");
  }
  if (time && !/^[\w\s:.\-–—/]+$/.test(time)) throw new Error("Use a time like 7:00 PM, or leave it blank.");
  if (!category) throw new Error("Choose a category.");

  return { id, name, date, time, location, category, sport, description };
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

function categoryFromCsv(value) {
  const parts = clean(value, 80).split("/").map((part) => part.trim()).filter(Boolean);
  const categoryName = (parts[0] || "").toLowerCase();
  const category = categories.find((item) => item.toLowerCase() === categoryName) || "";
  const sportName = parts.slice(1).join(" / ").toLowerCase();
  const sport = sports.find((item) => item.name.toLowerCase() === sportName);
  return { category, sport: sport ? sport.slug : "" };
}

function sameName(left, right) {
  const normalize = (value) => value.toLowerCase().replace(/[^\w]+/g, " ").trim();
  return normalize(left) === normalize(right);
}

export function importEvents(csv) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one event.");
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const dateCol = columnIndex(header, ["date"]);
  const nameCol = columnIndex(header, ["event", "name"]);
  const categoryCol = columnIndex(header, ["category"]);
  const locationCol = columnIndex(header, ["location", "place"]);
  const timeCol = columnIndex(header, ["time"]);
  const descriptionCol = columnIndex(header, ["description", "details"]);
  if (dateCol < 0 || nameCol < 0 || categoryCol < 0) {
    throw new Error("The CSV needs Date, Event, and Category columns.");
  }

  const incoming = rows.slice(1).map((row, index) => {
    const line = index + 2;
    try {
      const { category, sport } = categoryFromCsv(row[categoryCol]);
      return eventFromInput({
        name: row[nameCol],
        date: row[dateCol],
        time: timeCol >= 0 ? row[timeCol] : "",
        location: locationCol >= 0 ? row[locationCol] : "",
        description: descriptionCol >= 0 ? row[descriptionCol] : "",
        category,
        sport,
      }, `csv-${line}`);
    } catch (error) {
      throw new Error(`Row ${line}: ${error.message}`);
    }
  });

  return change((events) => {
    const next = events.map((event) => ({ ...event }));
    let added = 0;
    let updated = 0;
    for (const item of incoming) {
      let match = next.find((event) => event.date === item.date && sameName(event.name, item.name));
      if (!match && item.sport) {
        const sportMatches = next.filter((event) => (
          event.date === item.date && event.category === item.category && event.sport === item.sport
        ));
        if (sportMatches.length === 1) match = sportMatches[0];
      }
      if (match) {
        match.name = item.name;
        match.time = item.time;
        match.location = item.location;
        match.category = item.category;
        match.sport = item.sport;
        if (item.description) match.description = item.description;
        updated += 1;
      } else {
        next.push({ ...item, id: randomUUID() });
        added += 1;
      }
    }
    next.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
    return { events: next, added, updated };
  });
}

export function addEvent(input) {
  return change((events) => [...events, eventFromInput(input, randomUUID())]);
}

export function updateEvent(id, input) {
  return change((events) => {
    if (!events.some((event) => event.id === id)) throw new Error("That event is no longer on the calendar.");
    return events.map((event) => (event.id === id ? eventFromInput(input, id) : event));
  });
}

export function removeEvent(id) {
  return change((events) => events.filter((event) => event.id !== id));
}
