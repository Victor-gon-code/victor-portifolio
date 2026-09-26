(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const starLinks = Array.from(document.querySelectorAll(".star-link"));
  const linePaths = Array.from(document.querySelectorAll(".constellation-lines path"));
  const lineSvg = document.getElementById("constellation-lines");
  const morphHeader = document.getElementById("morph-header");
  const headerLinks = morphHeader ? Array.from(morphHeader.querySelectorAll("a")) : [];
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const processTrack = document.querySelector(".process-track");
  const year = document.getElementById("year");
  const encodedImages = Array.from(document.querySelectorAll(".encoded-image"));

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
  let headerInteractive = null;

  const HERO_IMAGE = { width: 1672, height: 941 };
  const HERO_POINTS = [
    [1171 / 1672, 514 / 941],
    [1240 / 1672, 148 / 941],
    [1343 / 1672, 322 / 941],
    [1478 / 1672, 234 / 941],
    [1490 / 1672, 536 / 941]
  ];

  function heroImagePoint(nx, ny) {
    const { width: w, height: h } = viewport;
    const scale = Math.max(w / HERO_IMAGE.width, h / HERO_IMAGE.height);
    const renderedWidth = HERO_IMAGE.width * scale;
    const renderedHeight = HERO_IMAGE.height * scale;
    return [
      (w - renderedWidth) / 2 + nx * renderedWidth,
      (h - renderedHeight) / 2 + ny * renderedHeight
    ];
  }

  function restingPositions() {
    const { width: w, height: h } = viewport;

    if (w <= 480) {
      return [
        [w * 0.13, h * 0.89],
        [w * 0.315, h * 0.77],
        [w * 0.50, h * 0.87],
        [w * 0.685, h * 0.77],
        [w * 0.87, h * 0.89]
      ];
    }

    if (w <= 820) {
      return [
        [w * 0.13, h * 0.86],
        [w * 0.315, h * 0.73],
        [w * 0.50, h * 0.84],
        [w * 0.685, h * 0.72],
        [w * 0.87, h * 0.86]
      ];
    }

    return HERO_POINTS.map(([x, y]) => heroImagePoint(x, y));
  }

  function targetPositions() {
    const w = viewport.width;

    if (w <= 480) {
      return [0.09, 0.295, 0.50, 0.705, 0.91].map((x) => [w * x, 68]);
    }

    if (w <= 820) {
      return [0.10, 0.30, 0.50, 0.70, 0.90].map((x) => [w * x, 68]);
    }

    const xs = w < 1120 ? [0.35, 0.445, 0.54, 0.635, 0.73] : [0.34, 0.445, 0.55, 0.655, 0.76];
    return xs.map((x) => [w * x, 41]);
  }

  function morphProgress() {
    if (reducedMotion) return window.scrollY > 24 ? 1 : 0;
    const factor = viewport.width <= 480 ? 0.78 : viewport.width <= 820 ? 0.74 : 0.72;
    const minimum = viewport.width <= 480 ? 540 : viewport.width <= 820 ? 560 : 520;
    return clamp(window.scrollY / Math.max(viewport.height * factor, minimum), 0, 1);
  }

  function measureStarCenters() {
    cachedStarCenters = starLinks.map((link) => {
      const star = link.querySelector(".star-link__star");
      return [
        star ? star.offsetLeft + star.offsetWidth / 2 : (link.offsetWidth || 58) / 2,
        star ? star.offsetTop + star.offsetHeight / 2 : (link.offsetHeight || 44) / 2
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
    const center = cachedStarCenters[index] || [22, 22];
    link.style.transformOrigin = `${center[0].toFixed(2)}px ${center[1].toFixed(2)}px`;
    link.style.transform = `translate3d(${(x - center[0]).toFixed(2)}px,${(y - center[1]).toFixed(2)}px,0) scale(${scale.toFixed(3)})`;
  }

  function updateLines(progress) {
    if (!lineSvg) return;

    lineSvg.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
    const drawT = smoothstep(clamp((progress - 0.005) / 0.11, 0, 1));
    const fadeT = smoothstep(clamp((progress - 0.16) / 0.46, 0, 1));
    const opacity = mix(0, 0.38, drawT) * (1 - fadeT);

    if (opacity < 0.002) {
      linePaths.forEach((path) => { path.style.opacity = "0"; });
      return;
    }

    linePaths.forEach((path, index) => {
      const a = currentPositions[index];
      const b = currentPositions[index + 1];
      if (!a || !b) return;

      path.setAttribute("d", `M ${a[0].toFixed(2)} ${a[1].toFixed(2)} L ${b[0].toFixed(2)} ${b[1].toFixed(2)}`);
      const length = Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]));
      path.style.strokeDasharray = `${length.toFixed(2)} ${length.toFixed(2)}`;
      path.style.strokeDashoffset = (length * (1 - drawT)).toFixed(2);
      path.style.opacity = opacity.toFixed(3);
    });
  }

  function setHeaderAccess(enabled) {
    if (!morphHeader || enabled === headerInteractive) return;
    headerInteractive = enabled;
    morphHeader.setAttribute("aria-hidden", enabled ? "false" : "true");

    if ("inert" in morphHeader) {
      morphHeader.inert = !enabled;
    }

    headerLinks.forEach((link) => {
      if (enabled) link.removeAttribute("tabindex");
      else link.setAttribute("tabindex", "-1");
    });
  }

  function updateMorph() {
    rafPending = false;
    const raw = morphProgress();
    const layoutMode = raw >= 0.80 ? "header" : "hero";

    if (!geometryDirty && Math.abs(raw - lastMorphProgress) < 0.0005 && layoutMode === lastLayoutMode) return;

    const formed = raw >= 0.04 && raw < 0.32;
    const transitioning = raw >= 0.04 && raw < 0.80;
    const headerReady = raw >= 0.80;

    document.body.classList.toggle("constellation-formed", formed);
    document.body.classList.toggle("header-transitioning", transitioning);
    document.body.classList.toggle("header-ready", headerReady);
    setHeaderAccess(headerReady);

    if (geometryDirty) refreshGeometry();
    else if (layoutMode !== lastLayoutMode) measureStarCenters();

    const alignT = smoothstep(clamp((raw - 0.015) / 0.80, 0, 1));
    currentPositions = starLinks.map((link, index) => {
      const x = mix(cachedRest[index][0], cachedTargets[index][0], alignT);
      const y = mix(cachedRest[index][1], cachedTargets[index][1], alignT);
      const scale = mix(1, viewport.width <= 820 ? 0.92 : 0.9, alignT);
      setNavPosition(link, index, x, y, scale);
      return [x, y];
    });

    updateLines(raw);
    root.style.setProperty("--header-progress", smoothstep(clamp((raw - 0.48) / 0.30, 0, 1)).toFixed(3));
    lastMorphProgress = raw;
    lastLayoutMode = layoutMode;
  }

  function requestMorphUpdate() {
    if (rafPending) return;
    const raw = morphProgress();
    if (!geometryDirty && raw >= 1 && lastMorphProgress >= 1) return;
    rafPending = true;
    requestAnimationFrame(updateMorph);
  }

  async function hydrateEncodedImage(img) {
    if (img.dataset.loaded || img.dataset.loading) return;
    img.dataset.loading = "true";

    try {
      const prefix = img.dataset.partsPrefix;
      const count = Number(img.dataset.partsCount || 0);
      if (!prefix || !count) throw new Error("Dados da imagem incompletos");

      const parts = await Promise.all(
        Array.from({ length: count }, (_, index) =>
          fetch(`${prefix}${index}.b64`, { cache: "force-cache" }).then((response) => {
            if (!response.ok) throw new Error(`Falha ao carregar ${response.url}`);
            return response.text();
          })
        )
      );

      const base64 = parts.join("").replace(/\s+/g, "");
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
      img.addEventListener("load", () => {
        img.dataset.loaded = "true";
        img.removeAttribute("data-loading");
        URL.revokeObjectURL(objectUrl);
      }, { once: true });
      img.src = objectUrl;
    } catch (error) {
      img.removeAttribute("data-loading");
      img.closest(".project-shot__media")?.classList.add("image-load-error");
      console.error("Não foi possível carregar uma imagem do projeto.", error);
    }
  }

  function setupProjectImages() {
    if (!encodedImages.length) return;

    if (!("IntersectionObserver" in window)) {
      encodedImages.forEach(hydrateEncodedImage);
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hydrateEncodedImage(entry.target);
        imageObserver.unobserve(entry.target);
      });
    }, { rootMargin: "600px 0px" });

    encodedImages.forEach((img) => imageObserver.observe(img));
  }

  window.addEventListener("scroll", requestMorphUpdate, { passive: true });
  window.addEventListener("resize", () => {
    geometryDirty = true;
    lastMorphProgress = -1;
    requestMorphUpdate();
  }, { passive: true });

  starLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(link.dataset.target);
      if (!target) return;

      event.preventDefault();
      const offset = viewport.width <= 820 ? 130 : 82;
      const top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      history.replaceState(null, "", `#${target.id}`);
    });
  });

  const revealElements = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target === processTrack) processTrack.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -7% 0px" });

    revealElements.forEach((element) => revealObserver.observe(element));
    if (processTrack) revealObserver.observe(processTrack);

    const activeObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      const id = visible[0].target.id;

      starLinks.forEach((link) => {
        const active = link.dataset.target === id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }, { threshold: [0.22, 0.45, 0.7], rootMargin: "-18% 0px -55% 0px" });

    sections.filter((section) => section.id !== "inicio").forEach((section) => activeObserver.observe(section));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    if (processTrack) processTrack.classList.add("is-visible");
  }

  refreshGeometry();
  setHeaderAccess(false);
  setupProjectImages();
  requestMorphUpdate();
})();