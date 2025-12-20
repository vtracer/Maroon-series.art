<script>
  function applyData(data){
    document.querySelectorAll(".ticker .tick").forEach(el => {
      const sym = el.dataset.real;
      const q = data[sym];
      if(!q) return;

      const pct = Number(q.pct);
      el.classList.remove("up","down","flat");
      el.classList.add(pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat");

      const chg = el.querySelector(".chg");
      if(chg) chg.textContent = `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}%`;
    });
  }

  async function loadDailyTicker(){
    const KEY = "neoTickerCache_v1";
    const cached = localStorage.getItem(KEY);
    const now = Date.now();

    if (cached){
      try{
        const obj = JSON.parse(cached);
        if (now - obj.savedAt < 24*60*60*1000 && obj.data){
          applyData(obj.data);
          return;
        }
      } catch {}
    }

    // IMPORTANT: path must match where the JSON file lives relative to THIS html file
    const day = new Date().toISOString().slice(0,10);
    const res = await fetch(`/Mar00n/ticker-snapshot.json?v=${day}`);
    if(!res.ok) return;

    const data = await res.json();
    localStorage.setItem(KEY, JSON.stringify({ savedAt: now, data }));
    applyData(data);
  }

  // Run after DOM is ready
  window.addEventListener("DOMContentLoaded", loadDailyTicker);
</script>