document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelector(".links");
  const toggle = links.querySelector(".toggle");
  const root = links.querySelector(".root");

  function toggleMenu() {
    links.classList.toggle("open");
    toggle.textContent = links.classList.contains("open") ? "–" : "+";
  }

  toggle.addEventListener("click", toggleMenu);
  root.addEventListener("click", toggleMenu);
});