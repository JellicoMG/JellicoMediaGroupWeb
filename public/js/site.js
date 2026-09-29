const bootScreen = document.querySelector("#boot");
let bootJobs = 0;
let siteReady = false;
const readyJobs = [];

function finishBoot() {
  if (bootScreen && !bootScreen.classList.contains("is-done")) {
    bootScreen.classList.add("is-done");
    bootScreen.setAttribute("aria-busy", "false");
    window.setTimeout(() => bootScreen.remove(), 400);
  }
  if (siteReady) return;
  siteReady = true;
  readyJobs.splice(0).forEach((job) => job());
}

function whenSiteReady(job) {
  if (siteReady) job();
  else readyJobs.push(job);
}

function trackBoot(work) {
  bootJobs += 1;
  return Promise.resolve(work).finally(() => {
    bootJobs -= 1;
    if (bootJobs === 0) finishBoot();
  });
}

document.querySelectorAll("[data-copy-email]").forEach((button) => {
  button.addEventListener("click", async () => {
    const email = button.dataset.copyEmail;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const field = document.createElement("textarea");
      field.value = email;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    const note = button.parentElement?.querySelector("[data-copy-status]");
    if (note) note.textContent = "Copied";
    button.classList.add("is-copied");
    window.setTimeout(() => button.classList.remove("is-copied"), 2000);
  });
});

const menuButton = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuButton.textContent = open ? "Close" : "Menu";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(() => {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "Menu";
      }, 0);
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function videoCard(video) {
  return `<a class="video-card" href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">
    <span class="thumb"><img src="${escapeHtml(video.thumbnail)}" alt=""></span>
    <strong>${escapeHtml(video.title)}</strong>
    <span class="video-date">${escapeHtml(formatDate(video.published))}</span>
  </a>`;
}

function selectVideos(videos, filter) {
  if (!filter || filter === "all") return videos.slice();
  return videos.filter((video) => video.tags.includes(filter));
}

function renderGrid(grid, videos) {
  let list = selectVideos(videos, grid.dataset.videos);
  const skip = Number(grid.dataset.skip || 0);
  const limit = Number(grid.dataset.limit || 0);
  if (skip) list = list.slice(skip);
  if (limit) list = list.slice(0, limit);
  if (!list.length) {
    grid.innerHTML = grid.dataset.skip
      ? ""
      : `<p class="empty">${escapeHtml(grid.dataset.empty || "Nothing new is posted yet.")}</p>`;
    return;
  }
  grid.innerHTML = list.map(videoCard).join("");
}

function renderHero(video) {
  const slot = document.querySelector("[data-hero]");
  if (!slot || !video) return;
  const title = document.getElementById("hero-title");
  const dek = document.getElementById("hero-dek");
  const open = document.getElementById("hero-open");
  if (title) title.textContent = video.title;
  if (dek) dek.textContent = formatDate(video.published);
  if (open) open.href = video.url;
  slot.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?rel=0" title="${escapeHtml(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

const grids = document.querySelectorAll("[data-videos]");
const hero = document.querySelector("[data-hero]");

if (grids.length || hero) {
  trackBoot(fetch("/api/feed")
    .then((response) => {
      if (!response.ok) throw new Error("Feed failed");
      return response.json();
    })
    .then((feed) => {
      const videos = Array.isArray(feed.videos) ? feed.videos : [];
      if (videos[0]) renderHero(videos[0]);
      else if (hero) hero.innerHTML = `<p class="empty">The latest video is unavailable right now. <a href="https://www.youtube.com/@JellicoMediaGroup">Open YouTube</a>.</p>`;
      grids.forEach((grid) => renderGrid(grid, videos));

      document.querySelectorAll("[data-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          const grid = document.querySelector("[data-videos]");
          if (!grid) return;
          grid.dataset.videos = button.dataset.filter;
          document.querySelectorAll("[data-filter]").forEach((chip) => {
            chip.classList.toggle("is-active", chip === button);
          });
          renderGrid(grid, videos);
        });
      });
    })
    .catch(() => {
      if (hero) hero.innerHTML = `<p class="empty">The latest video is unavailable right now. <a href="https://www.youtube.com/@JellicoMediaGroup">Open YouTube</a>.</p>`;
      grids.forEach((grid) => {
        grid.innerHTML = `<p class="empty">Videos could not load. <a href="https://www.youtube.com/@JellicoMediaGroup">Watch on YouTube</a>.</p>`;
      });
    }));
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatEventDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(time) {
  if (!time) return "";
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function eventMarkup(event, actions = "") {
  const bits = [event.category, event.sportName, event.location, formatEventTime(event.time)].filter(Boolean);
  return `<article class="event-row">
    <p class="event-when">${escapeHtml(formatEventDate(event.date))}</p>
    <div>
      <h3>${escapeHtml(event.name)}</h3>
      ${bits.length ? `<p>${escapeHtml(bits.join(" · "))}</p>` : ""}
      ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
    </div>
    ${actions}
  </article>`;
}

const monthList = document.querySelector("#month-list");
const upcomingLists = document.querySelectorAll("[data-events]");
const adminEvents = document.querySelector("#admin-events");
const adminLogin = document.querySelector("#admin-login");
const adminConsole = document.querySelector("#admin-console");
let calendarEvents = [];
let eventFilter = "all";
let visibleMonth = new Date();
visibleMonth.setDate(1);

function eventsFor(filter) {
  return calendarEvents.filter((event) => {
    if (filter === "upcoming") return event.date >= todayKey();
    if (filter === "community") {
      return event.date >= todayKey() && (event.category === "School" || event.category === "Community");
    }
    if (filter.startsWith("sport:")) return event.sport === filter.slice(6) && event.date >= todayKey();
    if (eventFilter !== "all" && event.category !== eventFilter) return false;
    return true;
  });
}

function upNextMarkup(event) {
  const bits = [formatEventDate(event.date), formatEventTime(event.time), event.category, event.location].filter(Boolean);
  return `<article class="up-next">
    <p class="kicker">Up next</p>
    <h2>${escapeHtml(event.name)}</h2>
    <p>${escapeHtml(bits.join(" · "))}</p>
    ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
  </article>`;
}

function renderPublicEvents() {
  upcomingLists.forEach((list) => {
    let items = eventsFor(list.dataset.events);
    const skip = Number(list.dataset.skip || 0);
    const limit = Number(list.dataset.limit || 0);
    if (skip) items = items.slice(skip);
    if (limit) items = items.slice(0, limit);
    if (!items.length) {
      list.innerHTML = skip
        ? ""
        : `<p class="empty">${escapeHtml(list.dataset.empty || "Nothing is scheduled.")}</p>`;
      return;
    }
    list.innerHTML = list.dataset.feature === "up-next"
      ? upNextMarkup(items[0])
      : items.map((event) => eventMarkup(event)).join("");
  });

  if (!monthList) return;
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const label = document.querySelector("#month-label");
  if (label) {
    label.textContent = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const items = eventsFor("month").filter((event) => event.date.startsWith(prefix));
  monthList.innerHTML = items.length
    ? items.map((event) => eventMarkup(event)).join("")
    : `<p class="empty">${escapeHtml(monthList.dataset.empty || "Nothing is scheduled this month.")}</p>`;
}

function renderAdminEvents() {
  if (!adminEvents) return;
  adminEvents.innerHTML = calendarEvents.length
    ? calendarEvents.map((event) => eventMarkup(event, `<div class="event-actions">
        <button class="chip" type="button" data-edit="${escapeHtml(event.id)}">Edit</button>
        <button class="chip" type="button" data-remove="${escapeHtml(event.id)}">Remove</button>
      </div>`)).join("")
    : `<p class="empty">${escapeHtml(adminEvents.dataset.empty || "No events yet.")}</p>`;
}

function showAdmin(isAdmin) {
  if (!adminLogin || !adminConsole) return;
  adminLogin.hidden = isAdmin;
  adminConsole.hidden = !isAdmin;
  if (isAdmin && document.querySelector("#contributor-form")) {
    loadAdvertisers().catch(() => {});
  }
  if (isAdmin && document.querySelector("#notice-form")) {
    loadNotice().catch(() => {});
  }
}

async function loadEvents() {
  const response = await fetch("/api/events");
  if (!response.ok) throw new Error("Calendar failed");
  const data = await response.json();
  calendarEvents = Array.isArray(data.events) ? data.events : [];
  renderPublicEvents();
  renderAdminEvents();
}

if (monthList || upcomingLists.length || adminEvents) {
  document.querySelectorAll("[data-event-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      eventFilter = button.dataset.eventFilter;
      document.querySelectorAll("[data-event-filter]").forEach((chip) => {
        chip.classList.toggle("is-active", chip === button);
      });
      renderPublicEvents();
    });
  });

  document.querySelectorAll("[data-month]").forEach((button) => {
    button.addEventListener("click", () => {
      visibleMonth.setMonth(visibleMonth.getMonth() + Number(button.dataset.month));
      renderPublicEvents();
    });
  });

  trackBoot(loadEvents().catch(() => {
    const message = `<p class="empty">The calendar could not load.</p>`;
    if (monthList) monthList.innerHTML = message;
    upcomingLists.forEach((list) => { list.innerHTML = message; });
  }));
}

if (bootJobs === 0) finishBoot();

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  fetch("/api/session").then((response) => response.json()).then((data) => showAdmin(Boolean(data.admin)));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("#login-status");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: new FormData(loginForm).get("password") }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (status) status.textContent = data.error || "Could not sign in.";
      return;
    }
    if (status) status.textContent = "";
    loginForm.reset();
    showAdmin(true);
    loadEvents().catch(() => {});
  });
}

const csvDrop = document.querySelector("#csv-drop");
const csvFile = document.querySelector("#csv-file");
const csvStatus = document.querySelector("#csv-status");

async function importCsvFile(file) {
  if (!file || !csvStatus) return;
  csvStatus.textContent = "Reading the CSV…";
  const response = await fetch("/api/events/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv: await file.text() }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    csvStatus.textContent = data.error || "Could not read that CSV.";
    return;
  }
  calendarEvents = data.events || [];
  const added = Number(data.added || 0);
  const updated = Number(data.updated || 0);
  csvStatus.textContent = `Added ${added} and updated ${updated}.`;
  renderPublicEvents();
  renderAdminEvents();
}

if (csvDrop && csvFile) {
  ["dragenter", "dragover"].forEach((type) => {
    csvDrop.addEventListener(type, (event) => {
      event.preventDefault();
      csvDrop.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    csvDrop.addEventListener(type, (event) => {
      event.preventDefault();
      csvDrop.classList.remove("is-over");
    });
  });
  csvDrop.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    importCsvFile(file).catch(() => {
      if (csvStatus) csvStatus.textContent = "Could not read that CSV.";
    });
  });
  csvFile.addEventListener("change", () => {
    const file = csvFile.files?.[0];
    importCsvFile(file).catch(() => {
      if (csvStatus) csvStatus.textContent = "Could not read that CSV.";
    });
    csvFile.value = "";
  });
}

const logoutButton = document.querySelector("#logout");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    showAdmin(false);
  });
}

const eventForm = document.querySelector("#event-form");
if (eventForm) {
  const status = document.querySelector("#event-status");
  const title = document.querySelector("#event-form-title");
  const submit = document.querySelector("#event-submit");
  const cancel = document.querySelector("#event-cancel");

  function resetEventForm() {
    eventForm.reset();
    eventForm.elements.id.value = "";
    if (title) title.textContent = "Add an event";
    if (submit) submit.textContent = "Add to calendar";
    if (cancel) cancel.hidden = true;
  }

  cancel?.addEventListener("click", resetEventForm);

  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(eventForm);
    const id = String(form.get("id") || "");
    const payload = {
      id,
      name: form.get("name"),
      date: form.get("date"),
      time: form.get("time"),
      category: form.get("category"),
      sport: form.get("sport"),
      location: form.get("location"),
      description: form.get("description"),
    };
    const response = await fetch(id ? "/api/events/update" : "/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (status) status.textContent = data.error || "Could not save that event.";
      return;
    }
    calendarEvents = data.events || [];
    if (status) status.textContent = id ? "Event updated." : "Event added.";
    resetEventForm();
    renderPublicEvents();
    renderAdminEvents();
  });

  adminEvents?.addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-remove]");
    if (edit) {
      const item = calendarEvents.find((entry) => entry.id === edit.dataset.edit);
      if (!item) return;
      eventForm.elements.id.value = item.id;
      eventForm.elements.name.value = item.name;
      eventForm.elements.date.value = item.date;
      eventForm.elements.time.value = item.time || "";
      eventForm.elements.category.value = item.category;
      eventForm.elements.sport.value = item.sport || "";
      eventForm.elements.location.value = item.location || "";
      eventForm.elements.description.value = item.description || "";
      if (title) title.textContent = "Edit event";
      if (submit) submit.textContent = "Save changes";
      if (cancel) cancel.hidden = false;
      if (status) status.textContent = "";
      eventForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (remove) {
      const item = calendarEvents.find((entry) => entry.id === remove.dataset.remove);
      if (!item || !window.confirm(`Remove ${item.name}?`)) return;
      const response = await fetch("/api/events/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (status) status.textContent = data.error || "Could not remove that event.";
        return;
      }
      calendarEvents = data.events || [];
      if (eventForm.elements.id.value === item.id) resetEventForm();
      renderAdminEvents();
    }
  });
}

const contributorForm = document.querySelector("#contributor-form");
const contributorList = document.querySelector("#admin-contributors");
let advertisers = [];

function advertiserMarkup(item) {
  const bits = [item.line, item.url].filter(Boolean);
  return `<article class="event-row">
    <p class="event-when">Ad</p>
    <div>
      <h3>${escapeHtml(item.name)}</h3>
      ${bits.length ? `<p>${escapeHtml(bits.join(" · "))}</p>` : ""}
    </div>
    <div class="event-actions">
      <button class="chip" type="button" data-edit-advertiser="${escapeHtml(item.id)}">Edit</button>
      <button class="chip" type="button" data-remove-advertiser="${escapeHtml(item.id)}">Remove</button>
    </div>
  </article>`;
}

function renderAdvertisers() {
  if (!contributorList) return;
  contributorList.innerHTML = advertisers.length
    ? advertisers.map(advertiserMarkup).join("")
    : `<p class="empty">${escapeHtml(contributorList.dataset.empty || "No advertisers yet.")}</p>`;
}

async function loadAdvertisers() {
  const response = await fetch("/api/contributors");
  if (!response.ok) throw new Error("Advertisers failed");
  const data = await response.json();
  advertisers = Array.isArray(data.contributors) ? data.contributors : [];
  renderAdvertisers();
}

if (contributorForm && contributorList) {
  const status = document.querySelector("#contributor-status");
  const title = document.querySelector("#contributor-form-title");
  const submit = document.querySelector("#contributor-submit");
  const cancel = document.querySelector("#contributor-cancel");

  function resetAdvertiserForm() {
    contributorForm.reset();
    contributorForm.elements.id.value = "";
    if (title) title.textContent = "Add an advertiser";
    if (submit) submit.textContent = "Add advertiser";
    if (cancel) cancel.hidden = true;
  }

  cancel?.addEventListener("click", resetAdvertiserForm);

  contributorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(contributorForm);
    const id = String(form.get("id") || "");
    const response = await fetch(id ? "/api/contributors/update" : "/api/contributors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: form.get("name"),
        url: form.get("url"),
        line: form.get("line"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (status) status.textContent = data.error || "Could not save that advertiser.";
      return;
    }
    advertisers = data.contributors || [];
    if (status) status.textContent = id ? "Advertiser updated." : "Advertiser added.";
    resetAdvertiserForm();
    renderAdvertisers();
  });

  contributorList.addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit-advertiser]");
    const remove = event.target.closest("[data-remove-advertiser]");
    if (edit) {
      const item = advertisers.find((entry) => entry.id === edit.dataset.editAdvertiser);
      if (!item) return;
      contributorForm.elements.id.value = item.id;
      contributorForm.elements.name.value = item.name;
      contributorForm.elements.url.value = item.url || "";
      contributorForm.elements.line.value = item.line || "";
      if (title) title.textContent = "Edit advertiser";
      if (submit) submit.textContent = "Save changes";
      if (cancel) cancel.hidden = false;
      if (status) status.textContent = "";
      contributorForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (remove) {
      const item = advertisers.find((entry) => entry.id === remove.dataset.removeAdvertiser);
      if (!item || !window.confirm(`Remove ${item.name}?`)) return;
      const response = await fetch("/api/contributors/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (status) status.textContent = data.error || "Could not remove that advertiser.";
        return;
      }
      advertisers = data.contributors || [];
      if (contributorForm.elements.id.value === item.id) resetAdvertiserForm();
      renderAdvertisers();
    }
  });

  const contributorDrop = document.querySelector("#contributor-drop");
  const contributorFile = document.querySelector("#contributor-file");
  const contributorCsvStatus = document.querySelector("#contributor-csv-status");

  async function importAdvertiserFile(file) {
    if (!file || !contributorCsvStatus) return;
    contributorCsvStatus.textContent = "Reading the CSV…";
    const response = await fetch("/api/contributors/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: await file.text() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      contributorCsvStatus.textContent = data.error || "Could not read that CSV.";
      return;
    }
    advertisers = data.contributors || [];
    const added = Number(data.added || 0);
    const updated = Number(data.updated || 0);
    contributorCsvStatus.textContent = `Added ${added} and updated ${updated}.`;
    renderAdvertisers();
  }

  if (contributorDrop && contributorFile) {
    ["dragenter", "dragover"].forEach((type) => {
      contributorDrop.addEventListener(type, (event) => {
        event.preventDefault();
        contributorDrop.classList.add("is-over");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      contributorDrop.addEventListener(type, (event) => {
        event.preventDefault();
        contributorDrop.classList.remove("is-over");
      });
    });
    contributorDrop.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      importAdvertiserFile(file).catch(() => {
        if (contributorCsvStatus) contributorCsvStatus.textContent = "Could not read that CSV.";
      });
    });
    contributorFile.addEventListener("change", () => {
      const file = contributorFile.files?.[0];
      importAdvertiserFile(file).catch(() => {
        if (contributorCsvStatus) contributorCsvStatus.textContent = "Could not read that CSV.";
      });
      contributorFile.value = "";
    });
  }
}

function rememberedAlert() {
  try {
    return localStorage.getItem("jmg-home-alert") || "";
  } catch {
    return "";
  }
}

function rememberAlert(key) {
  try {
    localStorage.setItem("jmg-home-alert", key);
  } catch {
    // The alert can still close for this visit.
  }
}

const homeAlert = document.querySelector("#home-alert");
if (homeAlert) {
  const alertTitle = document.querySelector("#home-alert-title");
  const alertMessage = document.querySelector("#home-alert-message");
  const alertLink = document.querySelector("#home-alert-link");
  const alertClose = document.querySelector("#home-alert-close");
  let alertKey = "";

  function dismissAlert() {
    if (alertKey) rememberAlert(alertKey);
    if (homeAlert.open) homeAlert.close();
  }

  alertClose?.addEventListener("click", dismissAlert);
  alertLink?.addEventListener("click", () => {
    if (alertKey) rememberAlert(alertKey);
  });
  homeAlert.addEventListener("cancel", (event) => {
    event.preventDefault();
    dismissAlert();
  });
  homeAlert.addEventListener("click", (event) => {
    if (event.target === homeAlert) dismissAlert();
  });

  function openHomeAlert(notice) {
    if (!notice?.active || (!notice.title && !notice.message)) return;
    if (!notice.updated || rememberedAlert() === notice.updated) return;
    alertKey = notice.updated;
    if (alertTitle) {
      alertTitle.hidden = !notice.title;
      alertTitle.textContent = notice.title || "";
    }
    if (alertMessage) {
      alertMessage.hidden = !notice.message;
      alertMessage.textContent = notice.message || "";
    }
    if (alertLink) {
      const hasLink = Boolean(notice.linkUrl && notice.linkLabel);
      alertLink.hidden = !hasLink;
      if (hasLink) {
        alertLink.href = notice.linkUrl;
        alertLink.textContent = notice.linkLabel;
        if (/^https?:/i.test(notice.linkUrl)) {
          alertLink.target = "_blank";
          alertLink.rel = "noopener noreferrer";
        } else {
          alertLink.removeAttribute("target");
          alertLink.removeAttribute("rel");
        }
      }
    }
    homeAlert.showModal();
  }

  trackBoot(fetch("/api/notice")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const notice = data?.notice;
      if (!notice) return;
      whenSiteReady(() => {
        window.setTimeout(() => openHomeAlert(notice), 420);
      });
    })
    .catch(() => {}));
}

async function loadNotice() {
  const form = document.querySelector("#notice-form");
  if (!form) return;
  const response = await fetch("/api/notice");
  if (!response.ok) return;
  const data = await response.json();
  const notice = data.notice || {};
  form.elements.active.checked = Boolean(notice.active);
  form.elements.title.value = notice.title || "";
  form.elements.message.value = notice.message || "";
  form.elements.linkLabel.value = notice.linkLabel || "";
  form.elements.linkUrl.value = notice.linkUrl || "";
}

const noticeForm = document.querySelector("#notice-form");
if (noticeForm) {
  noticeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("#notice-status");
    const form = new FormData(noticeForm);
    const response = await fetch("/api/notice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        active: form.get("active") === "on",
        title: form.get("title"),
        message: form.get("message"),
        linkLabel: form.get("linkLabel"),
        linkUrl: form.get("linkUrl"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (status) status.textContent = data.error || "Could not save the alert.";
      return;
    }
    if (status) {
      status.textContent = data.notice?.active
        ? "The alert is on the home page."
        : "The alert is hidden.";
    }
  });
}

