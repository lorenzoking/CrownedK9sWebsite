(function () {
  var SKIP = "header, footer, .logo-container, .pack-family-photo-trigger, .lightbox, .lightbox-overlay, #site-lightbox, #pack-photo-lightbox, #boarding-gallery";
  if (!document.getElementById("site-lightbox-styles")) {
    var style = document.createElement("style");
    style.id = "site-lightbox-styles";
    style.textContent = ".is-enlargeable{cursor:zoom-in}body.site-lightbox-open{overflow:hidden}.site-lightbox[hidden]{display:none}.site-lightbox{position:fixed;inset:0;z-index:4000;display:grid;place-items:center}.site-lightbox__backdrop{position:absolute;inset:0;border:0;background:rgba(28,24,20,.9);cursor:zoom-out}.site-lightbox__frame{position:relative;z-index:1;margin:0;max-width:94vw;max-height:92vh}.site-lightbox__frame img{display:block;width:auto;height:auto;max-width:94vw;max-height:92vh;object-fit:contain;border-radius:12px;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,.35)}.site-lightbox__close{position:absolute;top:.6rem;right:.6rem;width:44px;height:44px;border:0;border-radius:999px;background:rgba(36,31,26,.72);color:#fff;font-size:1.6rem;line-height:1;cursor:pointer}";
    document.head.appendChild(style);
  }

  function enlargeable(img) {
    if (!img || img.tagName !== "IMG") return false;
    if (!img.getAttribute("src")) return false;
    if (img.closest(SKIP)) return false;
    if (img.classList.contains("lightbox-img")) return false;
    var width = img.naturalWidth || img.clientWidth || 0;
    if (width && width < 64) return false;
    return true;
  }

  function ensure() {
    var box = document.getElementById("site-lightbox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "site-lightbox";
    box.className = "site-lightbox";
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="site-lightbox__backdrop" data-close aria-label="Close enlarged image"></button>' +
      '<figure class="site-lightbox__frame" role="dialog" aria-modal="true" aria-label="Enlarged image">' +
      '<button type="button" class="site-lightbox__close" data-close aria-label="Close">&times;</button>' +
      '<img alt="">' +
      "</figure>";
    document.body.appendChild(box);
    box.addEventListener("click", function (event) {
      if (event.target.closest("[data-close]")) close();
    });
    return box;
  }

  function open(img) {
    var box = ensure();
    var view = box.querySelector("img");
    view.src = img.getAttribute("data-full") || img.currentSrc || img.src;
    view.alt = img.alt || "Enlarged image";
    box.hidden = false;
    document.body.classList.add("site-lightbox-open");
    box.querySelector(".site-lightbox__close").focus();
  }

  function close() {
    var box = document.getElementById("site-lightbox");
    if (!box || box.hidden) return;
    box.hidden = true;
    box.querySelector("img").removeAttribute("src");
    document.body.classList.remove("site-lightbox-open");
  }

  function mark() {
    document.querySelectorAll("img").forEach(function (img) {
      if (!enlargeable(img)) return;
      img.classList.add("is-enlargeable");
      if (!img.hasAttribute("tabindex")) img.tabIndex = 0;
    });
  }

  document.addEventListener("click", function (event) {
    var img = event.target.closest("img");
    if (!enlargeable(img)) return;
    event.preventDefault();
    event.stopPropagation();
    open(img);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") close();
    if ((event.key === "Enter" || event.key === " ") && enlargeable(document.activeElement)) {
      event.preventDefault();
      open(document.activeElement);
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mark);
  else mark();
})();
