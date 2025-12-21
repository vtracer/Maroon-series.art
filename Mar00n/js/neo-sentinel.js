(() => {
  const openBtn = document.getElementById("openArticle");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("closeArticle");
  const banner = document.getElementById("contextBanner");
  
  // 2084 Newsroom Audio: one looping bed + random one-shots on open + occasional micro-events
const NS_AUDIO = (() => {
  let ctx, master, bedGain, bedSource;
  let microTimer = null;

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master = ctx.createGain();
    master.gain.value = 0.8; // overall loudness, keep civilized
    master.connect(ctx.destination);

    bedGain = ctx.createGain();
    bedGain.gain.value = 0.0; // fade in/out
    bedGain.connect(master);
  }

  // Create a smooth, loopable noise buffer (we'll filter it into "HVAC/server shimmer")
  function makeNoiseBuffer(seconds = 4) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Pink-ish noise via simple filter (good enough for ambience)
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      data[i] = pink * 0.08; // very low
    }
    return buf;
  }

  function startBed() {
    ensureCtx();

    // If context is suspended (common), resume on user gesture
    if (ctx.state === "suspended") ctx.resume();

    if (bedSource) return; // already running

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(4);
    noise.loop = true;

    // Shape noise into a "tuned room" feel:
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 380; // HVAC smoothness
    low.Q.value = 0.7;

    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 58; // subtle power/infra hum

    const humGain = ctx.createGain();
    humGain.gain.value = 0.04;

    const shimmer = ctx.createBiquadFilter();
    shimmer.type = "bandpass";
    shimmer.frequency.value = 3200; // scanline-ish
    shimmer.Q.value = 1.2;

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.02;

    // Slow movement so it feels alive, not static
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.06; // slow drift
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 70; // modulate filter a bit

    lfo.connect(lfoGain);
    lfoGain.connect(low.frequency);

    // Routing
    noise.connect(low);
    low.connect(bedGain);

    noise.connect(shimmer);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(bedGain);

    hum.connect(humGain);
    humGain.connect(bedGain);

    // Start nodes
    const t = ctx.currentTime;
    noise.start(t);
    hum.start(t);
    lfo.start(t);

    bedSource = { noise, hum, lfo };

    // Fade in
    bedGain.gain.cancelScheduledValues(t);
    bedGain.gain.setValueAtTime(bedGain.gain.value, t);
    bedGain.gain.linearRampToValueAtTime(0.9, t + 0.25);
  }

  function stopBed() {
    if (!ctx || !bedSource) return;

    const t = ctx.currentTime;
    bedGain.gain.cancelScheduledValues(t);
    bedGain.gain.setValueAtTime(bedGain.gain.value, t);
    bedGain.gain.linearRampToValueAtTime(0.0, t + 0.2);

    // Stop after fade
    setTimeout(() => {
      try { bedSource.noise.stop(); } catch {}
      try { bedSource.hum.stop(); } catch {}
      try { bedSource.lfo.stop(); } catch {}
      bedSource = null;
    }, 260);
  }

  // --- One-shot events (randomized) ---
  function oneShotChirp() {
    ensureCtx();
    const t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = Math.random() < 0.5 ? "sine" : "triangle";
    const g = ctx.createGain();

    const start = 1200 + Math.random() * 500;
    const end = 700 + Math.random() * 250;

    osc.frequency.setValueAtTime(start, t0);
    osc.frequency.exponentialRampToValueAtTime(end, t0 + 0.10);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  }

  function oneShotStamp() {
    ensureCtx();
    const t0 = ctx.currentTime;

    // low "thunk"
    const bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.setValueAtTime(90, t0);

    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, t0);
    g1.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
    g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

    // tiny hiss tail
    const dur = 0.16;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*0.2;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    bass.connect(g1).connect(master);
    noise.connect(hp).connect(g2).connect(master);

    bass.start(t0);
    bass.stop(t0 + 0.14);

    noise.start(t0 + 0.02);
    noise.stop(t0 + dur + 0.03);
  }

  function oneShotScan() {
    ensureCtx();
    const t0 = ctx.currentTime;

    // bandpassed noise sweep
    const dur = 0.22;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*0.2;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.3;

    // sweep frequency
    bp.frequency.setValueAtTime(900, t0);
    bp.frequency.exponentialRampToValueAtTime(4200, t0 + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(bp).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  function oneShotCommsPing() {
    ensureCtx();
    const t0 = ctx.currentTime;

    // two quick tones (like a headset acknowledgment)
    const freqs = [880, 1320];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const tt = t0 + idx * 0.055;

      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.22, tt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.06);

      osc.connect(g).connect(master);
      osc.start(tt);
      osc.stop(tt + 0.07);
    });
  }

  function randomEvent() {
    const pick = Math.random();
    if (pick < 0.35) oneShotChirp();
    else if (pick < 0.62) oneShotStamp();
    else if (pick < 0.85) oneShotScan();
    else oneShotCommsPing();
  }

  function startMicroEvents() {
    stopMicroEvents();
    const schedule = () => {
      // Very occasional: 8–20s
      const next = 8000 + Math.random() * 12000;
      microTimer = setTimeout(() => {
        // Don't spam. 50% chance to do nothing.
        if (Math.random() < 0.5) randomEvent();
        schedule();
      }, next);
    };
    schedule();
  }

  function stopMicroEvents() {
    if (microTimer) clearTimeout(microTimer);
    microTimer = null;
  }

  // Public API
  return {
    open() {
      startBed();
      randomEvent();       // play something when opened
      startMicroEvents();  // occasional random bits while open
    },
    close() {
      stopMicroEvents();
      stopBed();
    },
    ping() { // if you want manual triggers
      startBed();
      randomEvent();
    }
  };
})();

  function openSim() {
  if (!overlay) return;
  if (overlay.classList.contains("active")) return; // prevent double-open spam

  NS_AUDIO.open(); // ✅ start loop + play a random one-shot

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
  if (!overlay.classList.contains("active")) return;

  NS_AUDIO.close(); // ✅ stop micro-events + fade out bed

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