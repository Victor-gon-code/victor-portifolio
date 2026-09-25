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

    if (w <= 820) {
      return [
        [w * 0.16, h * 0.69],
        [w * 0.33, h * 0.57],
        [w * 0.50, h * 0.67],
        [w * 0.68, h * 0.56],
        [w * 0.84, h * 0.70]
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
    if (w <= 820) {
      const xs = [0.09, 0.29, 0.49, 0.69, 0.89];
      return xs.map((x) => [w * x, 82]);
    }

    const xs = w < 1120
      ? [0.35, 0.445, 0.54, 0.635, 0.73]
      : [0.34, 0.445, 0.55, 0.655, 0.76];

    return xs.map((x) => [w * x, 41]);
  }

  function morphProgress() {
    if (reducedMotion) return window.scrollY > 24 ? 1 : 0;
    const distance = Math.max(viewport.height * 0.72, 520);
    return clamp(window.scrollY / distance, 0, 1);
  }

  function setNavPosition(link, x, y, scale) {
    const star = link.querySelector(".star-link__star");
    const starCenterX = star ? star.offsetLeft + star.offsetWidth / 2 : (link.offsetWidth || 90) / 2;
    const starCenterY = star ? star.offsetTop + star.offsetHeight / 2 : (link.offsetHeight || 24) / 2;

    // Anchor the transform to the actual star, not to the text label, so the
    // luminous point lands exactly on the coordinates marked in the artwork.
    link.style.transformOrigin = starCenterX.toFixed(2) + "px " + starCenterY.toFixed(2) + "px";
    link.style.transform =
      "translate3d(" + (x - starCenterX).toFixed(2) + "px," +
      (y - starCenterY).toFixed(2) + "px,0) scale(" + scale.toFixed(3) + ")";
  }

  function updateLines(progress) {
    const w = viewport.width;
    const h = viewport.height;
    lineSvg.setAttribute("viewBox", "0 0 " + w + " " + h);

    // First the four segments are literally drawn by the scroll, revealing the M.
    // When the stars begin to rise into the header, the guide remains connected
    // but fades so it never competes with the content.
    const drawT = smoothstep(clamp((progress - 0.02) / 0.24, 0, 1));
    const departT = smoothstep(clamp((progress - 0.30) / 0.54, 0, 1));
    const opacity = mix(0.0, 0.42, drawT) * (1 - departT);

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
    const rest = restingPositions();
    const formed = mPositions();
    const end = targetPositions();

    const formT = smoothstep(clamp((raw - 0.02) / 0.24, 0, 1));
    const headerT = smoothstep(clamp((raw - 0.30) / 0.54, 0, 1));

    currentPositions = starLinks.map((link, index) => {
      const mx = mix(rest[index][0], formed[index][0], formT);
      const my = mix(rest[index][1], formed[index][1], formT);
      const x = mix(mx, end[index][0], headerT);
      const y = mix(my, end[index][1], headerT);
      const scale = mix(1, viewport.width <= 820 ? 0.92 : 0.9, headerT);
      setNavPosition(link, x, y, scale);

      link.style.setProperty("--star-formation", formT.toFixed(3));
      link.style.setProperty("--star-header", headerT.toFixed(3));
      return [x, y];
    });

    updateLines(raw);

    const headerProgress = smoothstep(clamp((raw - 0.58) / 0.36, 0, 1));
    root.style.setProperty("--header-progress", headerProgress.toFixed(3));

    if (morphHeader) {
      morphHeader.setAttribute("aria-hidden", headerProgress > 0.5 ? "false" : "true");
    }

    document.body.classList.toggle("constellation-formed", raw >= 0.10 && raw < 0.60);
    document.body.classList.toggle("header-transitioning", raw >= 0.28 && raw < 0.84);
    document.body.classList.toggle("header-ready", raw > 0.84);
  }

  function requestMorphUpdate() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(updateMorph);
  }

  window.addEventListener("scroll", requestMorphUpdate, { passive: true });
  window.addEventListener("resize", () => {
    viewport = { width: window.innerWidth, height: window.innerHeight };
    requestMorphUpdate();
  }, { passive: true });

  starLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.dataset.target;
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const offset = viewport.width <= 820 ? 108 : 82;
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

  requestMorphUpdate();
})();