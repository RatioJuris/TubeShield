(() => {
  const year = document.querySelectorAll("#year");
  const currentYear = new Date().getFullYear();
  year.forEach(el => el.textContent = currentYear);

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  document.querySelectorAll(".nav-links a, .footer-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("/TubeShield/")) return;
    try {
      const target = new URL(href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
      if (target === path) {
        link.setAttribute("aria-current", "page");
      }
    } catch (_) {}
  });
})();
