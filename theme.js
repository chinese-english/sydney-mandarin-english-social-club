(function () {
  const THEME_STORAGE_KEY = "mesc-theme";
  const FONT_STORAGE_KEY = "mesc-font-scale";
  const LIGHT_THEME_COLOR = "#f36a2d";
  const DARK_THEME_COLOR = "#12161b";
  const FONT_STEPS = [0.94, 1, 1.08, 1.16];

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getPreferredFontScale() {
    const saved = Number(localStorage.getItem(FONT_STORAGE_KEY));
    if (!Number.isFinite(saved)) {
      return 1;
    }

    return clampFontScale(saved);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.getElementById("themeColorMeta");
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.textContent = "Theme";
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function applyFontScale(scale) {
    const normalized = clampFontScale(scale);
    document.documentElement.style.setProperty("--font-scale", String(normalized));

    document.querySelectorAll("[data-font-size]").forEach(function (button) {
      const action = button.getAttribute("data-font-size");
      if (action === "reset") {
        button.disabled = normalized === 1;
      }
    });
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  function clampFontScale(value) {
    const closest = FONT_STEPS.reduce(function (best, current) {
      return Math.abs(current - value) < Math.abs(best - value) ? current : best;
    }, FONT_STEPS[1]);
    return closest;
  }

  function changeFontScale(direction) {
    const current = getCurrentFontScale();
    const currentIndex = FONT_STEPS.indexOf(current);
    const nextIndex = Math.max(0, Math.min(FONT_STEPS.length - 1, currentIndex + direction));
    const nextScale = FONT_STEPS[nextIndex];
    localStorage.setItem(FONT_STORAGE_KEY, String(nextScale));
    applyFontScale(nextScale);
  }

  function resetFontScale() {
    localStorage.setItem(FONT_STORAGE_KEY, "1");
    applyFontScale(1);
  }

  function getCurrentFontScale() {
    const cssValue = Number(getComputedStyle(document.documentElement).getPropertyValue("--font-scale"));
    if (!Number.isFinite(cssValue) || !cssValue) {
      return 1;
    }

    return clampFontScale(cssValue);
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", toggleTheme);
  });

  document.querySelectorAll("[data-font-size]").forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.getAttribute("data-font-size");
      if (action === "decrease") {
        changeFontScale(-1);
      } else if (action === "increase") {
        changeFontScale(1);
      } else {
        resetFontScale();
      }
    });
  });

  applyTheme(getPreferredTheme());
  applyFontScale(getPreferredFontScale());
})();
