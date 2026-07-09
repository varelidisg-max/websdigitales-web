(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
     SAFE WRAPPER — one failing init must not break the rest
  ───────────────────────────────────────────────────────────── */
  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn("[GRILLED] " + name + " init error:", e); }
  }

  /* ─────────────────────────────────────────────────────────────
     1. SPLASH
  ───────────────────────────────────────────────────────────── */
  function initSplash() {
    var splash = document.querySelector(".splash");
    if (!splash) return;

    function hideSplash() {
      splash.classList.add("is-out");
    }

    // JS safety: fire on load event
    if (document.readyState === "complete") {
      setTimeout(hideSplash, 600);
    } else {
      window.addEventListener("load", function () {
        setTimeout(hideSplash, 600);
      });
    }

    // Double safety: 4.6s CSS animation covers the rest
  }

  /* ─────────────────────────────────────────────────────────────
     2. NAV — hamburger + scroll solidify
  ───────────────────────────────────────────────────────────── */
  function initNav() {
    var nav        = document.querySelector(".nav");
    var hamburger  = document.querySelector(".nav-hamburger");
    var mobileNav  = document.querySelector(".nav-mobile");
    var mobileClose = document.querySelector(".nav-mobile-close");
    var mobileLinks = document.querySelectorAll(".nav-mobile nav a");

    if (!nav) return;

    // Scroll solidify
    var lastY = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > 48) {
        nav.classList.add("is-scrolled");
      } else {
        nav.classList.remove("is-scrolled");
      }
      lastY = y;
    }, { passive: true });

    // Hamburger toggle
    function openMobile() {
      if (!mobileNav) return;
      mobileNav.setAttribute("aria-hidden", "false");
      hamburger && hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMobile() {
      if (!mobileNav) return;
      mobileNav.setAttribute("aria-hidden", "true");
      hamburger && hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    if (hamburger) {
      hamburger.addEventListener("click", function () {
        var expanded = hamburger.getAttribute("aria-expanded") === "true";
        expanded ? closeMobile() : openMobile();
      });
    }
    if (mobileClose) {
      mobileClose.addEventListener("click", closeMobile);
    }
    if (mobileLinks.length) {
      mobileLinks.forEach(function (link) {
        link.addEventListener("click", closeMobile);
      });
    }

    // Escape closes mobile nav
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobile();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     3. CUSTOM CURSOR
  ───────────────────────────────────────────────────────────── */
  function initCursor() {
    var cursor = document.querySelector(".cursor");
    var dot    = document.querySelector(".cursor-dot");
    var ring   = document.querySelector(".cursor-ring");

    if (!cursor || !dot || !ring) return;

    // Only on hover devices
    var mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    document.documentElement.classList.add("has-cursor");

    var mx = 0, my = 0;
    var rx = 0, ry = 0;
    var rafId = null;

    function render() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform  = "translate(" + mx + "px," + my + "px)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      rafId = requestAnimationFrame(render);
    }

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!cursor.classList.contains("is-ready")) {
        cursor.classList.add("is-ready");
        render();
      }
    }, { passive: true });

    // Active state on interactive elements
    var interactives = "a, button, [role='button'], input, select, textarea";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(interactives)) {
        cursor.classList.add("is-active");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(interactives)) {
        cursor.classList.remove("is-active");
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     4. SCROLL REVEALS — IntersectionObserver + 6s safety
  ───────────────────────────────────────────────────────────── */
  function initReveals() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    var revealedAll = false;

    function revealEl(el) {
      el.classList.add("is-revealed");
    }

    // 6-second safety net: reveal everything that hasn't been triggered yet
    var safetyTimer = setTimeout(function () {
      if (!revealedAll) {
        targets.forEach(revealEl);
        revealedAll = true;
      }
    }, 6000);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealEl(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -20px 0px" });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────────
     5. SCATTER TITLE — CharacterV1 adapted to GSAP scrub
     Chars scatter from center, converge on scroll entry
  ───────────────────────────────────────────────────────────── */
  function initScatterTitle() {
    if (typeof gsap === "undefined") return;

    var el = document.querySelector("[data-scatter]");
    if (!el) return;

    // Parent must stay opacity:1 (defensive CSS covers this)
    el.style.opacity = "1";

    var text = el.textContent.trim();
    el.innerHTML = "";

    // Split into chars, wrapping spaces as non-breaking
    var chars = [];
    text.split("").forEach(function (ch) {
      var span = document.createElement("span");
      span.className = "scatter-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? " " : ch;
      el.appendChild(span);
      chars.push(span);
    });

    // Accessible text node for screen readers
    var sr = document.createElement("span");
    sr.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);";
    sr.textContent = text;
    el.appendChild(sr);

    var centerX = window.innerWidth / 2;
    var rect = el.getBoundingClientRect();
    var centerY = rect.top + rect.height / 2;

    // Set initial scatter positions — radiate from center of viewport
    chars.forEach(function (span, i) {
      var charRect = span.getBoundingClientRect();
      var charCX = charRect.left + charRect.width / 2;
      var charCY = charRect.top + charRect.height / 2;

      var dx = (charCX - centerX) * 1.6;
      var dy = (charCY - centerY) * 1.4;

      gsap.set(span, {
        x: dx,
        y: dy,
        opacity: 0,
        rotation: (Math.random() - 0.5) * 28,
        scale: 0.85,
      });
    });

    // ScrollTrigger: chars converge as section enters viewport
    try {
      if (typeof ScrollTrigger === "undefined") {
        // Fallback: just fade in after 300ms
        setTimeout(function () {
          chars.forEach(function (span) {
            gsap.to(span, { x: 0, y: 0, opacity: 1, rotation: 0, scale: 1, duration: .8, ease: "power3.out" });
          });
        }, 300);
        return;
      }

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          end: "top 20%",
          scrub: 0.9,
        }
      });

      chars.forEach(function (span, i) {
        tl.to(span, {
          x: 0, y: 0, opacity: 1, rotation: 0, scale: 1,
          ease: "power2.out",
          duration: 1,
        }, i * 0.015);
      });
    } catch (e) {
      // Fallback if ScrollTrigger fails
      chars.forEach(function (span) {
        gsap.to(span, { x: 0, y: 0, opacity: 1, rotation: 0, scale: 1, duration: .7 });
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     6. MARQUEE — GSAP duplicate+loop
  ───────────────────────────────────────────────────────────── */
  function initMarquee() {
    if (typeof gsap === "undefined") return;

    var tracks = document.querySelectorAll("[data-marquee]");
    tracks.forEach(function (track) {
      // Guard: idempotent — don't double-mount
      if (track.dataset.mquMounted) return;
      track.dataset.mquMounted = "1";

      // Clone content to ensure seamless loop
      var clone = track.innerHTML;
      track.innerHTML = clone + clone;

      var totalWidth = track.scrollWidth / 2;

      var tween = gsap.to(track, {
        x: -totalWidth,
        duration: totalWidth / 60,  // 60px/s
        ease: "none",
        repeat: -1,
      });

      // Pause on reduced-motion? No — marquee is mild. But respect if user has explicitly set it.
      // (skill rule: only gate truly intrusive effects)
    });
  }

  /* ─────────────────────────────────────────────────────────────
     7. PINNED HORIZONTAL GALLERY — ScrollTrigger pin+scrub
  ───────────────────────────────────────────────────────────── */
  function initShowcasePinned() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    // Only on desktop — on mobile the track wraps and scrolls vertically
    var mq = window.matchMedia("(min-width: 960px)");
    if (!mq.matches) return;

    var section = document.querySelector(".section-galeria");
    var track   = document.querySelector(".galeria-track");
    if (!section || !track) return;

    // Guard: idempotent
    if (section.dataset.pinnedMounted) return;
    section.dataset.pinnedMounted = "1";

    var distance = track.scrollWidth - window.innerWidth;
    if (distance <= 0) return;

    gsap.to(track, {
      x: -distance,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 0.6,
        start: "top top",
        end: "+=" + (distance + window.innerHeight * 0.2),
        invalidateOnRefresh: true,
        // No child animations inside pinned section (gotcha A.7)
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     8. 3D TILT — max 7° + radial halo on featured cuts
  ───────────────────────────────────────────────────────────── */
  function initTilt() {
    var mq = window.matchMedia("(hover: hover)");
    if (!mq.matches) return;

    var tiles = document.querySelectorAll("[data-tilt]");
    tiles.forEach(function (tile) {
      tile.classList.add("has-tilt");

      tile.addEventListener("mousemove", function (e) {
        var rect = tile.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top)  / rect.height;
        var MAX_DEG = 7;

        var rx =  (y - 0.5) * MAX_DEG * 2 * -1;
        var ry =  (x - 0.5) * MAX_DEG * 2;

        tile.style.setProperty("--rx", rx + "deg");
        tile.style.setProperty("--ry", ry + "deg");
        tile.style.setProperty("--mx", (x * 100) + "%");
        tile.style.setProperty("--my", (y * 100) + "%");
      });

      tile.addEventListener("mouseleave", function () {
        tile.style.setProperty("--rx", "0deg");
        tile.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     9. SMOOTH ANCHOR SCROLL — respects offset for fixed nav
  ───────────────────────────────────────────────────────────── */
  function initSmoothAnchors() {
    var NAV_H = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "72",
      10
    );

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - NAV_H - 8;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     10. VIDEO AUTOPLAY — pause if reduced-motion preference
         (this IS an intrusive effect: background video motion)
  ───────────────────────────────────────────────────────────── */
  function initVideo() {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) return;

    var video = document.querySelector(".hero-video");
    if (video) video.pause();
  }

  /* ─────────────────────────────────────────────────────────────
     11. GSAP REGISTER
  ───────────────────────────────────────────────────────────── */
  function registerGSAP() {
    if (typeof gsap === "undefined") {
      console.warn("[GRILLED] GSAP not loaded — animations skipped.");
      return false;
    }
    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    return true;
  }

  /* ─────────────────────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────────────────────── */
  function boot() {
    safe(registerGSAP,        "registerGSAP");
    safe(initSplash,          "splash");
    safe(initNav,             "nav");
    safe(initCursor,          "cursor");
    safe(initVideo,           "video");
    safe(initSmoothAnchors,   "smoothAnchors");
    safe(initReveals,         "reveals");
    safe(initMarquee,         "marquee");

    // GSAP-dependent — after DOM is ready and GSAP loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        safe(initScatterTitle,    "scatterTitle");
        safe(initShowcasePinned,  "showcasePinned");
        safe(initTilt,            "tilt");
      });
    } else {
      safe(initScatterTitle,    "scatterTitle");
      safe(initShowcasePinned,  "showcasePinned");
      safe(initTilt,            "tilt");
    }
  }

  // Wait for DOM before booting
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
