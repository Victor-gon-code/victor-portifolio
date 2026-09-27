(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
  const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const compactScreen = window.matchMedia("(max-width: 700px)").matches;
  const constrainedDevice = reducedMotion || saveData || lowMemory || lowCpu;

  if (constrainedDevice) {
    document.documentElement.classList.add("lite-motion");
  }

  const year = document.getElementById("year");
  const stamp = document.querySelector(".color-stamp");
  const navLinks = Array.from(document.querySelectorAll(".topnav a"));
  const trackedSections = Array.from(document.querySelectorAll("main section[id]"));
  const marquee = document.querySelector(".tanarede-marquee");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function headerOffset() {
    const header = document.querySelector(".topbar");
    return (header?.offsetHeight || 0) + 14;
  }

  function goTo(target, updateHash = true) {
    if (!target) return;

    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      headerOffset();

    window.scrollTo({
      top,
      behavior: reducedMotion ? "auto" : "smooth"
    });

    if (updateHash && target.id) {
      history.replaceState(null, "", "#" + target.id);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      goTo(target);
    });
  });

  if (reducedMotion) {
    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.025,
        rootMargin: "120px 0px 30px 0px"
      }
    );

    document.querySelectorAll(".reveal").forEach((element) => {
      revealObserver.observe(element);
    });
  }

  // Section awareness drives both the nav underline and the paper color of the
  // sticky header. A small scroll-position probe is more reliable than section
  // intersection ratios because some sections are much taller than the viewport.
  let sectionFrame = null;

  function updateSectionState() {
    sectionFrame = null;

    const probeY = headerOffset() + Math.min(window.innerHeight * 0.24, 180);
    let currentId = trackedSections[0]?.id || "inicio";

    trackedSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= probeY) {
        currentId = section.id;
      }
    });

    document.body.dataset.section = currentId;

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("is-active", href === "#" + currentId);
    });
  }

  function requestSectionState() {
    if (sectionFrame) return;
    sectionFrame = requestAnimationFrame(updateSectionState);
  }

  window.addEventListener("scroll", requestSectionState, { passive: true });
  window.addEventListener("resize", requestSectionState, { passive: true });
  updateSectionState();

  // Continuous movement costs battery/CPU for no benefit while off-screen.
  // Run the marquee only while the user can actually see it.
  if (marquee && !constrainedDevice) {
    const marqueeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          marquee.classList.toggle("is-running", entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: "120px 0px 120px 0px"
      }
    );

    marqueeObserver.observe(marquee);
  }

  if (stamp) {
    const accents = ["blue", "green", "coral"];
    let index = 0;

    stamp.addEventListener("click", () => {
      index = (index + 1) % accents.length;
      const next = accents[index];

      if (next === "blue") {
        document.body.removeAttribute("data-accent");
      } else {
        document.body.setAttribute("data-accent", next);
      }

      if (!constrainedDevice && typeof stamp.animate === "function") {
        stamp.animate(
          [
            { transform: "rotate(0deg) scale(1)" },
            { transform: "rotate(18deg) scale(1.12)" },
            { transform: "rotate(-4deg) scale(.98)" },
            { transform: "rotate(0deg) scale(1)" }
          ],
          {
            duration: 340,
            easing: "cubic-bezier(.2,.8,.2,1)"
          }
        );
      }
    });
  }

  // Tiny desktop-only movement on the note. It never runs on touch or
  // constrained devices.
  const note = document.querySelector(".hero-note");
  const hero = document.querySelector(".hero-paper");

  if (
    note &&
    hero &&
    !constrainedDevice &&
    !compactScreen &&
    window.matchMedia("(hover:hover)").matches
  ) {
    let frame = null;

    hero.addEventListener("pointermove", (event) => {
      if (frame) cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        note.style.transform =
          "rotate(" + (2.4 + x * 1.4).toFixed(2) + "deg) " +
          "translate3d(" + (x * 4).toFixed(1) + "px," + (y * 4).toFixed(1) + "px,0)";
      });
    });

    hero.addEventListener("pointerleave", () => {
      if (frame) cancelAnimationFrame(frame);
      note.style.transform = "";
    });
  }

  // If the page opens on a hash, compensate for the sticky header after fonts
  // settle so the section title is not hidden.
  window.addEventListener("load", () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    requestAnimationFrame(() => goTo(target, false));
  });
})();
