(() => {
  const openBtn = document.getElementById("openArticle");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("closeArticle");
  const banner = document.getElementById("contextBanner");

  function openSim() {
    if (!overlay) return;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    openBtn?.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("no-scroll");

    if (banner) {
      banner.classList.add("active");
      setTimeout(() => banner.classList.remove("active"), 1600);
    }
  }

  function closeSim() {
    if (!overlay) return;
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    openBtn?.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("no-scroll");
  }

  openBtn?.addEventListener("click", openSim);
  openBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSim();
    }
  });

  closeBtn?.addEventListener("click", closeSim);

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeSim();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay?.classList.contains("active")) closeSim();
  });

  // ----- Ticker: use inline snapshot if present, otherwise fetch daily JSON -----
  function applyData(data) {
    document.querySelectorAll(".ticker .tick").forEach((el) => {
      const sym = el.dataset.real;
      const q = data?.[sym];
      if (!q) return;

      const pct = Number(q.pct);
      el.classList.remove("up", "down", "flat");
      el.classList.add(pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat");

      const chg = el.querySelector(".chg");
      if (chg) chg.textContent = `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}%`;
    });
  }

  function applyInlineSnapshot() {
    const raw = document.getElementById("tickerSnapshot")?.textContent;
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      applyData(data);
      return true;
    } catch {
      return false;
    }
  }

  async function loadDailyTicker() {
    // If you have inline JSON, use it and stop.
    if (applyInlineSnapshot()) return;

    const KEY = "neoTickerCache_v1";
    const cached = localStorage.getItem(KEY);
    const now = Date.now();

    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (now - obj.savedAt < 24 * 60 * 60 * 1000 && obj.data) {
          applyData(obj.data);
          return;
        }
      } catch {}
    }

    const day = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/Mar00n/ticker-snapshot.json?v=${day}`);
    if (!res.ok) return;

    const data = await res.json();
    localStorage.setItem(KEY, JSON.stringify({ savedAt: now, data }));
    applyData(data);
  }

  // ----- Glitch: only while overlay is open -----
  const glitchChars = "¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ABCDEFGHIKLMNOPQRSTUV";

  function glitchTick(el) {
    const original = el.innerText;
    if (!original || original.length < 4) return;

    setInterval(() => {
      if (!overlay?.classList.contains("active")) return;
      if (Math.random() < 0.975) return;

      const arr = original.split("");
      for (let i = 0; i < 2; i++) {
        const idx = Math.floor(Math.random() * arr.length);
        arr[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      el.innerText = arr.join("");
      setTimeout(() => (el.innerText = original), 120);
    }, 240);
  }

  document.querySelectorAll('[data-glitch="1"]').forEach(glitchTick);

  // boot
  loadDailyTicker();
})();