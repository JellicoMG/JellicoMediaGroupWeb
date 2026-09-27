import { facebookPlugin, school, shows, socials, sports } from "./catalog.js";
import { esc, renderPage } from "./layout.js";

function sportCards() {
  return sports.map((sport) => `
    <article class="sport-card">
      <img src="/img/JellicoOldSchoolLogo.png" alt="">
      <div>
        <h3><a href="/sports/${sport.slug}">${esc(sport.name)}</a></h3>
        <p>${esc(school.name)} ${esc(school.mascot)}</p>
        <a class="text-link" href="${sport.maxpreps}" target="_blank" rel="noopener noreferrer">View on MaxPreps</a>
      </div>
    </article>`).join("");
}

function showCards() {
  return shows.map((show) => `
    <article class="panel show-card">
      <p class="kicker">Podcast</p>
      <h3><a href="/podcasts/${show.slug}">${esc(show.name)}</a></h3>
      <p>${esc(show.description)}</p>
      <iframe class="spotify" title="${esc(show.name)} on Spotify" src="${show.embed}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
      <a class="text-link" href="${show.spotify}" target="_blank" rel="noopener noreferrer">Open in Spotify</a>
    </article>`).join("");
}

function facebookBlock() {
  return `
    <section class="section">
      <div class="wrap split">
        <div>
          <div class="section-head">
            <h2>Latest on Facebook</h2>
            <a href="${socials.facebook}" target="_blank" rel="noopener noreferrer">Open Facebook</a>
          </div>
          <iframe class="fb-frame" title="Jellico Media Group on Facebook" src="${facebookPlugin}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <div class="stack">
          <a class="social-card" href="${socials.instagram}" target="_blank" rel="noopener noreferrer">
            <p class="kicker">Instagram</p>
            <strong>@jellicomg</strong>
            <span>Photos and clips from games, school, and around town.</span>
          </a>
          <a class="social-card" href="${socials.tiktok}" target="_blank" rel="noopener noreferrer">
            <p class="kicker">TikTok</p>
            <strong>@jellicomediagroup</strong>
            <span>Short clips as soon as we post them.</span>
          </a>
          <a class="social-card" href="${socials.youtube}" target="_blank" rel="noopener noreferrer">
            <p class="kicker">YouTube</p>
            <strong>Jellico Media Group</strong>
            <span>Full games, podcasts, and highlights.</span>
          </a>
        </div>
      </div>
    </section>`;
}

const pages = {
  "/": () => renderPage({
    title: "Jellico Media Group",
    description: "Jellico Media Group brings Blue Devils sports, livestreams, podcasts, and community posts into one place.",
    active: "home",
    body: `
      <section class="hero">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <p class="kicker">Jellico High School Blue Devils</p>
            <h1 id="hero-title">Latest from Jellico Media Group</h1>
            <p id="hero-dek">Games, shows, and clips from the channel, updated from YouTube.</p>
            <div class="hero-actions">
              <a class="btn btn-blue" href="${socials.youtubeLive}" target="_blank" rel="noopener noreferrer">Watch live</a>
              <a class="btn btn-ghost" id="hero-open" href="${socials.youtube}" target="_blank" rel="noopener noreferrer">Open on YouTube</a>
            </div>
          </div>
          <div class="player" data-hero>
            <p class="empty">Loading the latest video…</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>Latest videos</h2>
            <a href="/watch">Watch all</a>
          </div>
          <div class="video-grid" data-videos="all" data-skip="1" data-limit="6"></div>
        </div>
      </section>
      ${facebookBlock()}
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>Podcasts</h2>
            <a href="/podcasts">Both shows</a>
          </div>
          <div class="show-grid">${showCards()}</div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>Upcoming</h2>
            <a href="/calendar">Full calendar</a>
          </div>
          <div class="event-list" data-events="upcoming" data-limit="4" data-empty="Nothing is on the calendar yet."></div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>Blue Devils schedules</h2>
            <a href="/calendar">All sports</a>
          </div>
          <p class="lede">Game dates and scores for ${esc(school.name)} stay on MaxPreps, so this list does not go stale.</p>
          <div class="sport-grid">${sportCards()}</div>
        </div>
      </section>
      <section class="section">
        <div class="wrap sponsor-band">
          <div>
            <p class="kicker">Sponsors</p>
            <h2>Put your business on Jellico broadcasts.</h2>
            <p>Sponsorship supports livestreams, sports coverage, interviews, and both JMG podcasts.</p>
          </div>
          <a class="btn btn-blue" href="mailto:${socials.email}?subject=Sponsorship">Email JMG</a>
        </div>
      </section>`,
  }),

  "/sports": () => renderPage({
    title: "Sports",
    description: "Jellico High School Blue Devils sports coverage from Jellico Media Group.",
    active: "sports",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">${esc(school.name)}</p>
          <h1>Blue Devils sports</h1>
          <p class="lede">Football, basketball, baseball, softball, and volleyball. New broadcasts land here from our YouTube channel. Schedules and scores stay on MaxPreps.</p>
          <a class="btn btn-ghost" href="${school.maxpreps}" target="_blank" rel="noopener noreferrer">Jellico on MaxPreps</a>
        </div>
      </section>
      <section class="section">
        <div class="wrap sport-grid">${sportCards()}</div>
      </section>`,
  }),

  "/updates": () => renderPage({
    title: "Updates",
    description: "The newest Jellico Media Group posts from Facebook and YouTube.",
    active: "updates",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">Updates</p>
          <h1>What we just posted</h1>
          <p class="lede">The Facebook timeline and the newest YouTube uploads, in one feed.</p>
        </div>
      </section>
      ${facebookBlock()}
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>From YouTube</h2>
            <a href="/watch">Watch</a>
          </div>
          <div class="video-grid" data-videos="all"></div>
        </div>
      </section>`,
  }),

  "/calendar": () => renderPage({
    title: "Calendar",
    description: "Upcoming Jellico Media Group events, including sports, school nights, and community dates.",
    active: "calendar",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">Calendar</p>
          <h1>What's coming up</h1>
          <p class="lede">Games, school nights, and community dates for the month. JMG updates this list from the admin console.</p>
          <div class="filters" role="tablist" aria-label="Event types">
            <button class="chip is-active" type="button" data-event-filter="all">All</button>
            <button class="chip" type="button" data-event-filter="Sports">Sports</button>
            <button class="chip" type="button" data-event-filter="School">School</button>
            <button class="chip" type="button" data-event-filter="Community">Community</button>
            <button class="chip" type="button" data-event-filter="JMG">JMG</button>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="month-bar">
            <button class="chip" type="button" data-month="-1">Previous</button>
            <h2 id="month-label">This month</h2>
            <button class="chip" type="button" data-month="1">Next</button>
          </div>
          <div class="event-list" id="month-list" data-empty="Nothing is scheduled this month."></div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>Season schedules</h2>
            <a href="${school.maxpreps}" target="_blank" rel="noopener noreferrer">MaxPreps</a>
          </div>
          <p class="lede">Full-season dates and scores for ${esc(school.name)} stay on MaxPreps.</p>
          <div class="sport-grid">${sportCards()}</div>
        </div>
      </section>`,
  }),

  "/admin": () => renderPage({
    title: "Admin",
    description: "Jellico Media Group calendar admin.",
    active: "",
    robots: "noindex",
    body: `
      <section class="page-intro" id="admin-login">
        <div class="wrap narrow">
          <p class="kicker">Admin</p>
          <h1>Sign in</h1>
          <p class="lede">Add, edit, and remove calendar events.</p>
          <form class="panel event-form" id="login-form">
            <label class="wide">Password
              <input name="password" type="password" required autocomplete="current-password">
            </label>
            <p class="form-note wide" id="login-status" role="status"></p>
            <button class="btn btn-blue" type="submit">Sign in</button>
          </form>
        </div>
      </section>
      <section class="page-intro" id="admin-console" hidden>
        <div class="wrap">
          <div class="section-head">
            <div>
              <p class="kicker">Admin</p>
              <h1>Calendar</h1>
            </div>
            <button class="chip" type="button" id="logout">Log out</button>
          </div>
          <div class="calendar-layout">
            <form class="panel event-form" id="event-form">
              <h2 id="event-form-title">Add an event</h2>
              <input type="hidden" name="id" value="">
              <label class="wide">Name
                <input name="name" required maxlength="140" placeholder="Senior night, fundraiser, podcast recording">
              </label>
              <label>Date
                <input name="date" type="date" required>
              </label>
              <label>Start time
                <input name="time" type="time">
              </label>
              <label>Category
                <select name="category" required>
                  <option value="Sports">Sports</option>
                  <option value="School">School</option>
                  <option value="Community">Community</option>
                  <option value="JMG">JMG</option>
                </select>
              </label>
              <label>Sport
                <select name="sport">
                  <option value="">Not a specific sport</option>
                  ${sports.map((sport) => `<option value="${sport.slug}">${esc(sport.name)}</option>`).join("")}
                </select>
              </label>
              <label class="wide">Place
                <input name="location" maxlength="140" placeholder="Jellico High School, North Greene">
              </label>
              <label class="wide">Details
                <textarea name="description" maxlength="500" rows="3"></textarea>
              </label>
              <p class="form-note wide" id="event-status" role="status"></p>
              <div class="hero-actions wide">
                <button class="btn btn-blue" type="submit" id="event-submit">Add to calendar</button>
                <button class="btn btn-ghost" type="button" id="event-cancel" hidden>Cancel</button>
              </div>
            </form>
            <div>
              <h2>On the calendar</h2>
              <div class="event-list" id="admin-events" data-empty="No events yet."></div>
            </div>
          </div>
        </div>
      </section>`,
  }),

  "/watch": () => renderPage({
    title: "Watch",
    description: "Jellico Media Group games, highlights, and shows on YouTube.",
    active: "watch",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">Watch</p>
          <h1>Games, highlights, and shows</h1>
          <p class="lede">Every recent upload from the Jellico Media Group channel.</p>
          <div class="hero-actions">
            <a class="btn btn-blue" href="${socials.youtubeLive}" target="_blank" rel="noopener noreferrer">Watch live</a>
            <a class="btn btn-ghost" href="${socials.youtube}" target="_blank" rel="noopener noreferrer">YouTube channel</a>
          </div>
          <div class="filters" role="tablist" aria-label="Video types">
            <button class="chip is-active" type="button" data-filter="all">All</button>
            <button class="chip" type="button" data-filter="kind:game">Games</button>
            <button class="chip" type="button" data-filter="kind:highlight">Highlights</button>
            <button class="chip" type="button" data-filter="kind:podcast">Podcasts</button>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="video-grid" data-videos="all" data-empty="No videos in this group yet. The full channel is still on YouTube."></div>
        </div>
      </section>`,
  }),

  "/podcasts": () => renderPage({
    title: "Podcasts",
    description: "The Has-Beens with Dre & Trey and The 11th Hour from Jellico Media Group.",
    active: "podcasts",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">Podcasts</p>
          <h1>Two JMG shows</h1>
          <p class="lede">New episodes play here from Spotify, and the video versions show up from YouTube.</p>
        </div>
      </section>
      <section class="section">
        <div class="wrap show-grid">${showCards()}</div>
      </section>`,
  }),

  "/community": () => renderPage({
    title: "Community",
    description: "Jellico Media Group on Instagram, TikTok, and Facebook.",
    active: "community",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">Community</p>
          <h1>More than the game</h1>
          <p class="lede">School life, local posts, and everything that is not a final score goes on Instagram, TikTok, and Facebook. Those feeds are the community desk.</p>
        </div>
      </section>
      ${facebookBlock()}`,
  }),

  "/sponsors": () => renderPage({
    title: "Sponsors",
    description: "Sponsor Jellico Media Group livestreams, sports coverage, and podcasts.",
    active: "sponsors",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">Sponsors</p>
          <h1>Become a JMG sponsor</h1>
          <p class="lede">A sponsorship puts your business on local sports coverage, livestreams, interviews, podcasts, and student-athlete recognition.</p>
          <a class="btn btn-blue" href="mailto:${socials.email}?subject=Sponsorship">Email ${esc(socials.email)}</a>
        </div>
      </section>
      <section class="section">
        <div class="wrap points">
          <article>
            <h2>What you are supporting</h2>
            <ul>
              <li>Blue Devils game broadcasts</li>
              <li>Highlights and interviews</li>
              <li>The Has-Beens and The 11th Hour</li>
              <li>Community coverage around Jellico</li>
            </ul>
          </article>
          <article>
            <h2>Talk with us</h2>
            <p>Email ${esc(socials.email)} and tell us about your business. We will reply with what a sponsorship can look like this season.</p>
          </article>
        </div>
      </section>`,
  }),

  "/about": () => renderPage({
    title: "About",
    description: "Jellico Media Group covers Jellico High School sports, livestreams, and podcasts.",
    active: "about",
    body: `
      <section class="page-intro">
        <div class="wrap narrow">
          <p class="kicker">About</p>
          <h1>Jellico Media Group</h1>
          <p class="lede">JMG covers ${esc(school.name)} ${esc(school.mascot)} sports and produces the livestreams, videos, and podcasts that follow the community.</p>
          <p class="lede">The Has-Beens with Dre &amp; Trey talks sports. The 11th Hour is a Christian show about everyday life. Both live on Spotify and YouTube, and this site is where they sit next to the games.</p>
          <p class="lede">Sports are the core. The same home is here for community posts, sponsors, and whatever JMG adds next.</p>
          <a class="btn btn-blue" href="/contact">Contact JMG</a>
        </div>
      </section>`,
  }),

  "/contact": () => renderPage({
    title: "Contact",
    description: "Email Jellico Media Group at jellicomediagroup@gmail.com.",
    active: "contact",
    body: `
      <section class="page-intro">
        <div class="wrap narrow">
          <p class="kicker">Contact</p>
          <h1>Email JMG</h1>
          <p class="lede">Questions, story ideas, and sponsorships go to the same inbox.</p>
          <a class="email-link" href="mailto:${socials.email}">${esc(socials.email)}</a>
          <div class="hero-actions">
            <a class="btn btn-ghost" href="${socials.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a class="btn btn-ghost" href="${socials.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a class="btn btn-ghost" href="${socials.youtube}" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a class="btn btn-ghost" href="${socials.tiktok}" target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
        </div>
      </section>`,
  }),
};

function sportPage(sport) {
  return renderPage({
    title: sport.name,
    description: `${school.name} ${sport.name} videos from Jellico Media Group, with the MaxPreps schedule.`,
    active: "sports",
    body: `
      <section class="page-intro">
        <div class="wrap">
          <p class="kicker">${esc(school.name)} ${esc(school.mascot)}</p>
          <h1>${esc(sport.name)}</h1>
          <p class="lede">Upcoming ${esc(sport.name.toLowerCase())} dates, then recent broadcasts. Season scores stay on MaxPreps.</p>
          <a class="btn btn-blue" href="${sport.maxpreps}" target="_blank" rel="noopener noreferrer">View on MaxPreps</a>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>Upcoming</h2>
            <a href="/calendar">Full calendar</a>
          </div>
          <div class="event-list" data-events="sport:${sport.slug}" data-empty="No upcoming ${esc(sport.name.toLowerCase())} events yet."></div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="video-grid" data-videos="${sport.tag}" data-empty="No ${esc(sport.name.toLowerCase())} videos in the latest uploads yet. New games will show up here after they are posted on YouTube."></div>
        </div>
      </section>`,
  });
}

function showPage(show) {
  return renderPage({
    title: show.name,
    description: show.description,
    active: "podcasts",
    body: `
      <section class="page-intro">
        <div class="wrap narrow">
          <p class="kicker">Podcast</p>
          <h1>${esc(show.name)}</h1>
          <p class="lede">${esc(show.description)}</p>
          <iframe class="spotify" title="${esc(show.name)} on Spotify" src="${show.embed}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
          <p><a class="text-link" href="${show.spotify}" target="_blank" rel="noopener noreferrer">Open in Spotify</a></p>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <h2>On YouTube</h2>
            <a href="/watch">All videos</a>
          </div>
          <div class="video-grid" data-videos="${show.tag}" data-empty="New episodes will show up here when they are posted on YouTube."></div>
        </div>
      </section>`,
  });
}

export function resolve(pathname) {
  if (pages[pathname]) return pages[pathname]();
  const sportMatch = pathname.match(/^\/sports\/([a-z-]+)$/);
  if (sportMatch) {
    const sport = sports.find((item) => item.slug === sportMatch[1]);
    if (sport) return sportPage(sport);
  }
  const showMatch = pathname.match(/^\/podcasts\/([a-z0-9-]+)$/);
  if (showMatch) {
    const show = shows.find((item) => item.slug === showMatch[1]);
    if (show) return showPage(show);
  }
  return null;
}

export function notFound() {
  return renderPage({
    title: "Page not found",
    description: "That page is not on the Jellico Media Group site.",
    active: "",
    body: `
      <section class="page-intro">
        <div class="wrap narrow">
          <h1>That page is not here</h1>
          <a class="btn btn-blue" href="/">Back home</a>
        </div>
      </section>`,
  });
}
