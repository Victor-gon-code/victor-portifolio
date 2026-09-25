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

    // The M is intentionally discreet when the page opens. It becomes clear
    // for a short moment before the same stars reorganize into the header.
    const formT = smoothstep(clamp(progress / 0.28, 0, 1));
    const departT = smoothstep(clamp((progress - 0.28) / 0.72, 0, 1));
    const opacity = mix(0.018, 0.34, formT) * (1 - departT) + (0.028 * departT);

    linePaths.forEach((path, index) => {
      const a = currentPositions[index];
      const b = currentPositions[index + 1];
      if (!a || !b) return;

      path.setAttribute(
        "d",
        "M " + a[0].toFixed(2) + " " + a[1].toFixed(2) +
        " L " + b[0].toFixed(2) + " " + b[1].toFixed(2)
      );
      path.style.opacity = opacity.toFixed(3);
      path.style.strokeDashoffset = ((1 - progress) * 18).toFixed(2);
    });
  }

  function updateMorph() {
    rafPending = false;

    const raw = morphProgress();
    const rest = restingPositions();
    const formed = mPositions();
    const end = targetPositions();

    const formT = smoothstep(clamp(raw / 0.28, 0, 1));
    const headerT = smoothstep(clamp((raw - 0.28) / 0.72, 0, 1));

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

    const headerProgress = smoothstep(clamp((raw - 0.62) / 0.38, 0, 1));
    root.style.setProperty("--header-progress", headerProgress.toFixed(3));

    if (morphHeader) {
      morphHeader.setAttribute("aria-hidden", headerProgress > 0.5 ? "false" : "true");
    }

    document.body.classList.toggle("constellation-formed", raw >= 0.20 && raw < 0.56);
    document.body.classList.toggle("header-ready", raw > 0.88);
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
    resizeStars();
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

  // Star field: canvas only; capped density and DPR keep it inexpensive on mobile.
  const canvas = document.getElementById("starfield");
  const ctx = canvas ? canvas.getContext("2d", { alpha: true }) : null;
  let stars = [];
  let canvasWidth = 0;
  let canvasHeight = 0;
  let lastFrame = 0;

  function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    return () => {
      t += 0x6D2B79F5;
      let n = t;
      n = Math.imul(n ^ (n >>> 15), n | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildStars() {
    if (!ctx) return;
    const random = seededRandom(240926);
    const count = viewport.width <= 560 ? 44 : viewport.width <= 900 ? 62 : 88;

    stars = Array.from({ length: count }, (_, index) => {
      const depth = 0.25 + random() * 0.75;
      return {
        x: random() * canvasWidth,
        y: random() * canvasHeight,
        radius: 0.25 + random() * (depth * 1.18),
        alpha: 0.16 + random() * 0.57,
        phase: random() * Math.PI * 2,
        speed: 0.00045 + random() * 0.0012,
        drift: (random() - 0.5) * 0.045,
        green: index % 17 === 0
      };
    });
  }

  function resizeStars() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWidth = Math.max(1, window.innerWidth);
    canvasHeight = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
    drawStars(performance.now());
  }

  function drawStars(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    stars.forEach((star) => {
      const pulse = reducedMotion ? 0 : Math.sin(time * star.speed + star.phase) * 0.18;
      const alpha = clamp(star.alpha + pulse, 0.08, 0.82);
      const scrollShift = reducedMotion ? 0 : (window.scrollY * star.drift) % canvasHeight;
      let y = star.y - scrollShift;
      if (y < -4) y += canvasHeight + 8;
      if (y > canvasHeight + 4) y -= canvasHeight + 8;

      ctx.beginPath();
      ctx.arc(star.x, y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.green
        ? "rgba(96,245,196," + alpha.toFixed(3) + ")"
        : "rgba(220,241,247," + alpha.toFixed(3) + ")";
      ctx.fill();

      if (star.radius > 1.05) {
        ctx.beginPath();
        ctx.arc(star.x, y, star.radius * 4.8, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(star.x, y, 0, star.x, y, star.radius * 4.8);
        glow.addColorStop(0, star.green ? "rgba(95,245,196,.11)" : "rgba(197,231,245,.08)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fill();
      }
    });
  }

  function animateStars(time) {
    if (!ctx || reducedMotion) return;
    if (time - lastFrame >= 33) {
      drawStars(time);
      lastFrame = time;
    }
    requestAnimationFrame(animateStars);
  }

  resizeStars();
  if (!reducedMotion) requestAnimationFrame(animateStars);

  requestMorphUpdate();
})();