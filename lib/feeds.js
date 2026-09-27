import { get } from "node:https";
import { tagVideo } from "./catalog.js";

const CHANNEL_ID = "UC527cxNHL1qXTc2oImMx1KA";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CACHE_MS = 10 * 60 * 1000;

let cache = null;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, {
      headers: {
        "User-Agent": "JellicoMediaGroupWebsite/1.0",
        Accept: "application/atom+xml",
      },
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        fetchText(response.headers.location).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`YouTube feed returned ${response.statusCode}`));
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

export async function getFeed() {
  const fresh = cache && Date.now() - cache.fetchedAt < CACHE_MS;
  if (fresh) return cache;

  try {
    const xml = await fetchText(FEED_URL);
    const videos = parseFeed(xml);
    cache = { videos, fetchedAt: Date.now(), error: false };
    return cache;
  } catch (error) {
    console.error(error);
    if (cache) return { ...cache, error: false };
    return { videos: [], fetchedAt: Date.now(), error: true };
  }
}
