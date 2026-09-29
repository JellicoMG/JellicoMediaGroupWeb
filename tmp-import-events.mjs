import { readFileSync } from "node:fs";
import { importEvents } from "./lib/events.js";

const csv = readFileSync("c:/Users/kadee/Downloads/jmg_jellico_events_2026.csv", "utf8");
const result = await importEvents(csv);
console.log("added", result.added, "updated", result.updated, "total", result.events.length);
for (const event of result.events) {
  console.log([event.date, event.time, event.category, event.sport, event.name].join(" | "));
}
