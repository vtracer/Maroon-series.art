function randomFluctuate(value, max = 100) {
  let delta = (Math.random() - 0.5) * 10; // +/- up to 5%
  let newVal = Math.min(max, Math.max(0, value + delta));
  return Math.round(newVal);
}

function renderBar(percentage, length = 10) {
  let filled = Math.round((percentage / 100) * length);
  let empty = length - filled;
  return "█".repeat(filled) + "░".repeat(empty) + " " + percentage + "%";
}

function updateResourceMonitor() {
  if (!window.cpu) window.cpu = 70 + Math.random() * 20;
  if (!window.mem) window.mem = 40 + Math.random() * 20;

  window.cpu = randomFluctuate(window.cpu);
  window.mem = randomFluctuate(window.mem);

  const monitor = document.getElementById("resource-monitor");
  monitor.textContent =
    `CPU: ${renderBar(window.cpu)}\n` +
    `MEM: ${renderBar(window.mem)}`;
}

setInterval(updateResourceMonitor, 1500);
updateResourceMonitor();
