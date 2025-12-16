// assets/time.js
(function () {
  // user timezone per your site context
  const TZ = "America/New_York";
  const OFFSET_YEARS = 60;

  function pad(n) { return n.toString().padStart(2, "0"); }

  // Format like: Sat Sep 28 00:31:02 EDT 2085
  function formatFutureDate(d) {
    // weekday, month, day
    const weekday = d.toLocaleString("en-US", { weekday: "short", timeZone: TZ });
    const month = d.toLocaleString("en-US", { month: "short", timeZone: TZ });
    const day = pad(d.getUTCDate()); // fallback
    // Use toLocaleString to get time components in TZ
    const parts = d.toLocaleString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: TZ
    }).replace(/\u200E/g, ""); // strip weird LTR marks
    // Year and timezone name
    const year = d.toLocaleString("en-US", { year: "numeric", timeZone: TZ });
    const tzName = d.toLocaleTimeString("en-US", { timeZone: TZ, timeZoneName: "short" }).split(" ").pop();
    // Build "Sat Sep 28 00:31:02 EDT 2085"
    // Extract day-of-month from original localized string for correctness:
    const dayNum = d.toLocaleString("en-US", { day: "2-digit", timeZone: TZ });
    return `${weekday} ${month} ${dayNum} ${parts} ${tzName} ${year}`;
  }

  function nowPlusYears(years) {
    const base = new Date();
    // create target date at same moment + years
    const target = new Date(base.getTime());
    target.setFullYear(target.getFullYear() + years);
    return target;
  }

  function updateClock() {
    const el = document.getElementById("future-clock");
    if (!el) { clearInterval(interval); return; }
    const future = nowPlusYears(OFFSET_YEARS);
    el.textContent = formatFutureDate(future);
  }

  // start
  updateClock();
  const interval = setInterval(updateClock, 1000);
})();
