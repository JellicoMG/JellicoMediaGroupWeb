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
    const next = await mutator(events);
    await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`);
    return next.map(present);
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
  const time = clean(input.time, 5);
  const location = clean(input.location, 140);
  const description = clean(input.description, 500);
  const category = categories.includes(input.category) ? input.category : "";
  const sport = sports.some((item) => item.slug === input.sport) ? input.sport : "";

  if (!name) throw new Error("Add an event name.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    throw new Error("Choose a date.");
  }
  if (time && !/^\d{2}:\d{2}$/.test(time)) throw new Error("Choose a start time or leave it blank.");
  if (!category) throw new Error("Choose a category.");

  return { id, name, date, time, location, category, sport, description };
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
