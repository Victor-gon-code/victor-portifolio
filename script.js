(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const year = document.getElementById("year");
  const stamp = document.querySelector(".color-stamp");
  const navLinks = Array.from(document.querySelectorAll(".topnav a"));
  const trackedSections = Array.from(document.querySelectorAll("main section[id]"));

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
        threshold: 0.04,
        rootMargin: "100px 0px 20px 0px"
      }
    );

    document.querySelectorAll(".reveal").forEach((element) => {
      revealObserver.observe(element);
    });
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const currentId = visible[0].target.id;

      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("is-active", href === "#" + currentId);
      });
    },
    {
      threshold: [0.18, 0.35, 0.6],
      rootMargin: "-18% 0px -56% 0px"
    }
  );

  trackedSections.forEach((section) => {
    if (section.id !== "inicio" && section.id !== "contato") {
      sectionObserver.observe(section);
    }
  });

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

      stamp.animate(
        [
          { transform: "rotate(0deg) scale(1)" },
          { transform: "rotate(18deg) scale(1.12)" },
          { transform: "rotate(-4deg) scale(.98)" },
          { transform: "rotate(0deg) scale(1)" }
        ],
        {
          duration: reducedMotion ? 0 : 360,
          easing: "cubic-bezier(.2,.8,.2,1)"
        }
      );
    });
  }

  const note = document.querySelector(".hero-note");

  if (note && !reducedMotion && window.matchMedia("(hover:hover)").matches) {
    const hero = document.querySelector(".hero-paper");
    let frame = null;

    hero?.addEventListener("pointermove", (event) => {
      if (frame) cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        note.style.transform =
          "rotate(" + (2.4 + x * 1.8).toFixed(2) + "deg) " +
          "translate3d(" + (x * 5).toFixed(1) + "px," + (y * 5).toFixed(1) + "px,0)";
      });
    });

    hero?.addEventListener("pointerleave", () => {
      note.style.transform = "";
    });
  }
})();
