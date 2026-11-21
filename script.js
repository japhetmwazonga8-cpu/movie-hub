// Get a free key at https://www.themoviedb.org/settings/api and paste it here
const API_KEY = "YOUR_TMDB_API_KEY";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const BIG = "https://image.tmdb.org/t/p/original";
const demoMode = API_KEY === "YOUR_TMDB_API_KEY";

const demoMovies = [
  { id: 1, title: "Midnight Chase", overview: "A getaway driver has one night to clear his name.", release_date: "2025-05-10", vote_average: 7.8 },
  { id: 2, title: "Nairobi Nights", overview: "Three friends chase their dreams in a busy city.", release_date: "2024-11-02", vote_average: 8.1 },
  { id: 3, title: "The Last Signal", overview: "A lone engineer receives a message from deep space.", release_date: "2025-08-21", vote_average: 7.2 },
  { id: 4, title: "Savanna Run", overview: "A young runner trains to win a national title.", release_date: "2023-03-14", vote_average: 7.5 },
  { id: 5, title: "Code Breakers", overview: "Students uncover a secret hidden in their school's network.", release_date: "2024-06-30", vote_average: 6.9 },
  { id: 6, title: "Ocean Deep", overview: "A research crew finds something strange below the waves.", release_date: "2025-01-17", vote_average: 7.4 },
  { id: 7, title: "Family Matters", overview: "A comedy about one very loud family reunion.", release_date: "2022-12-09", vote_average: 6.8 },
  { id: 8, title: "Iron Road", overview: "A train journey across the continent turns dangerous.", release_date: "2024-09-05", vote_average: 7.9 }
];

const rowsConfig = [
  { title: "Trending This Week", path: "/trending/movie/week" },
  { title: "Popular", path: "/movie/popular" },
  { title: "Top Rated", path: "/movie/top_rated" },
  { title: "Action", path: "/discover/movie?with_genres=28" },
  { title: "Comedy", path: "/discover/movie?with_genres=35" },
  { title: "Horror", path: "/discover/movie?with_genres=27" }
];

const rowsEl = document.getElementById("rows");
const heroEl = document.getElementById("hero");
const resultsEl = document.getElementById("results");
const gridEl = document.getElementById("grid");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

async function get(path) {
  if (demoMode) return demoMovies;
  try {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(BASE + path + sep + "api_key=" + API_KEY);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    return [];
  }
}

function makeCard(movie) {
  const card = el("div", "card");
  if (movie.poster_path) {
    const img = document.createElement("img");
    img.src = IMG + movie.poster_path;
    img.alt = movie.title;
    img.loading = "lazy";
    card.appendChild(img);
  } else {
    card.appendChild(el("div", "noposter", movie.title));
  }
  card.appendChild(el("p", "", movie.title));
  card.addEventListener("click", () => openModal(movie));
  return card;
}

function setHero(movie) {
  heroEl.innerHTML = "";
  if (movie.backdrop_path) {
    heroEl.style.backgroundImage = "linear-gradient(to top, #0b0b12, rgba(0,0,0,.3)), url(" + BIG + movie.backdrop_path + ")";
  } else {
    heroEl.style.backgroundImage = "linear-gradient(to top, #0b0b12, #3a1c4a)";
  }
  heroEl.appendChild(el("h1", "", movie.title));
  heroEl.appendChild(el("p", "", movie.overview));
  const btn = el("button", "btn", "More Info");
  btn.addEventListener("click", () => openModal(movie));
  heroEl.appendChild(btn);
}

async function loadRows() {
  for (let i = 0; i < rowsConfig.length; i++) {
    const cfg = rowsConfig[i];
    const movies = await get(cfg.path);
    if (!movies.length) continue;
    if (i === 0) setHero(movies[0]);
    const row = el("section", "row");
    row.appendChild(el("h2", "", cfg.title));
    const scroll = el("div", "scroll");
    movies.forEach(m => scroll.appendChild(makeCard(m)));
    row.appendChild(scroll);
    rowsEl.appendChild(row);
    if (demoMode) break; // demo data only fills one row
  }
}

async function openModal(movie) {
  modalBody.innerHTML = "";
  modalBody.appendChild(el("h2", "", movie.title));
  const year = (movie.release_date || "").slice(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  modalBody.appendChild(el("div", "meta", "\u2605 " + rating + "  |  " + year));
  modalBody.appendChild(el("p", "", movie.overview || "No description available."));

  const btn = el("button", "btn", "Watch Trailer");
  btn.addEventListener("click", async () => {
    if (demoMode) {
      window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(movie.title + " trailer"), "_blank");
      return;
    }
    const videos = await get("/movie/" + movie.id + "/videos");
    const trailer = videos.find(v => v.site === "YouTube" && v.type === "Trailer") || videos.find(v => v.site === "YouTube");
    if (!trailer) { btn.textContent = "No trailer found"; return; }
    const box = el("div", "video");
    const frame = document.createElement("iframe");
    frame.src = "https://www.youtube.com/embed/" + trailer.key;
    frame.allowFullscreen = true;
    box.appendChild(frame);
    modalBody.appendChild(box);
    btn.remove();
  });
  modalBody.appendChild(btn);
  const listBtn = el("button", "btn alt", inList(movie.id) ? "\u2713 In My List" : "+ My List");
  listBtn.addEventListener("click", () => {
    toggleList(movie);
    listBtn.textContent = inList(movie.id) ? "\u2713 In My List" : "+ My List";
  });
  modalBody.appendChild(listBtn);
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
}
document.getElementById("close").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

let timer;
document.getElementById("search").addEventListener("input", e => {
  clearTimeout(timer);
  const q = e.target.value.trim();
  timer = setTimeout(async () => {
    if (!q) {
      resultsEl.classList.add("hidden");
      rowsEl.classList.remove("hidden");
      heroEl.classList.remove("hidden");
      return;
    }
    let movies;
    if (demoMode) {
      movies = demoMovies.filter(m => m.title.toLowerCase().includes(q.toLowerCase()));
    } else {
      movies = await get("/search/movie?query=" + encodeURIComponent(q));
    }
    gridEl.innerHTML = "";
    document.getElementById("resultsTitle").textContent = movies.length ? 'Results for "' + q + '"' : "No movies found";
    movies.forEach(m => gridEl.appendChild(makeCard(m)));
    rowsEl.classList.add("hidden");
    heroEl.classList.add("hidden");
    resultsEl.classList.remove("hidden");
  }, 400);
});
// ---------- My List ----------
function getList() {
  try { return JSON.parse(localStorage.getItem("myList")) || []; } catch (e) { return []; }
}
function inList(id) { return getList().some(m => m.id === id); }
function toggleList(movie) {
  let list = getList();
  if (inList(movie.id)) list = list.filter(m => m.id !== movie.id);
  else list.push(movie);
  try { localStorage.setItem("myList", JSON.stringify(list)); } catch (e) {}
}

document.getElementById("listBtn").addEventListener("click", () => {
  const list = getList();
  gridEl.innerHTML = "";
  document.getElementById("resultsTitle").textContent =
    list.length ? "My List" : "Your list is empty. Open a movie and tap + My List.";
  list.forEach(m => gridEl.appendChild(makeCard(m)));
  rowsEl.classList.add("hidden");
  heroEl.classList.add("hidden");
  resultsEl.classList.remove("hidden");
});

document.querySelector(".logo").addEventListener("click", () => {
  document.getElementById("search").value = "";
  resultsEl.classList.add("hidden");
  rowsEl.classList.remove("hidden");
  heroEl.classList.remove("hidden");
});

// ---------- Dark / Light theme ----------
const themeBtn = document.getElementById("themeBtn");
let theme = "dark";
try { theme = localStorage.getItem("theme") || "dark"; } catch (e) {}
function applyTheme(t) {
  document.body.classList.toggle("light", t === "light");
  themeBtn.textContent = t === "light" ? "\u263E" : "\u2600";
}
applyTheme(theme);
themeBtn.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  applyTheme(theme);
  try { localStorage.setItem("theme", theme); } catch (e) {}
});
loadRows();