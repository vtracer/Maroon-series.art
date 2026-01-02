// assets/time.js
(function () {
  // user timezone per your site context
  const TZ = "America/New_York";
  // Force display year to 2084 while using the system's month/day/time
  const FORCED_YEAR = 2084;

  function pad(n) { return n.toString().padStart(2, "0"); }

  // Format date only like: Tue Dec 30 2084
  function formatFutureDate(d) {
    const weekday = d.toLocaleString("en-US", { weekday: "short", timeZone: TZ });
    const month = d.toLocaleString("en-US", { month: "short", timeZone: TZ });
    const dayNum = d.toLocaleString("en-US", { day: "2-digit", timeZone: TZ });
    const year = String(FORCED_YEAR);
    return `${weekday} ${month} ${dayNum} ${year}`;
  }

  function updateClock() {
    const el = document.getElementById("future-clock");
    if (!el) { clearInterval(interval); return; }
    const now = new Date();
    el.textContent = formatFutureDate(now);
  }

  // start — date-only display; update once per minute to catch day changes
  updateClock();
  const interval = setInterval(updateClock, 60 * 1000);
})();
