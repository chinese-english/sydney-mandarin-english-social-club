(function () {
  const STORAGE_KEY = "mesc-theme";
  const LIGHT_THEME_COLOR = "#f36a2d";
  const DARK_THEME_COLOR = "#12161b";

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.getElementById("themeColorMeta");
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", toggleTheme);
  });

  applyTheme(getPreferredTheme());
})();
