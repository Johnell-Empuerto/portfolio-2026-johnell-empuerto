(function () {
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchLayout = () =>
    window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const hasGSAP = () => window.gsap && window.ScrollTrigger;

  function runLabIdle(callback, timeout = 900) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(callback, { timeout });
      return;
    }

    setTimeout(callback, 200);
  }

  function refreshScrollTriggers() {
    if (!window.ScrollTrigger) return;

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }

  function setupCinematicPreloader() {
    const overlay = document.querySelector("#lab-preloader");

    if (!overlay) {
      return Promise.resolve();
    }

    const forcePreloader = new URLSearchParams(window.location.search).has(
      "forceLabPreloader",
    );
    let alreadyShown = false;

    try {
      alreadyShown =
        !forcePreloader &&
        window.sessionStorage?.getItem("digitalOpsLabPreloader") === "shown";
    } catch (error) {
      alreadyShown = false;
    }

    const complete = () => {
      overlay.classList.add("is-hidden");
      overlay.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("lab-is-preloading");

      try {
        window.sessionStorage?.setItem("digitalOpsLabPreloader", "shown");
      } catch (error) {
        // Session storage can be blocked in private or strict browser modes.
      }

      window.dispatchEvent(new CustomEvent("lab:preloader-complete"));
      refreshScrollTriggers();
    };

    if (alreadyShown || reducedMotion()) {
      overlay.remove();
      complete();
      return Promise.resolve();
    }

    document.documentElement.classList.add("lab-is-preloading");

    return new Promise((resolve) => {
      const finish = () => {
        complete();
        resolve();
      };

      let didFinish = false;
      const finishOnce = () => {
        if (didFinish) return;

        didFinish = true;
        finish();
      };

      if (!window.gsap) {
        overlay.classList.add("is-css-fallback");

        setTimeout(() => {
          overlay.remove();
          finishOnce();
        }, 2800);
        return;
      }

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            overlay.remove();
            finishOnce();
          },
        })
        .fromTo(
          ".lab-preloader-panel > *",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12 },
          0.1,
        )
        .fromTo(
          ".lab-progress-rail span",
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 2.05,
            ease: "power2.inOut",
          },
          0.25,
        )
        .to(".lab-preloader-panel", {
          scale: 0.985,
          duration: 0.22,
          ease: "power2.inOut",
        }, 2.18)
        .to(
          overlay,
          {
            clipPath: "inset(0 50% 0 50%)",
            autoAlpha: 0,
            duration: 0.58,
            ease: "power4.inOut",
          },
          2.45,
        );
    });
  }

  function setupHeroCinematicReveal(preloaderPromise = Promise.resolve()) {
    const hero = document.querySelector("#hero");
    const eyebrow = hero?.querySelector(".eyebrow");
    const title = hero?.querySelector(".hero-title");
    const titleLines = title ? Array.from(title.querySelectorAll(".line")) : [];
    const subtitles = hero ? Array.from(hero.querySelectorAll(".hero-subtitle")) : [];
    const actionGroup = hero?.querySelector(".hero-actions");
    const actions = hero ? Array.from(hero.querySelectorAll(".hero-actions .button")) : [];
    const metricsGroup = hero?.querySelector(".hero-metrics");
    const metrics = hero ? Array.from(hero.querySelectorAll(".hero-metrics div")) : [];
    const counts = hero ? Array.from(hero.querySelectorAll(".count")) : [];
    const heroCard = hero?.querySelector(".hero-card");
    const orbCard = hero?.querySelector(".orb-card");
    const commandCore = hero?.querySelector(".developer-stage");

    if (!hero || !titleLines.length) return;

    const revealTargets = [
      eyebrow,
      ...titleLines,
      ...subtitles,
      heroCard,
      orbCard,
      commandCore,
    ].filter(Boolean);

    if (!hasGSAP() || reducedMotion()) {
      revealTargets.forEach((target) => {
        target.style.opacity = "1";
        target.style.transform = "none";
        target.style.filter = "none";
      });
      counts.forEach((count) => {
        count.textContent = count.dataset.count || count.textContent;
      });
      [actionGroup, metricsGroup, ...actions, ...metrics]
        .filter(Boolean)
        .forEach((target) => {
          target.style.opacity = "1";
          target.style.visibility = "visible";
          target.style.transform = "none";
          target.style.filter = "none";
        });
      hero.classList.add("is-command-online");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.getAll().forEach((trigger) => {
      const triggerElement = trigger.trigger;
      if (!triggerElement || !hero.contains(triggerElement)) return;

      if (
        triggerElement.classList?.contains("reveal") ||
        triggerElement.classList?.contains("count")
      ) {
        trigger.kill(false);
      }
    });

    gsap.killTweensOf(revealTargets);
    gsap.killTweensOf([actionGroup, metricsGroup, ...actions, ...metrics].filter(Boolean));
    gsap.set([actionGroup, metricsGroup, ...actions, ...metrics].filter(Boolean), {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "none",
    });
    counts.forEach((count) => {
      count.textContent = count.dataset.count || count.textContent;
    });
    gsap.set(title, {
      "--shine-x": "-145%",
      "--shine-opacity": 0,
      "--title-glow": 0.26,
    });
    gsap.set(eyebrow, { autoAlpha: 0, y: 18 });
    gsap.set(titleLines, {
      autoAlpha: 0,
      yPercent: 112,
      rotateX: -32,
      filter: "blur(14px)",
      transformOrigin: "left bottom",
    });
    gsap.set(subtitles, { autoAlpha: 0, y: 22, filter: "blur(8px)" });
    gsap.set(heroCard, {
      autoAlpha: 0,
      y: 34,
      scale: 0.94,
      rotateY: -8,
      rotateX: 4,
      filter: "blur(12px)",
      transformPerspective: 1100,
      transformOrigin: "center center",
    });
    gsap.set([orbCard, commandCore].filter(Boolean), {
      autoAlpha: 0,
      scale: 0.96,
      filter: "blur(10px)",
    });
    const playReveal = () => {
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: refreshScrollTriggers,
      });

      timeline
        .add(() => hero.classList.add("is-command-online"), 0)
        .to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.52 }, 0.02)
        .to(
          titleLines,
          {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.88,
            stagger: 0.11,
            ease: "power4.out",
          },
          0.12,
        )
        .to(
          title,
          {
            "--shine-opacity": 0,
            "--title-glow": 0.72,
            duration: 0.92,
            ease: "power2.inOut",
          },
          0.42,
        )
        .to(title, { "--title-glow": 0.62, duration: 0.38 }, 1.08)
        .to(
          subtitles,
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.62,
            stagger: 0.08,
          },
          0.62,
        )
        .to(
          heroCard,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotateY: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.95,
            ease: "power4.out",
          },
          0.38,
        )
        .to(
          [orbCard, commandCore].filter(Boolean),
          {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.72,
            stagger: 0.08,
          },
          0.62,
        )
        .to({}, { duration: 0.01 }, 1);
    };

    preloaderPromise.then(playReveal).catch(playReveal);
  }

  function setupProjectScrollytelling() {
    const section = document.querySelector("[data-projects-section]");
    const cards = section ? Array.from(section.querySelectorAll(".project-card")) : [];

    if (!section || !cards.length) return;

    cards.forEach((card) => {
      card.setAttribute("data-cursor-label", "VIEW");
      card.querySelectorAll(".case-study-grid div").forEach((step, index) => {
        step.style.setProperty("--step-index", index + 1);
      });
    });

    if (!hasGSAP() || reducedMotion()) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.transform = "none";
        card.querySelectorAll(".case-study-grid div, .project-info > *").forEach((part) => {
          part.style.opacity = "1";
          part.style.transform = "none";
        });
      });
      return;
    }

    const headerParts = section.querySelectorAll(".projects-kicker, .projects-title");
    gsap.fromTo(
      headerParts,
      { autoAlpha: 0, y: 28, filter: "blur(10px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      },
    );

    cards.forEach((card) => {
      const visual = card.querySelector(".project-visual");
      const screenshot = card.querySelector(".project-screenshot");
      const infoIntro = card.querySelectorAll(".project-eyebrow, h3, .project-desc");
      const caseSteps = card.querySelectorAll(".case-study-grid div");

      gsap
        .timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        })
        .fromTo(
          card,
          { autoAlpha: 0, y: isTouchLayout() ? 34 : 68, filter: "blur(12px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.78,
            ease: "power3.out",
          },
          0,
        )
        .fromTo(
          visual,
          { autoAlpha: 0, y: 28, scale: 0.95, rotate: -1.5 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.72,
            ease: "power3.out",
          },
          0.08,
        )
        .fromTo(
          infoIntro,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.48,
            stagger: 0.055,
            ease: "power2.out",
          },
          0.18,
        )
        .fromTo(
          caseSteps,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.07,
            ease: "power2.out",
          },
          0.42,
        );

      if (!isTouchLayout() && visual) {
        gsap.to(visual, {
          yPercent: -5,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      if (!isTouchLayout() && screenshot) {
        card.addEventListener("pointermove", (event) => {
          if (event.pointerType === "touch") return;

          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;

          gsap.to(screenshot, {
            rotateY: x * 8,
            rotateX: y * -7,
            y: -4,
            duration: 0.35,
            ease: "power2.out",
            transformPerspective: 900,
          });
        });

        card.addEventListener("pointerleave", () => {
          gsap.to(screenshot, {
            rotateY: 0,
            rotateX: 0,
            y: 0,
            duration: 0.45,
            ease: "power3.out",
          });
        });
      }
    });

    refreshScrollTriggers();
  }

  function setupBentoInteractions() {
    const section = document.querySelector(".capabilities-section");
    const cards = section ? Array.from(section.querySelectorAll(".lab-bento-card")) : [];

    if (!section || !cards.length) return;

    cards.forEach((card) => {
      card.setAttribute("data-cursor-label", "VIEW");
    });

    if (!hasGSAP() || reducedMotion()) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.transform = "none";
      });
      return;
    }

    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 34, scale: 0.965, filter: "blur(10px)" },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.68,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 74%",
          toggleActions: "play none none reverse",
        },
      },
    );

    refreshScrollTriggers();
  }

  function setupMicroDelights() {
    const cursor = document.querySelector(".cursor");
    const emailLinks = document.querySelectorAll('.contact-actions a[href^="mailto:"]');

    document
      .querySelectorAll(".project-card, .lab-bento-card, .button, .header-cta, a[target='_blank']")
      .forEach((target) => {
        const href = target.getAttribute("href") || "";
        const label =
          target.dataset.cursorLabel ||
          (href.startsWith("#contact") || href.startsWith("mailto:")
            ? "CONTACT"
            : href || target.target === "_blank"
              ? "OPEN"
              : "VIEW");

        target.addEventListener("pointerenter", () => {
          if (!cursor || isTouchLayout()) return;

          cursor.dataset.label = label;
          cursor.classList.add("has-label");
        });

        target.addEventListener("pointerleave", () => {
          if (!cursor) return;

          cursor.classList.remove("has-label");
          cursor.removeAttribute("data-label");
        });
      });

    if (emailLinks.length) {
      let toast = document.querySelector(".copy-toast");

      if (!toast) {
        toast = document.createElement("div");
        toast.className = "copy-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.textContent = "Copied";
        document.body.appendChild(toast);
      }

      const showCopied = (link) => {
        const originalText = link.textContent;
        link.textContent = "Copied";
        toast.classList.add("is-visible");

        setTimeout(() => {
          link.textContent = originalText;
          toast.classList.remove("is-visible");
        }, 1400);
      };

      emailLinks.forEach((link) => {
        link.setAttribute("data-cursor-label", "CONTACT");

        link.addEventListener("click", async (event) => {
          const email = (link.getAttribute("href") || "").replace("mailto:", "").trim();

          if (!email) return;

          event.preventDefault();

          try {
            await navigator.clipboard.writeText(email);
            showCopied(link);
          } catch (error) {
            const textarea = document.createElement("textarea");
            textarea.value = email;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
            showCopied(link);
          }
        });
      });
    }

    document.querySelectorAll("img").forEach((image) => {
      if (image.complete) return;
      image.addEventListener("load", refreshScrollTriggers, { once: true });
    });
  }

  function safeSetup(name, callback, fallback) {
    try {
      return callback();
    } catch (error) {
      console.error(`[Digital Operations Lab] ${name} failed`, error);
      return fallback;
    }
  }

  window.setupCinematicPreloader = setupCinematicPreloader;
  window.setupHeroCinematicReveal = setupHeroCinematicReveal;
  window.setupProjectScrollytelling = setupProjectScrollytelling;
  window.setupBentoInteractions = setupBentoInteractions;
  window.setupMicroDelights = setupMicroDelights;

  const preloaderPromise =
    safeSetup("setupCinematicPreloader", setupCinematicPreloader, Promise.resolve()) ||
    Promise.resolve();

  safeSetup("setupHeroCinematicReveal", () =>
    setupHeroCinematicReveal(preloaderPromise),
  );
  safeSetup("setupMicroDelights", setupMicroDelights);

  runLabIdle(() => {
    safeSetup("setupProjectScrollytelling", setupProjectScrollytelling);
    safeSetup("setupBentoInteractions", setupBentoInteractions);
    refreshScrollTriggers();
  }, 900);
})();
