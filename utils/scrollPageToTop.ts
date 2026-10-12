// Pages scroll inside .layout-scrollbar containers (the dashboard's
// #dashboard-wrapper, the public salary advance page), not the window, so
// moving between a form's steps scrolls those back to the top.
export function scrollPageToTop() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".layout-scrollbar").forEach((element) => {
      element.scrollTo({ top: 0, behavior: "instant" });
    });
  });
}
