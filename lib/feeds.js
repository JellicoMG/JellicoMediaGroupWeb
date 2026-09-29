import { get, request } from "node:https";
import { socials, tagVideo } from "./catalog.js";

const CHANNEL_ID = "UC527cxNHL1qXTc2oImMx1KA";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CHANNEL_TABS = ["videos", "shorts", "streams"];
const CACHE_MS = 10 * 60 * 1000;

let cache = null;

function fetchText(url, accept) {
  return new Promise((resolve, reject) => {
    const request = get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: accept,
        "Accept-Language": "en-US,en;q=0.9",
      },
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        const next = new URL(response.headers.location, url).toString();
        fetchText(next, accept).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`YouTube returned ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    request.on("error", reject);
  });
}

function decode(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseFeed(xml) {
  return xml
    .split("<entry>")
    .slice(1)
    .map((block) => {
      const take = (tag) => {
        const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return match ? decode(match[1]) : "";
      };
      const id = take("yt:videoId");
      const title = take("title");
      const thumb = block.match(/<media:thumbnail[^>]*url="([^"]+)"/);
      const link = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/);
      const views = block.match(/<media:statistics[^>]*views="(\d+)"/);
      if (!id || !title) return null;
      return {
        id,
        title,
        published: take("published"),
        url: link ? decode(link[1]) : `https://www.youtube.com/watch?v=${id}`,
        thumbnail: thumb ? thumb[1] : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        views: views ? Number(views[1]) : null,
        tags: tagVideo(title),
      };
    })
    .filter(Boolean);
}

function readInitialData(html) {
  const marker = html.indexOf("ytInitialData");
  const start = marker < 0 ? -1 : html.indexOf("{", marker);
  if (start < 0) throw new Error("The YouTube channel page did not include a video list.");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(start, index + 1));
    }
  }
  throw new Error("The YouTube channel page did not include a video list.");
}

function publishedLabel(lockup) {
  const rows = lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
  for (const row of rows) {
    for (const part of row.metadataParts || []) {
      const label = part.accessibilityLabel || part.text?.content || "";
      if (/ago|streamed|premier/i.test(label)) return part.text?.content || label;
    }
  }
  return "";
}

function videoRecord(id, title, published, url) {
  return {
    id,
    title,
    published,
    url,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    views: null,
    tags: tagVideo(title),
  };
}

function walkNodes(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => walkNodes(item, visit));
    else walkNodes(value, visit);
  }
}

function videosFromChannelPage(html) {
  if (!html || !html.includes("ytInitialData")) return [];
  const videos = [];
  const seen = new Set();
  walkNodes(readInitialData(html), (node) => {
    const lockup = node.lockupViewModel;
    if (lockup?.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO" || !lockup.contentId || seen.has(lockup.contentId)) return;
    const title = lockup.metadata?.lockupMetadataViewModel?.title?.content || "";
    if (!title) return;
    seen.add(lockup.contentId);
    videos.push(videoRecord(
      lockup.contentId,
      title,
      publishedLabel(lockup),
      `https://www.youtube.com/watch?v=${lockup.contentId}`,
    ));
  });
  return videos;
}

function shortsFromChannelPage(html) {
  if (!html || !html.includes("ytInitialData")) return [];
  const shorts = [];
  const seen = new Set();
  walkNodes(readInitialData(html), (node) => {
    const item = node.shortsLockupViewModel;
    if (!item) return;
    const id = String(item.entityId || "").replace(/^shorts-shelf-item-/, "");
    const title = item.overlayMetadata?.primaryText?.content || "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !title || seen.has(id)) return;
    seen.add(id);
    shorts.push(videoRecord(id, title, "", `https://www.youtube.com/shorts/${id}`));
  });
  return shorts;
}

function postJson(path, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: "www.youtube.com",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        if (response.statusCode !== 200) {
          reject(new Error(`YouTube returned ${response.statusCode}`));
          return;
        }
        resolve(Buffer.concat(chunks).toString("utf8"));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function addShortDates(shorts) {
  const pending = shorts.slice();
  const workers = Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (pending.length) {
      const short = pending.shift();
      try {
        const text = await postJson("/youtubei/v1/player?prettyPrint=false", {
          videoId: short.id,
          context: { client: { clientName: "WEB", clientVersion: "2.20250918.01.00" } },
        });
        const match = text.match(/"publishDate":"([^"]+)"/);
        if (match) short.published = match[1];
      } catch (error) {
        console.error(error);
      }
    }
  });
  await Promise.all(workers);
  return shorts;
}

function ageMs(video) {
  const parsed = Date.parse(video.published);
  if (!Number.isNaN(parsed)) return Date.now() - parsed;
  const match = String(video.published || "").toLowerCase().match(/(\d+)\s*(years?|yrs?|y|months?|mos?|mo|weeks?|wks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|min|seconds?|secs?|sec)\b/);
  if (!match) return null;
  const count = Number(match[1]);
  const unit = match[2];
  const day = 86_400_000;
  const scale = unit.startsWith("y") ? 365 * day
    : unit.startsWith("mo") ? 30 * day
    : unit.startsWith("w") ? 7 * day
    : unit.startsWith("d") ? day
    : unit.startsWith("h") ? day / 24
    : unit.startsWith("min") ? day / 1440
    : day / 86400;
  return count * scale;
}

function byNewest(videos) {
  return videos
    .map((video, index) => ({ video, index, age: ageMs(video) }))
    .sort((left, right) => {
      if (left.age == null && right.age == null) return left.index - right.index;
      if (left.age == null) return 1;
      if (right.age == null) return -1;
      return left.age - right.age;
    })
    .map((item) => item.video);
}

async function videosFromChannel() {
  const pages = [];
  for (const tab of CHANNEL_TABS) {
    try {
      pages.push(await fetchText(`${socials.youtube}/${tab}`, "text/html"));
    } catch (error) {
      console.error(error);
      pages.push("");
    }
  }
  const [videosHtml, shortsHtml, streamsHtml] = pages;
  const shorts = await addShortDates(shortsFromChannelPage(shortsHtml));
  const merged = [];
  const seen = new Set();
  for (const video of [...videosFromChannelPage(videosHtml), ...videosFromChannelPage(streamsHtml), ...shorts]) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }
  return byNewest(merged);
}

export async function getFeed() {
  const fresh = cache && cache.videos.length && Date.now() - cache.fetchedAt < CACHE_MS;
  if (fresh) return cache;

  try {
    const xml = await fetchText(FEED_URL, "application/atom+xml");
    const videos = parseFeed(xml);
    if (videos.length) {
      cache = { videos, fetchedAt: Date.now(), error: false };
      return cache;
    }
  } catch (error) {
    console.error(error);
  }

  try {
    const videos = await videosFromChannel();
    if (!videos.length) throw new Error("The YouTube channel page did not include a video list.");
    cache = { videos, fetchedAt: Date.now(), error: false };
    return cache;
  } catch (error) {
    console.error(error);
    if (cache?.videos?.length) return { ...cache, error: false };
    return { videos: [], fetchedAt: Date.now(), error: true };
  }
}
