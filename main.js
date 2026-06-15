const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reducedMotion = () => prefersReducedMotion;
const isChromeTouchBrowser = () => {
  const ua = navigator.userAgent;
  const isChrome = /\b(?:Chrome|CriOS)\//.test(ua);
  const isChromiumEdge = /\bEdg(?:e|A|iOS)?\//.test(ua);
  const isOtherChromium =
    /\b(?:OPR|Opera|SamsungBrowser|DuckDuckGo|YaBrowser)\//.test(ua);
  const isTouchLike =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches;

  return isChrome && !isChromiumEdge && !isOtherChromium && isTouchLike;
};

document.documentElement.classList.add("js");
document.querySelector("#year").textContent = new Date().getFullYear();

function splitTitle() {
  document.querySelectorAll(".split-text").forEach((title) => {
    const text = title.textContent.trim();
    title.textContent = "";
    text.split(" ").forEach((word, index) => {
      const line = document.createElement("span");
      line.className = "line";
      line.textContent = word;
      title.appendChild(line);
      if (index < text.split(" ").length - 1) {
        title.appendChild(document.createTextNode(" "));
      }
    });
  });
}

splitTitle();

function setupCursor() {
  if (reducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;

  const cursor = document.querySelector(".cursor");
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.opacity = "1";
  });

  const animateCursor = () => {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  };

  animateCursor();

  document.querySelectorAll("a, button").forEach((link) => {
    link.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    link.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });
}

function setupDeveloperScene() {
  const canvas = document.querySelector(".developer-canvas");
  if (!window.THREE || !canvas || reducedMotion()) return;

  const card = document.querySelector(".orb-card");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5.2;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new THREE.Group();
  const constellation = new THREE.Group();
  const nodeCount = window.innerWidth > 640 ? 76 : 48;
  const nodes = [];
  const positions = new Float32Array(nodeCount * 3);
  const colors = new Float32Array(nodeCount * 3);

  for (let i = 0; i < nodeCount; i += 1) {
    const radiusX = 1.95 + Math.random() * 0.8;
    const radiusY = 1.15 + Math.random() * 0.55;
    const radiusZ = 0.7 + Math.random() * 0.55;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radiusX * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radiusY * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radiusZ * Math.cos(phi);

    const cyan = new THREE.Color(0x00e5ff);
    const pink = new THREE.Color(0xff4ecd);
    const color = cyan.lerp(pink, Math.random());
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    nodes.push({ x: positions[i * 3], y: positions[i * 3 + 1], z: positions[i * 3 + 2] });
  }

  const nodeGeometry = new THREE.BufferGeometry();
  nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  nodeGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const nodeMaterial = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });

  const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
  constellation.add(nodePoints);

  const links = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 1.25) {
        links.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
      }
    }
  }

  const linkGeometry = new THREE.BufferGeometry();
  linkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(links, 3));

  const linkMaterial = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  const linkLines = new THREE.LineSegments(linkGeometry, linkMaterial);
  constellation.add(linkLines);

  const cube = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.08, 1),
    new THREE.MeshBasicMaterial({
      color: 0x7c5cff,
      wireframe: true,
      transparent: true,
      opacity: 0.68,
    }),
  );
  constellation.add(cube);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.006, 8, 120),
    new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.42,
    }),
  );
  const ringB = ringA.clone();
  ringB.material = ringA.material.clone();
  ringB.material.color.set(0xff4ecd);
  ringB.material.opacity = 0.32;

  ringA.rotation.x = Math.PI / 2.2;
  ringB.rotation.y = Math.PI / 2.4;
  constellation.add(ringA, ringB);
  group.add(constellation);
  scene.add(group);

  let targetX = 0;
  let targetY = 0;

  card?.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.9;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.9;
  });

  card?.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  const clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();

    constellation.rotation.y = elapsed * 0.22;
    constellation.rotation.x = Math.sin(elapsed * 0.35) * 0.18;
    cube.rotation.x = elapsed * 0.42;
    cube.rotation.y = elapsed * 0.32;
    ringA.rotation.z = elapsed * 0.38;
    ringB.rotation.x = Math.PI / 2.4 + elapsed * 0.28;

    group.rotation.y += (targetX - group.rotation.y) * 0.045;
    group.rotation.x += (targetY - group.rotation.x) * 0.045;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  function handleResize() {
    const rect = card?.getBoundingClientRect() || canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
  }

  handleResize();
  window.addEventListener("resize", handleResize);
}

function setupAnimations() {
  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
    document.querySelectorAll(".reveal").forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  if (isChromeTouchBrowser()) {
    ScrollTrigger.config({
      ignoreMobileResize: true,
    });
  }

  gsap.to(".scroll-progress", {
    width: "100%",
    ease: "none",
    scrollTrigger: {
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });

  gsap.utils.toArray(
    ".reveal:not(.skill-card):not(.experience-orbit):not(.experience-tabs):not(.projects-kicker):not(.project-card):not(.achievements-kicker):not(.achievements-tabs)"
  ).forEach((element) => {
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 86%",
        toggleActions: "play none none reverse",
      },
    });
  });

  const heroTitle = document.querySelector(".hero-title");
  const heroTitleLines = gsap.utils.toArray(".hero-title .line");

  if (heroTitle && heroTitleLines.length) {
    gsap
      .timeline({ delay: 0.18 })
      .set(heroTitle, { "--shine-x": "-145%", "--shine-opacity": 0, "--title-glow": 0.38 })
      .from(heroTitleLines, {
        yPercent: 118,
        opacity: 0,
        rotateX: -42,
        filter: "blur(14px)",
        transformOrigin: "left bottom",
        duration: 1.18,
        stagger: 0.13,
        ease: "power4.out",
      })
      .to(
        heroTitle,
        {
          "--shine-opacity": 0.82,
          duration: 0.16,
          ease: "power2.out",
        },
        "-=0.58"
      )
      .to(
        heroTitle,
        {
          "--shine-x": "145%",
          "--title-glow": 1,
          duration: 1.12,
          ease: "power2.inOut",
        },
        "<"
      )
      .to(
        heroTitle,
        {
          "--shine-opacity": 0,
          duration: 0.28,
          ease: "power2.out",
        },
        "-=0.1"
      )
      .to(
        heroTitleLines,
        {
          backgroundPosition: "100% 50%",
          duration: 5.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
        "-=0.4"
      )
      .to(
        heroTitle,
        {
          "--title-glow": 0.62,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
        "<"
      );
  }

  gsap.from(".site-header", {
    y: -24,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap.utils.toArray(".dev-chip").forEach((chip, index) => {
    gsap.to(chip, {
      y: index % 2 === 0 ? 12 : -10,
      x: index % 2 === 0 ? 6 : -6,
      rotate: index % 2 === 0 ? 4 : -4,
      duration: 3.8 + index * 0.35,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: index * 0.18,
    });
  });

  gsap.utils.toArray(".project-card").forEach((card, index) => {
    gsap.from(card.querySelector(".project-visual"), {
      scale: 0.94,
      rotate: -2,
      opacity: 0.65,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 72%",
        scrub: 0.8,
      },
      delay: index * 0.08,
    });
  });

  const processSteps = document.querySelector(".process-steps");
  const processCard = document.querySelector(".process-card");

  if (processSteps && processCard) {
    gsap.to(processSteps, {
      y: -30,
      ease: "none",
      scrollTrigger: {
        trigger: processCard,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  gsap.utils.toArray(".count").forEach((count) => {
    const target = Number(count.dataset.count);
    gsap.to(count, {
      innerText: target,
      duration: 1.6,
      snap: { innerText: 1 },
      ease: "power2.out",
      scrollTrigger: {
        trigger: count,
        start: "top 82%",
        once: true,
      },
    });
  });
}

function setupProjectsEntrance() {
  const section = document.querySelector("[data-projects-section]");
  if (!section) return;

  const kicker = section.querySelector(".projects-kicker");
  const title = section.querySelector(".projects-title");
  const cards = Array.from(section.querySelectorAll(".project-card"));

  if (!cards.length) return;

  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
    [kicker, title, ...cards].forEach((element) => {
      if (!element) return;

      element.style.opacity = "1";
      element.style.transform = "none";
      element.style.filter = "none";
    });
    return;
  }

  const visuals = cards.map((card) => card.querySelector(".project-visual")).filter(Boolean);
  const numbers = cards.map((card) => card.querySelector(".project-visual span")).filter(Boolean);
  const infoBlocks = cards.flatMap((card) => Array.from(card.querySelectorAll(".project-info > *")));

  gsap.set(kicker, {
    autoAlpha: 0,
    y: 28,
    filter: "blur(10px)",
  });

  gsap.set(cards, {
    autoAlpha: 0,
    y: 72,
    scale: 0.965,
    rotateX: 8,
    filter: "blur(14px)",
    transformOrigin: "center bottom",
  });

  gsap.set(visuals, {
    scale: 0.92,
    rotate: -2,
    transformOrigin: "center center",
  });

  gsap.set(numbers, {
    autoAlpha: 0,
    scale: 1.55,
    rotate: -10,
    transformOrigin: "left top",
  });

  gsap.set(infoBlocks, {
    autoAlpha: 0,
    y: 18,
  });

  const entrance = gsap.timeline({ paused: true });

  entrance
    .to(kicker, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.78,
      ease: "power3.out",
    })
    .to(
      cards,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      },
      "-=0.28"
    )
    .to(
      visuals,
      {
        scale: 1,
        rotate: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      },
      "<"
    )
    .to(
      numbers,
      {
        autoAlpha: 1,
        scale: 1,
        rotate: 0,
        duration: 0.58,
        stagger: 0.08,
        ease: "back.out(1.8)",
      },
      "-=0.52"
    )
    .to(
      infoBlocks,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.58,
        stagger: 0.025,
        ease: "power2.out",
      },
      "-=0.62"
    );

  ScrollTrigger.create({
    trigger: section,
    start: "top 72%",
    onEnter: () => entrance.play(),
    onEnterBack: () => entrance.play(),
    onLeaveBack: () => entrance.reverse(),
    onRefresh: (self) => {
      if (self.isActive || self.progress > 0) {
        entrance.progress(1);
      }
    },
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function setupAchievementsSection() {
  const section = document.querySelector("[data-achievements-section]");
  if (!section) return;

  const kicker = section.querySelector(".achievements-kicker");
  const title = section.querySelector(".achievements-title");
  const tabs = Array.from(section.querySelectorAll("[data-achievement-tab]"));
  const cards = Array.from(section.querySelectorAll("[data-achievement-card]"));
  const media = Array.from(section.querySelectorAll(".achievement-media"));
  const images = Array.from(section.querySelectorAll(".achievement-media img"));
  const content = cards.flatMap((card) => Array.from(card.querySelectorAll(".achievement-content > *")));

  if (!cards.length) return;

  const maxIndex = cards.length - 1;
  const clampIndex = (index) => Math.max(0, Math.min(maxIndex, index));

  const setActiveAchievement = (index) => {
    const activeIndex = clampIndex(index);

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === activeIndex;
      card.classList.toggle("is-active", isActive);

      if (isActive) {
        card.setAttribute("aria-current", "step");
      } else {
        card.removeAttribute("aria-current");
      }
    });

    tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === activeIndex;
      tab.classList.toggle("is-active", isActive);

      if (isActive) {
        tab.setAttribute("aria-current", "step");
      } else {
        tab.removeAttribute("aria-current");
      }
    });
  };

  cards.forEach((card, index) => {
    card.addEventListener("pointerenter", () => setActiveAchievement(index));
    card.addEventListener("focusin", () => setActiveAchievement(index));
    card.addEventListener("click", () => setActiveAchievement(index));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      setActiveAchievement(index);
    });
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("pointerenter", () => setActiveAchievement(index));
    tab.addEventListener("focus", () => setActiveAchievement(index));
    tab.addEventListener("click", () => {
      setActiveAchievement(index);
      cards[index]?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    });
  });

  setActiveAchievement(0);

  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
    [kicker, title, ...tabs, ...cards].forEach((element) => {
      if (!element) return;

      element.style.opacity = "1";
      element.style.transform = "none";
      element.style.filter = "none";
    });
    return;
  }

  gsap.set(kicker, {
    autoAlpha: 0,
    y: 32,
    filter: "blur(12px)",
  });

  gsap.set(tabs, {
    autoAlpha: 0,
    y: 18,
    scale: 0.96,
  });

  gsap.set(cards, {
    autoAlpha: 0,
    y: 76,
    rotateX: 8,
    scale: 0.965,
    filter: "blur(14px)",
    transformOrigin: "center bottom",
  });

  gsap.set(media, {
    clipPath: "inset(12% 10% round 26px)",
  });

  gsap.set(images, {
    scale: 1.12,
    filter: "saturate(0.8) contrast(0.95) blur(4px)",
  });

  gsap.set(content, {
    autoAlpha: 0,
    y: 18,
  });

  const entrance = gsap.timeline({ paused: true });

  entrance
    .to(kicker, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.82,
      ease: "power3.out",
    })
    .to(
      tabs,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.58,
        stagger: 0.08,
        ease: "back.out(1.55)",
      },
      "-=0.36"
    )
    .to(
      cards,
      {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.9,
        stagger: 0.16,
        ease: "power3.out",
      },
      "-=0.22"
    )
    .to(
      media,
      {
        clipPath: "inset(0% 0% round 26px)",
        duration: 0.86,
        stagger: 0.13,
        ease: "power3.out",
      },
      "<"
    )
    .to(
      images,
      {
        scale: 1,
        filter: "saturate(1.05) contrast(1.02) blur(0px)",
        duration: 1,
        stagger: 0.13,
        ease: "power3.out",
      },
      "<"
    )
    .to(
      content,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.58,
        stagger: 0.035,
        ease: "power2.out",
      },
      "-=0.62"
    );

  ScrollTrigger.create({
    trigger: section,
    start: "top 72%",
    onEnter: () => entrance.play(),
    onEnterBack: () => entrance.play(),
    onLeaveBack: () => entrance.reverse(),
    onRefresh: (self) => {
      if (self.isActive || self.progress > 0) {
        entrance.progress(1);
      }
    },
  });

  images.forEach((image) => {
    image.addEventListener(
      "load",
      () => {
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function setupStoryGallery() {
  const section = document.querySelector("[data-gallery-story]");
  if (!section) return;

  const slides = window.gsap
    ? gsap.utils.toArray(section.querySelectorAll("[data-gallery-slide]"))
    : Array.from(section.querySelectorAll("[data-gallery-slide]"));
  const dots = window.gsap
    ? gsap.utils.toArray(section.querySelectorAll("[data-gallery-dot]"))
    : Array.from(section.querySelectorAll("[data-gallery-dot]"));
  const lines = window.gsap
    ? gsap.utils.toArray(section.querySelectorAll(".story-line"))
    : Array.from(section.querySelectorAll(".story-line"));
  const tags = section.querySelector(".story-tags");
  const counter = section.querySelector("[data-gallery-count]");
  const caption = section.querySelector("[data-gallery-caption]");
  const track = section.querySelector("[data-gallery-track]");

  if (!slides.length) return;

  let activeIndex = -1;
  const maxIndex = slides.length - 1;
  const clampIndex = (index) => Math.max(0, Math.min(maxIndex, index));
  const clampProgress = (progress) => Math.max(0, Math.min(1, progress));

  const setActiveSlide = (index, progress = maxIndex ? index / maxIndex : 0) => {
    const nextIndex = clampIndex(index);

    if (track) {
      track.style.setProperty("--progress", `${8 + clampProgress(progress) * 84}%`);
    }

    if (nextIndex === activeIndex) return;

    activeIndex = nextIndex;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
    });

    if (counter) {
      counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(
        slides.length
      ).padStart(2, "0")}`;
    }

    if (caption) {
      caption.textContent = slides[activeIndex].dataset.caption || "";
    }
  };

  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
    slides.forEach((slide, index) => {
      slide.style.opacity = index === 0 ? "1" : "0";
      slide.style.visibility = index === 0 ? "visible" : "hidden";
      slide.style.transform = "none";
    });
    setActiveSlide(0, 0);
    return;
  }

  gsap.set(slides, {
    autoAlpha: 0,
    yPercent: -78,
    scale: 0.92,
    rotate: -5,
    filter: "blur(10px)",
  });
  gsap.set(slides[0], {
    autoAlpha: 1,
    yPercent: 0,
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    zIndex: 2,
  });

  gsap.fromTo(
    lines,
    { autoAlpha: 0, y: 36, filter: "blur(10px)" },
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.9,
      stagger: 0.16,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 72%",
        toggleActions: "play none none reverse",
      },
    }
  );

  if (tags) {
    gsap.fromTo(
      tags.children,
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: tags,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }

  const frame = section.querySelector(".story-frame");
  if (frame) {
    gsap.fromTo(
      frame,
      { y: 30, rotateX: 5, scale: 0.96 },
      {
        y: 0,
        rotateX: 0,
        scale: 1,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: frame,
          start: "top 84%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }

  const carousel = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });

  slides.forEach((slide, index) => {
    gsap.set(slide, { zIndex: index + 1 });
  });

  for (let index = 0; index < slides.length - 1; index += 1) {
    const current = slides[index];
    const next = slides[index + 1];
    const currentImage = current.querySelector("img");
    const nextImage = next.querySelector("img");

    carousel
      .set(next, { zIndex: index + 3 }, index)
      .to(
        current,
        {
          yPercent: 76,
          scale: 0.9,
          rotate: 5,
          autoAlpha: 0,
          filter: "blur(10px)",
          duration: 1,
        },
        index
      )
      .fromTo(
        next,
        {
          yPercent: -78,
          scale: 0.92,
          rotate: -5,
          autoAlpha: 0,
          filter: "blur(10px)",
        },
        {
          yPercent: 0,
          scale: 1,
          rotate: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 1,
          immediateRender: false,
        },
        index
      );

    if (currentImage) {
      carousel.to(
        currentImage,
        {
          yPercent: 7,
          scale: 1.04,
          duration: 1,
        },
        index
      );
    }

    if (nextImage) {
      carousel.fromTo(
        nextImage,
        { yPercent: -6, scale: 1.08 },
        {
          yPercent: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          immediateRender: false,
        },
        index
      );
    }
  }

  setActiveSlide(0, 0);

  const canPin = window.matchMedia("(min-width: 981px)").matches;

  ScrollTrigger.create({
    trigger: section,
    start: canPin ? "top top" : "top 68%",
    end: canPin ? `+=${Math.max(slides.length - 1, 1) * 105}%` : "bottom top",
    scrub: canPin ? 0.72 : true,
    pin: canPin,
    animation: carousel,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = clampProgress(self.progress);
      const index = Math.round(progress * maxIndex);
      setActiveSlide(index, progress);
    },
    onLeave: () => setActiveSlide(maxIndex, 1),
    onLeaveBack: () => setActiveSlide(0, 0),
  });

  section.querySelectorAll("img").forEach((image) => {
    image.addEventListener(
      "load",
      () => {
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  });
}

function setupStackStoryboard() {
  const section = document.querySelector(".skills-section");
  const grid = section?.querySelector(".skills-grid");
  const cards = window.gsap ? gsap.utils.toArray(".skills-grid .skill-card") : [];
  const isTouchLike =
    window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;

  if (!section || !grid) {
    return;
  }

  if (!window.gsap || !window.ScrollTrigger || reducedMotion() || !cards.length) {
    section.classList.add("is-stack-revealed");
    return;
  }

  const hasStackRoom = window.matchMedia("(min-width: 981px)").matches;

  if (!hasStackRoom || isTouchLike) {
    section.classList.add("is-stack-revealed");
    section.classList.remove("is-stack-story");

    gsap.set(cards, {
      opacity: 1,
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      "--stack-front-opacity": 0,
      "--stack-content-opacity": 1,
      "--stack-content-y": "0px",
    });
    return;
  }

  section.classList.add("is-stack-story");
  section.classList.remove("is-stack-revealed");

  const breakOffsets = [
    { x: -34, y: -18, rotateY: -18, rotateZ: -3.8 },
    { x: 0, y: -30, rotateY: 10, rotateZ: 2.4 },
    { x: 36, y: -16, rotateY: 20, rotateZ: 4.2 },
    { x: -38, y: 18, rotateY: -22, rotateZ: 4 },
    { x: 0, y: 32, rotateY: -10, rotateZ: -2.2 },
    { x: 40, y: 18, rotateY: 18, rotateZ: -4.4 },
  ];

  gsap.set(section, {
    "--stack-gap": "0px",
    "--stack-card-radius": "14px",
  });

  gsap.set(cards, {
    opacity: 1,
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    transformOrigin: "center center",
    "--stack-front-opacity": 1,
    "--stack-front-rotate": "0deg",
    "--stack-content-opacity": 0,
    "--stack-content-y": "24px",
  });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=155%",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          section.classList.toggle("is-stack-revealed", self.progress > 0.985);
        },
        onLeave: () => section.classList.add("is-stack-revealed"),
        onEnterBack: () => section.classList.remove("is-stack-revealed"),
        onRefresh: (self) => {
          section.classList.toggle("is-stack-revealed", self.progress > 0.985);
        },
      },
    })
    .to(
      section,
      {
        "--stack-gap": "18px",
        "--stack-card-radius": "24px",
        duration: 0.38,
        ease: "power2.inOut",
      },
      0
    )
    .to(
      cards,
      {
        x: (index) => breakOffsets[index]?.x || 0,
        y: (index) => breakOffsets[index]?.y || 0,
        rotateY: (index) => breakOffsets[index]?.rotateY || 0,
        rotateZ: (index) => breakOffsets[index]?.rotateZ || 0,
        scale: 0.965,
        duration: 0.38,
        stagger: { each: 0.025, from: "center" },
        ease: "power2.inOut",
      },
      0.08
    )
    .to(
      cards,
      {
        "--stack-front-rotate": "-125deg",
        "--stack-front-opacity": 0.05,
        duration: 0.34,
        stagger: { each: 0.032, from: "center" },
        ease: "power2.in",
      },
      0.28
    )
    .to(
      cards,
      {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        duration: 0.5,
        stagger: { each: 0.034, from: "center" },
        ease: "back.out(1.25)",
      },
      0.46
    )
    .to(
      cards,
      {
        "--stack-front-opacity": 0,
        "--stack-content-opacity": 1,
        "--stack-content-y": "0px",
        duration: 0.36,
        stagger: { each: 0.032, from: "center" },
        ease: "power2.out",
      },
      0.56
    );
}

function setupExperienceJourney() {
  const section = document.querySelector("[data-experience-section]");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll("[data-experience-card]"));
  const tabs = Array.from(section.querySelectorAll("[data-experience-tab]"));
  const orbit = section.querySelector(".experience-orbit");
  const nodes = Array.from(section.querySelectorAll(".experience-node"));

  if (!cards.length) return;

  const maxIndex = cards.length - 1;
  const clampIndex = (index) => Math.max(0, Math.min(maxIndex, index));

  const setActiveExperience = (index) => {
    const activeIndex = clampIndex(index);

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === activeIndex;
      card.classList.toggle("is-active", isActive);

      if (isActive) {
        card.setAttribute("aria-current", "step");
      } else {
        card.removeAttribute("aria-current");
      }
    });

    tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === activeIndex;
      tab.classList.toggle("is-active", isActive);

      if (isActive) {
        tab.setAttribute("aria-current", "step");
      } else {
        tab.removeAttribute("aria-current");
      }
    });
  };

  cards.forEach((card, index) => {
    card.addEventListener("pointerenter", () => setActiveExperience(index));
    card.addEventListener("focusin", () => setActiveExperience(index));
    card.addEventListener("click", () => setActiveExperience(index));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      setActiveExperience(index);
    });
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("pointerenter", () => setActiveExperience(index));
    tab.addEventListener("focus", () => setActiveExperience(index));
    tab.addEventListener("click", () => {
      setActiveExperience(index);
      cards[index]?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    });
  });

  setActiveExperience(0);

  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
    cards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "none";
      card.style.filter = "none";
    });
    return;
  }

  gsap.set(cards, {
    autoAlpha: 0,
    x: 0,
    y: 24,
    rotateY: -8,
    filter: "blur(12px)",
    transformOrigin: "left center",
  });
  gsap.set(tabs, { autoAlpha: 0, x: -20 });
  gsap.set(orbit, { autoAlpha: 0, scale: 0.9, rotate: -4 });
  gsap.set(nodes, { scale: 0, transformOrigin: "center center" });

  const entrance = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 72%",
      toggleActions: "play none none reverse",
    },
  });

  entrance
    .to(
      orbit,
      {
        autoAlpha: 1,
        scale: 1,
        rotate: 0,
        duration: 0.95,
        ease: "back.out(1.35)",
      },
      0.1
    )
    .to(
      nodes,
      {
        scale: 1,
        duration: 0.44,
        stagger: 0.08,
        ease: "back.out(2)",
      },
      0.45
    )
    .to(
      tabs,
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.58,
        stagger: 0.07,
        ease: "power3.out",
      },
      0.25
    )
    .to(
      cards,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotateY: 0,
        filter: "blur(0px)",
        duration: 0.82,
        stagger: 0.13,
        ease: "power3.out",
      },
      0.34
    );

  gsap.to(".experience-orbit", {
    y: -26,
    rotate: 2.6,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2,
    },
  });

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom 48%",
    onUpdate: () => {
      const userIsInteracting = section.matches(":hover") || section.contains(document.activeElement);

      if (userIsInteracting) return;

      const rect = section.getBoundingClientRect();
      const startLine = window.innerHeight * 0.16;
      const endLine = window.innerHeight * 0.58;

      if (rect.top > startLine) {
        setActiveExperience(0);
        return;
      }

      if (rect.bottom < endLine) {
        setActiveExperience(maxIndex);
        return;
      }

      const travel = Math.max(1, rect.height - endLine + startLine);
      const progressValue = Math.max(0, Math.min(1, (startLine - rect.top) / travel));
      setActiveExperience(Math.round(progressValue * maxIndex));
    },
  });
}

function setupEducationExperience() {
  const section = document.querySelector("[data-education-section]");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll("[data-education-card]"));
  const markers = Array.from(section.querySelectorAll("[data-education-marker]"));
  const progress = section.querySelector("[data-education-progress]");
  const artLayers = Array.from(section.querySelectorAll(".education-art > span"));

  if (!cards.length) return;

  const maxIndex = cards.length - 1;
  const clampIndex = (index) => Math.max(0, Math.min(maxIndex, index));

  const setActiveEducation = (index) => {
    const activeIndex = clampIndex(index);
    const progressValue = maxIndex ? `${(activeIndex / maxIndex) * 100}%` : "100%";

    if (progress) {
      progress.style.setProperty("--education-progress", progressValue);
    }

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === activeIndex;
      card.classList.toggle("is-active", isActive);

      if (isActive) {
        card.setAttribute("aria-current", "step");
      } else {
        card.removeAttribute("aria-current");
      }
    });

    markers.forEach((marker, markerIndex) => {
      const isActive = markerIndex === activeIndex;
      marker.classList.toggle("is-active", isActive);

      if (isActive) {
        marker.setAttribute("aria-current", "step");
      } else {
        marker.removeAttribute("aria-current");
      }
    });
  };

  cards.forEach((card, index) => {
    card.addEventListener("pointerenter", () => setActiveEducation(index));
    card.addEventListener("focusin", () => setActiveEducation(index));
    card.addEventListener("click", () => setActiveEducation(index));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      setActiveEducation(index);
    });
  });

  markers.forEach((marker, index) => {
    marker.addEventListener("pointerenter", () => setActiveEducation(index));
    marker.addEventListener("focus", () => setActiveEducation(index));
    marker.addEventListener("click", () => {
      setActiveEducation(index);
      cards[index]?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    });
  });

  setActiveEducation(0);

  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
    cards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "none";
      card.style.filter = "none";
    });
    return;
  }

  gsap.set(cards, {
    autoAlpha: 0,
    y: 46,
    rotateX: 8,
    filter: "blur(12px)",
    transformOrigin: "center bottom",
  });
  gsap.set(markers, { autoAlpha: 0, x: -18 });
  gsap.set(artLayers, { autoAlpha: 0, scale: 0.92, rotate: -3 });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 72%",
        toggleActions: "play none none reverse",
      },
    })
    .to(
      artLayers,
      {
        autoAlpha: 1,
        scale: 1,
        rotate: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      },
      0
    )
    .to(
      markers,
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.62,
        stagger: 0.08,
        ease: "back.out(1.7)",
      },
      0.12
    )
    .to(
      cards,
      {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.86,
        stagger: 0.13,
        ease: "power3.out",
      },
      0.22
    );

  gsap.to(".education-art-ring", {
    rotate: 18,
    y: -36,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2,
    },
  });

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom 46%",
    onUpdate: () => {
      const userIsInteracting = section.matches(":hover") || section.contains(document.activeElement);

      if (userIsInteracting) return;

      const rect = section.getBoundingClientRect();
      const startLine = window.innerHeight * 0.14;
      const endLine = window.innerHeight * 0.62;

      if (rect.top > startLine) {
        setActiveEducation(0);
        return;
      }

      if (rect.bottom < endLine) {
        setActiveEducation(maxIndex);
        return;
      }

      const travel = Math.max(1, rect.height - endLine + startLine);
      const progressValue = Math.max(0, Math.min(1, (startLine - rect.top) / travel));
      setActiveEducation(Math.round(progressValue * maxIndex));
    },
  });
}

function setupScrollTextReveal() {
  const titles = document.querySelectorAll(".section-title:not([data-no-scroll-split])");
  if (!titles.length) return;

  titles.forEach((title) => {
    if (!title.dataset.originalText) {
      const originalText = title.textContent.replace(/\s+/g, " ").trim();
      title.dataset.originalText = originalText;
      title.setAttribute("aria-label", originalText);
      title.classList.add("scroll-split");
      title.textContent = "";

      originalText.split(/(\s+)/).forEach((token) => {
        if (!token.trim()) {
          title.appendChild(document.createTextNode(token));
          return;
        }

        const word = document.createElement("span");
        const base = document.createElement("span");
        const fill = document.createElement("span");

        word.className = "scroll-word";
        base.className = "scroll-word-base";
        fill.className = "scroll-word-fill";
        fill.setAttribute("aria-hidden", "true");
        base.textContent = token;
        fill.textContent = token;

        word.append(base, fill);
        title.appendChild(word);
      });
    }

    const words = title.querySelectorAll(".scroll-word");
    if (!words.length) return;

    if (!window.gsap || !window.ScrollTrigger || reducedMotion()) {
      words.forEach((word) => word.style.setProperty("--word-fill", "100%"));
      return;
    }

    const updateWords = (progress) => {
      const wordCount = words.length;
      const normalizedProgress = gsap.utils.clamp(0, 1, progress);

      words.forEach((word, index) => {
        const localProgress = gsap.utils.clamp(
          0,
          1,
          (normalizedProgress * (wordCount + 0.85) - index) / 0.9
        );

        gsap.set(word, {
          "--word-fill": `${Math.round(localProgress * 1000) / 10}%`,
          y: 10 * (1 - localProgress),
        });
      });
    };

    updateWords(0);

    ScrollTrigger.create({
      trigger: title,
      start: "top 88%",
      end: "top 42%",
      invalidateOnRefresh: true,
      onUpdate: (self) => updateWords(self.progress),
      onRefresh: (self) => updateWords(self.progress),
      onLeave: () => updateWords(1),
      onLeaveBack: () => updateWords(0),
    });
  });

  if (window.ScrollTrigger && !reducedMotion()) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}

function setupMagneticButtons() {
  if (reducedMotion()) return;

  document.querySelectorAll(".button, .header-cta").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      gsap.to(button, {
        x: x * 0.16,
        y: y * 0.22,
        duration: 0.35,
        ease: "power3.out",
      });
    });

    button.addEventListener("mouseleave", () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: "elastic.out(1, 0.45)",
      });
    });
  });
}

function setupMarqueeHover() {
  const words = document.querySelectorAll(".marquee-track span");
  if (!words.length || reducedMotion()) return;

  words.forEach((word) => {
    const activate = () => {
      word.classList.add("is-marquee-hot");

      if (!window.gsap) return;

      gsap.killTweensOf(word);
      gsap.to(word, {
        y: -8,
        scale: 1.08,
        color: "#ff334e",
        textShadow: "0 0 18px rgba(255, 51, 78, 0.7), 0 0 42px rgba(255, 78, 205, 0.34)",
        "--mark-opacity": 1,
        "--mark-scale": 1,
        duration: 0.34,
        ease: "back.out(1.8)",
        overwrite: true,
      });
    };

    const deactivate = () => {
      word.classList.remove("is-marquee-hot");

      if (!window.gsap) return;

      gsap.killTweensOf(word);
      gsap.to(word, {
        y: 0,
        scale: 1,
        color: "rgba(245, 247, 251, 0.72)",
        textShadow: "0 0 0 rgba(255, 51, 78, 0)",
        "--mark-opacity": 0,
        "--mark-scale": 0,
        duration: 0.38,
        ease: "power3.out",
        overwrite: true,
      });
    };

    word.addEventListener("pointerenter", activate);
    word.addEventListener("mouseenter", activate);
    word.addEventListener("pointerleave", deactivate);
    word.addEventListener("mouseleave", deactivate);
  });
}

function setupFlyingAccents() {
  const stage = document.querySelector(".ambient-stage");
  if (!stage || reducedMotion()) return;

  const sparkCount = window.innerWidth > 760 ? 16 : 8;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < sparkCount; index += 1) {
    const spark = document.createElement("span");
    spark.className = "flying-spark";
    spark.style.setProperty("--top", `${8 + Math.random() * 84}%`);
    spark.style.setProperty("--size", `${70 + Math.random() * 150}px`);
    spark.style.setProperty("--duration", `${13 + Math.random() * 13}s`);
    spark.style.setProperty("--delay", `${Math.random() * -18}s`);
    fragment.appendChild(spark);
  }

  stage.appendChild(fragment);
}

function setupArtParallax() {
  if (!window.gsap || !window.ScrollTrigger || reducedMotion()) return;

  const hasDesktopRoom = window.matchMedia("(min-width: 641px)").matches;

  gsap.utils.toArray("[data-depth]").forEach((layer, index) => {
    const depth = Number(layer.dataset.depth || 0);

    gsap.to(layer, {
      y: depth,
      x: index % 2 === 0 ? depth * 0.16 : depth * -0.12,
      rotate: index % 2 === 0 ? 7 : -7,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.25,
      },
    });
  });

  if (hasDesktopRoom) {
    gsap.to(".hero-card", {
      yPercent: -8,
      rotate: -1.2,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(".hero-copy", {
      yPercent: 5,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  gsap.utils.toArray(".section").forEach((section, index) => {
    gsap.fromTo(
      section,
      { "--section-depth": "0px" },
      {
        "--section-depth": index % 2 === 0 ? "18px" : "-18px",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      }
    );
  });
}

function setupCardSpotlights() {
  const cards = document.querySelectorAll(
    ".about-panel, .project-card, .achievement-card, .experience-card, .education-card, .reference-card, .contact-card, .hero-metrics div"
  );
  const canTilt = window.matchMedia("(pointer: fine)").matches && !reducedMotion() && window.gsap;

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);

      if (!canTilt || event.pointerType === "touch") return;

      gsap.to(card, {
        rotateX: (0.5 - y) * 5,
        rotateY: (x - 0.5) * 6,
        y: -4,
        duration: 0.35,
        ease: "power2.out",
        transformPerspective: 900,
      });
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");

      if (!canTilt) return;

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        duration: 0.55,
        ease: "elastic.out(1, 0.5)",
      });
    });
  });
}

function setupMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const menu = document.querySelector(".mobile-menu");
  const links = menu.querySelectorAll(".mobile-nav a");
  let isOpen = false;

  function openMenu() {
    isOpen = true;
    hamburger.classList.add("is-active");
    menu.classList.add("is-open");
    document.body.style.overflow = "hidden";

    if (!window.gsap || reducedMotion()) {
      return;
    }

    gsap.set(menu, { opacity: 1 });
    gsap.fromTo(
      links,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out" }
    );
  }

  function closeMenu() {
    isOpen = false;
    hamburger.classList.remove("is-active");
    menu.classList.remove("is-open");
    document.body.style.overflow = "";

    if (window.gsap && !reducedMotion()) {
      gsap.set(links, { opacity: 0, y: 24 });
    }
  }

  hamburger.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href");
      closeMenu();
      if (window.gsap) {
        gsap.to(window, { duration: 0.6, scrollTo: { y: target }, ease: "power3.inOut" });
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (isOpen && !menu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });
}

function setupChromeTouchScrollSync() {
  if (!window.ScrollTrigger || !isChromeTouchBrowser() || reducedMotion()) return;

  let updateFrame = 0;
  let refreshTimer = 0;

  const updateScrollTriggers = () => {
    if (updateFrame) return;

    updateFrame = requestAnimationFrame(() => {
      updateFrame = 0;
      ScrollTrigger.update();
    });
  };

  const refreshAfterTouch = () => {
    updateScrollTriggers();
    clearTimeout(refreshTimer);

    refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      updateScrollTriggers();
    }, 140);
  };

  window.addEventListener("scroll", updateScrollTriggers, { passive: true });
  document.addEventListener("touchmove", updateScrollTriggers, { passive: true });
  document.addEventListener("touchend", refreshAfterTouch, { passive: true });
  document.addEventListener("touchcancel", refreshAfterTouch, { passive: true });
  window.addEventListener("orientationchange", refreshAfterTouch, { passive: true });
  window.visualViewport?.addEventListener("resize", refreshAfterTouch, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(refreshAfterTouch).catch(() => {});
  }

  if (document.readyState === "complete") {
    refreshAfterTouch();
  } else {
    window.addEventListener("load", refreshAfterTouch, { once: true });
  }
}

function setupMobilePinSpacerCleanup() {
  if (!window.ScrollTrigger || !window.gsap || reducedMotion()) return;

  const mobileLayout = window.matchMedia("(max-width: 980px)");
  let cleanupFrame = 0;

  const resetMobileStack = () => {
    const section = document.querySelector(".skills-section");
    const cards = gsap.utils.toArray(".skills-grid .skill-card");

    if (!section || !cards.length) return;

    section.classList.add("is-stack-revealed");
    section.classList.remove("is-stack-story");
    section.style.removeProperty("--stack-gap");
    section.style.removeProperty("--stack-card-radius");

    gsap.set(cards, {
      clearProps: "transform",
      opacity: 1,
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      "--stack-front-opacity": 0,
      "--stack-content-opacity": 1,
      "--stack-content-y": "0px",
    });
  };

  const unwrapStalePinSpacers = () => {
    let changed = false;

    ScrollTrigger.getAll().forEach((trigger) => {
      if (!trigger.pin) return;

      trigger.kill(true);
      changed = true;
    });

    document.querySelectorAll(".pin-spacer").forEach((spacer) => {
      const pinnedElement = Array.from(spacer.children).find((child) => child.nodeType === 1);

      if (pinnedElement && spacer.parentNode) {
        spacer.parentNode.insertBefore(pinnedElement, spacer);
      }

      spacer.remove();
      changed = true;
    });

    resetMobileStack();

    if (changed) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  };

  const queueCleanup = () => {
    if (!mobileLayout.matches || cleanupFrame) return;

    cleanupFrame = requestAnimationFrame(() => {
      cleanupFrame = 0;
      unwrapStalePinSpacers();
    });
  };

  queueCleanup();
  window.addEventListener("resize", queueCleanup, { passive: true });
  window.addEventListener("orientationchange", queueCleanup, { passive: true });
  window.visualViewport?.addEventListener("resize", queueCleanup, { passive: true });
}

setupCursor();
setupDeveloperScene();
setupFlyingAccents();
setupAnimations();
setupProjectsEntrance();
setupAchievementsSection();
setupStackStoryboard();
setupExperienceJourney();
setupEducationExperience();
setupScrollTextReveal();
setupArtParallax();
setupMagneticButtons();
setupMarqueeHover();
setupCardSpotlights();
setupMobileMenu();
setupChromeTouchScrollSync();
setupMobilePinSpacerCleanup();
