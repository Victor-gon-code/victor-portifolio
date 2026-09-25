(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const starLinks = Array.from(document.querySelectorAll(".star-link"));
  const linePaths = Array.from(document.querySelectorAll(".constellation-lines path"));
  const lineSvg = document.getElementById("constellation-lines");
  const morphHeader = document.getElementById("morph-header");
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const processTrack = document.querySelector(".process-track");
  const year = document.getElementById("year");

  if (year) year.textContent = new Date().getFullYear();

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;

  let viewport = { width: window.innerWidth, height: window.innerHeight };
  let currentPositions = [];
  let rafPending = false;
  let cachedRest = [];
  let cachedTargets = [];
  let cachedStarCenters = [];
  let geometryDirty = true;
  let lastMorphProgress = -1;
  let lastLayoutMode = "";

  // Positions measured from the user's marked reference image (1672 × 941).
  // The desktop mapping accounts for background-size: cover, so each clickable
  // star stays on the chosen point even if the browser aspect ratio changes.
  const HERO_IMAGE = { width: 1672, height: 941 };
  const HERO_POINTS = [
    [1171 / 1672, 514 / 941],  // Sobre mim — moved right/down as marked
    [1240 / 1672, 148 / 941],  // Projetos — upper-left peak
    [1343 / 1672, 322 / 941],  // Como funciona — moved right/up as marked
    [1478 / 1672, 234 / 941],  // Informações — upper-right peak
    [1490 / 1672, 536 / 941]   // Contato — lower-right stroke
  ];

  function heroImagePoint(nx, ny) {
    const w = viewport.width;
    const h = viewport.height;
    const scale = Math.max(w / HERO_IMAGE.width, h / HERO_IMAGE.height);
    const renderedWidth = HERO_IMAGE.width * scale;
    const renderedHeight = HERO_IMAGE.height * scale;
    const offsetX = (w - renderedWidth) / 2;
    const offsetY = (h - renderedHeight) / 2;
    return [offsetX + nx * renderedWidth, offsetY + ny * renderedHeight];
  }

  function restingPositions() {
    const w = viewport.width;
    const h = viewport.height;

    // Mobile gets a compact M placed below the hero copy, away from the CTA.
    // Tablet keeps a wider M, while desktop continues to use the artwork points.
    if (w <= 480) {
      return [
        [w * 0.14, h * 0.72],
        [w * 0.31, h * 0.62],
        [w * 0.50, h * 0.71],
        [w * 0.69, h * 0.61],
        [w * 0.86, h * 0.72]
      ];
    }

    if (w <= 820) {
      return [
        [w * 0.14, h * 0.70],
        [w * 0.32, h * 0.57],
        [w * 0.50, h * 0.68],
        [w * 0.68, h * 0.56],
        [w * 0.86, h * 0.70]
      ];
    }

    return HERO_POINTS.map(([x, y]) => heroImagePoint(x, y));
  }

  function mPositions() {
    // The marked points already describe the discreet M; scrolling first draws
    // the connecting lines, then the same stars rise into the header.
    return restingPositions();
  }

  function targetPositions() {
    const w = viewport.width;

    // Phones use a dedicated second row in the compact header. Tablet keeps
    // the same idea with slightly tighter spacing; desktop stays unchanged.
    if (w <= 480) {
      const xs = [0.12, 0.31, 0.50, 0.69, 0.88];
      return xs.map((x) => [w * x, 84]);
    }

    if (w <= 820) {
      const xs = [0.18, 0.34, 0.50, 0.66, 0.82];
      return xs.map((x) => [w * x, 82]);
    }

    const xs = w < 1120
      ? [0.35, 0.445, 0.54, 0.635, 0.73]
      : [0.34, 0.445, 0.55, 0.655, 0.76];

    return xs.map((x) => [w * x, 41]);
  }

  function morphProgress() {
    if (reducedMotion) return window.scrollY > 24 ? 1 : 0;
    const factor = viewport.width <= 480 ? 0.56 : viewport.width <= 820 ? 0.64 : 0.72;
    const minimum = viewport.width <= 480 ? 420 : viewport.width <= 820 ? 470 : 520;
    const distance = Math.max(viewport.height * factor, minimum);
    return clamp(window.scrollY / distance, 0, 1);
  }

  function measureStarCenters() {
    cachedStarCenters = starLinks.map((link) => {
      const star = link.querySelector(".star-link__star");
      return [
        star ? star.offsetLeft + star.offsetWidth / 2 : (link.offsetWidth || 90) / 2,
        star ? star.offsetTop + star.offsetHeight / 2 : (link.offsetHeight || 24) / 2
      ];
    });
  }

  function refreshGeometry() {
    viewport = { width: window.innerWidth, height: window.innerHeight };
    cachedRest = restingPositions();
    cachedTargets = targetPositions();
    measureStarCenters();
    geometryDirty = false;
  }

  function setNavPosition(link, index, x, y, scale) {
    const center = cachedStarCenters[index] || [22,22];
    link.style.transformOrigin = center[0].toFixed(2) + "px " + center[1].toFixed(2) + "px";
    link.style.transform =
      "translate3d(" + (x - center[0]).toFixed(2) + "px," +
      (y - center[1]).toFixed(2) + "px,0) scale(" + scale.toFixed(3) + ")";
  }

  function updateLines(progress) {
    const w = viewport.width;
    const h = viewport.height;
    lineSvg.setAttribute("viewBox", "0 0 " + w + " " + h);

    // The M appears immediately as the user starts scrolling, while the very
    // same stars are already travelling toward the header. There is no
    // separate "drop/formation" phase before alignment anymore.
    const drawT = smoothstep(clamp((progress - 0.005) / 0.11, 0, 1));
    const fadeT = smoothstep(clamp((progress - 0.16) / 0.46, 0, 1));
    const opacity = mix(0.0, 0.38, drawT) * (1 - fadeT);

    if (opacity < 0.002) {
      linePaths.forEach((path) => { path.style.opacity = "0"; });
      return;
    }

    linePaths.forEach((path, index) => {
      const a = currentPositions[index];
      const b = currentPositions[index + 1];
      if (!a || !b) return;

      path.setAttribute(
        "d",
        "M " + a[0].toFixed(2) + " " + a[1].toFixed(2) +
        " L " + b[0].toFixed(2) + " " + b[1].toFixed(2)
      );

      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const length = Math.max(1, Math.hypot(dx, dy));

      path.style.strokeDasharray = length.toFixed(2) + " " + length.toFixed(2);
      path.style.strokeDashoffset = (length * (1 - drawT)).toFixed(2);
      path.style.opacity = opacity.toFixed(3);
    });
  }

  function updateMorph() {
    rafPending = false;

    const raw = morphProgress();
    const layoutMode = raw >= 0.80 ? "header" : "hero";

    // Once the morph is capped, page scrolling no longer rewrites identical
    // transforms on every frame. Resize or layout-mode changes still force it.
    if (!geometryDirty && Math.abs(raw - lastMorphProgress) < 0.0005 && layoutMode === lastLayoutMode) {
      return;
    }

    const formed = raw >= 0.04 && raw < 0.32;
    const transitioning = raw >= 0.04 && raw < 0.80;
    const headerReady = raw >= 0.80;

    document.body.classList.toggle("constellation-formed", formed);
    document.body.classList.toggle("header-transitioning", transitioning);
    document.body.classList.toggle("header-ready", headerReady);

    if (geometryDirty) {
      refreshGeometry();
    } else if (layoutMode !== lastLayoutMode) {
      // Only the label orientation changes at the final header state; measure
      // the five centers once instead of reading layout on every scroll frame.
      measureStarCenters();
    }

    const alignT = smoothstep(clamp((raw - 0.015) / 0.80, 0, 1));

    currentPositions = starLinks.map((link, index) => {
      const x = mix(cachedRest[index][0], cachedTargets[index][0], alignT);
      const y = mix(cachedRest[index][1], cachedTargets[index][1], alignT);
      const scale = mix(1, viewport.width <= 820 ? 0.92 : 0.9, alignT);
      setNavPosition(link, index, x, y, scale);
      return [x, y];
    });

    updateLines(raw);

    const headerProgress = smoothstep(clamp((raw - 0.48) / 0.30, 0, 1));
    root.style.setProperty("--header-progress", headerProgress.toFixed(3));

    if (morphHeader) {
      morphHeader.setAttribute("aria-hidden", headerProgress > 0.5 ? "false" : "true");
    }

    lastMorphProgress = raw;
    lastLayoutMode = layoutMode;
  }

  function requestMorphUpdate() {
    if (rafPending) return;

    // Once the hero morph has fully finished, scrolling the rest of the page
    // does not schedule animation frames. Scrolling back toward the hero
    // automatically resumes the morph.
    const raw = morphProgress();
    if (!geometryDirty && raw >= 1 && lastMorphProgress >= 1) return;

    rafPending = true;
    requestAnimationFrame(updateMorph);
  }

  window.addEventListener("scroll", requestMorphUpdate, { passive: true });
  window.addEventListener("resize", () => {
    geometryDirty = true;
    lastMorphProgress = -1;
    requestMorphUpdate();
  }, { passive: true });

  starLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.dataset.target;
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const offset = viewport.width <= 480 ? 104 : viewport.width <= 820 ? 106 : 82;
      const top = target.getBoundingClientRect().top + window.scrollY - offset + 1;

      window.scrollTo({
        top,
        behavior: reducedMotion ? "auto" : "smooth"
      });

      history.replaceState(null, "", "#" + id);
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      if (entry.target === processTrack) {
        processTrack.classList.add("is-visible");
      }
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -7% 0px" });

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
  if (processTrack) revealObserver.observe(processTrack);

  const activeObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visible.length) return;

    const id = visible[0].target.id;
    starLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.target === id);
    });
  }, {
    threshold: [0.22, 0.45, 0.7],
    rootMargin: "-18% 0px -55% 0px"
  });

  sections.filter((section) => section.id !== "inicio").forEach((section) => activeObserver.observe(section));

  // The hero background is a single approved static image.
  // Only the five interactive navigation stars are animated.

  refreshGeometry();
  requestMorphUpdate();
})();