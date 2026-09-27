export const school = {
  name: "Jellico High School",
  mascot: "Blue Devils",
  maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/",
};

export const socials = {
  youtube: "https://www.youtube.com/@JellicoMediaGroup",
  youtubeLive: "https://www.youtube.com/channel/UC527cxNHL1qXTc2oImMx1KA/live",
  facebook: "https://www.facebook.com/profile.php?id=61568785681094",
  instagram: "https://www.instagram.com/jellicomg",
  tiktok: "https://www.tiktok.com/@jellicomediagroup",
  email: "jellicomediagroup@gmail.com",
};

export const sports = [
  {
    slug: "football",
    name: "Football",
    tag: "sport:football",
    maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/football/",
  },
  {
    slug: "basketball",
    name: "Basketball",
    tag: "sport:basketball",
    maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/basketball/",
  },
  {
    slug: "girls-basketball",
    name: "Girls Basketball",
    tag: "sport:girls-basketball",
    maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/basketball/girls/",
  },
  {
    slug: "baseball",
    name: "Baseball",
    tag: "sport:baseball",
    maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/baseball/",
  },
  {
    slug: "softball",
    name: "Softball",
    tag: "sport:softball",
    maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/softball/",
  },
  {
    slug: "volleyball",
    name: "Volleyball",
    tag: "sport:volleyball",
    maxpreps: "https://www.maxpreps.com/tn/jellico/jellico-blue-devils/volleyball/",
  },
];

export const shows = [
  {
    slug: "has-beens",
    name: "The Has-Beens with Dre & Trey",
    description: "Sports talk covering local, college, and professional games.",
    tag: "podcast:has-beens",
    spotify: "https://open.spotify.com/show/3L11FuJ9Ki6OqFaKNjyQzf",
    embed: "https://open.spotify.com/embed/show/3L11FuJ9Ki6OqFaKNjyQzf?utm_source=generator",
  },
  {
    slug: "11th-hour",
    name: "The 11th Hour",
    description: "A Christian show about everyday pressure, faith, and real life.",
    tag: "podcast:11th-hour",
    spotify: "https://open.spotify.com/show/3OVae9n1UdyCRsJ4qUnt3H",
    embed: "https://open.spotify.com/embed/show/3OVae9n1UdyCRsJ4qUnt3H?utm_source=generator",
  },
];

export function tagVideo(title) {
  const t = title.toLowerCase();
  const tags = [];
  const hasBeens = /has-?\s*been/.test(t);
  const eleventh = /11th hour/.test(t) || /#christianity/.test(t) || /comparison pt/.test(t);
  const proClip = /nfl|college football|jeremiah smith/.test(t);

  if (hasBeens) tags.push("podcast:has-beens");
  if (eleventh) tags.push("podcast:11th-hour");
  if (hasBeens || eleventh || /#podcast\b/.test(t)) tags.push("kind:podcast");

  if (/volleyball/.test(t)) tags.push("sport:volleyball");
  if (/softball/.test(t)) tags.push("sport:softball");
  if (/\bbaseball\b/.test(t)) tags.push("sport:baseball");
  if (/girls?\s*basketball/.test(t)) tags.push("sport:girls-basketball");
  else if (/\bbasketball\b/.test(t) && !hasBeens && !eleventh) tags.push("sport:basketball");
  if (/\bfootball\b/.test(t) && !hasBeens && !proClip) tags.push("sport:football");

  if (tags.some((tag) => tag.startsWith("sport:"))) tags.push("kind:sports");
  if (/highlight|touchdown|breaks loose|one man army/.test(t)) tags.push("kind:highlight");
  if (/\bvs\.?\b/.test(t)) tags.push("kind:game");
  return tags;
}
