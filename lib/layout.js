import { socials } from "./catalog.js";

const NAV = [
  ["/", "Home", "home"],
  ["/sports", "Sports", "sports"],
  ["/updates", "Updates", "updates"],
  ["/calendar", "Calendar", "calendar"],
  ["/watch", "Watch", "watch"],
  ["/podcasts", "Podcasts", "podcasts"],
  ["/community", "Community", "community"],
  ["/advertisers", "Advertisers", "advertisers"],
];

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

function navLinks(active) {
  return NAV.map(([href, label, key]) => {
    const current = key === active ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }).join("");
}

export function renderPage({ title, description, active, body, robots }) {
  const pageTitle = title === "Jellico Media Group" ? title : `${title} · Jellico Media Group`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">
  ${robots ? `<meta name="robots" content="${esc(robots)}">` : ""}
  <meta name="theme-color" content="#07080c">
  <link rel="icon" href="/img/JMGLOGO.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>
  <div id="boot" role="status" aria-live="polite" aria-busy="true">
    <img src="/img/JMGLOGO.png" alt="">
    <p>Getting Jellico Media Group ready</p>
    <span class="boot-bar" aria-hidden="true"></span>
  </div>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <div class="wrap header-bar">
      <a class="brand" href="/">
        <img src="/img/JMGLOGO.png" alt="Jellico Media Group">
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="nav">
        ${navLinks(active)}
        <a class="btn btn-blue nav-contact" href="/contact">Contact</a>
      </nav>
    </div>
  </header>
  <main id="content">
    ${body}
  </main>
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <img class="footer-logo" src="/img/JMGLOGO.png" alt="">
        <p>The online home of Jellico Media Group. Local sports, livestreams, shows, and community coverage.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/advertisers">Advertisers</a>
        <a href="/calendar">Schedules</a>
        <a href="/admin">Admin</a>
      </div>
      <div>
        <h2>Follow</h2>
        <a href="${socials.youtube}" target="_blank" rel="noopener noreferrer">YouTube</a>
        <a href="${socials.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="${socials.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="${socials.tiktok}" target="_blank" rel="noopener noreferrer">TikTok</a>
        <button class="footer-email" type="button" data-copy-email="${esc(socials.email)}">${esc(socials.email)}</button>
      </div>
    </div>
    <div class="wrap footer-base">
      <p>&copy; ${new Date().getFullYear()} Jellico Media Group</p>
    </div>
  </footer>
  <script src="/js/site.js?v=9" defer></script>
</body>
</html>`;
}
