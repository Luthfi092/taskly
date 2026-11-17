
/* GANTI TEMA TERANG DAN GELAP */

$("theme").onclick = () => {

  const r = document.documentElement;

  const darkMode = matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const current = r.dataset.theme ||
    (darkMode ? "dark" : "light");

  r.dataset.theme =
    current === "dark" ? "light" : "dark";

};
