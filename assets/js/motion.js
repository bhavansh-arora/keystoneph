/* ==========================================================================
   Keystone Power Holdings — motion (GSAP + ScrollTrigger + Lenis)
   Everything here is progressive: with reduced motion or without GSAP the
   page renders fully, just without the choreography.
   ========================================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    doc.classList.add("motion-off");
    $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  var mm = gsap.matchMedia();

  /* ---------- smooth scroll ---------- */
  if (window.Lenis && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: -90 });
      });
    });
  }

  /* ---------- headline line splitting ---------- */
  function splitWords(el) {
    var frag = document.createDocumentFragment();
    function walk(node, wrapTag) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            if (wrapTag) { var c = wrapTag.cloneNode(false); c.textContent = part; w.appendChild(c); }
            else w.textContent = part;
            frag.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === "BR") { frag.appendChild(n.cloneNode()); return; }
          walk(n, n);
        }
      });
    }
    walk(el, null);
    el.innerHTML = "";
    el.appendChild(frag);
    return $$(".w", el);
  }
  function splitLines(el) {
    var original = el.innerHTML;
    var words = splitWords(el);
    var lines = [], top = null;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    });
    el.innerHTML = "";
    lines.forEach(function (ws) {
      var l = document.createElement("span"); l.className = "sl";
      var inner = document.createElement("span");
      ws.forEach(function (w, i) { inner.appendChild(w); if (i < ws.length - 1) inner.appendChild(document.createTextNode(" ")); });
      l.appendChild(inner); el.appendChild(l);
    });
    return { lines: $$(".sl > span", el), revert: function () { el.innerHTML = original; } };
  }

  function whenFontsReady(cb) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(cb); else cb();
  }

  function init() {
    /* hero intro (home) */
    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(hero.querySelector(".hero__media img"), { scale: 1.3 }, { scale: 1.12, duration: 2.4, ease: "power3.out" }, 0)
        .to(hero.querySelectorAll(".hero__title .line > span"), { y: 0, duration: 1.4, stagger: .1 }, .1)
        .to(hero.querySelectorAll("[data-hero-in]"), { opacity: 1, y: 0, duration: 1.2, stagger: .1 }, .5)
        .fromTo(hero.querySelector(".hero__sun"), { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: 2.2, ease: "power2.out" }, 0);

      mm.add("(min-width: 641px)", function () {
        gsap.to(hero.querySelector(".hero__media img"), { yPercent: 14, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(hero.querySelector(".hero__title"), { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(hero.querySelector(".hero__sun"), { yPercent: 30, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      });
    }

    /* inner page hero */
    var phero = document.querySelector(".phero");
    if (phero) {
      var pt = gsap.timeline({ defaults: { ease: "expo.out" } });
      var pimg = phero.querySelector(".phero__media img");
      if (pimg) pt.fromTo(pimg, { scale: 1.25 }, { scale: 1.08, duration: 2.2, ease: "power3.out" }, 0);
      pt.to(phero.querySelectorAll(".phero__title .line > span"), { y: 0, duration: 1.3, stagger: .09 }, .05)
        .to(phero.querySelectorAll("[data-hero-in]"), { opacity: 1, y: 0, duration: 1.1, stagger: .08 }, .35);
      if (pimg) gsap.to(pimg, { yPercent: 12, ease: "none", scrollTrigger: { trigger: phero, start: "top top", end: "bottom top", scrub: true } });
    }

    /* split headlines */
    $$("[data-split]").forEach(function (el) {
      var s = splitLines(el);
      gsap.to(s.lines, {
        y: 0, duration: 1.2, stagger: .08, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: s.revert
      });
    });

    /* fade-up reveals */
    ST.batch("[data-reveal]", {
      start: "top 90%", once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: .09, ease: "expo.out", overwrite: true }); }
    });

    /* counters */
    $$("[data-count]").forEach(function (el) {
      var end = +el.getAttribute("data-count"), o = { v: 0 };
      if (!end) { el.textContent = "0"; return; }
      gsap.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: function () { el.textContent = Math.round(o.v); } });
    });

    /* word-by-word highlight on scroll */
    $$("[data-words]").forEach(function (el) {
      var words = splitWords(el);
      gsap.fromTo(words, { opacity: .14 }, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });

    /* image parallax */
    $$("[data-parallax]").forEach(function (img) {
      var wrap = img.closest("[data-parallax-wrap]") || img.parentNode;
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* banner clip reveal */
    $$(".banner").forEach(function (b) {
      gsap.fromTo(b, { clipPath: "inset(12% 8% 0% 8% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", ease: "none", scrollTrigger: { trigger: b, start: "top 95%", end: "top 35%", scrub: true } });
    });

    /* horizontal sectors */
    mm.add("(min-width: 641px)", function () {
      var sec = document.querySelector("[data-hscroll]");
      if (!sec) return;
      var track = sec.querySelector("[data-hscroll-track]"), bar = sec.querySelector("[data-hscroll-bar]");
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tw = gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: {
          trigger: sec, start: "top top", end: function () { return "+=" + dist(); },
          pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) { if (bar) bar.style.transform = "scaleX(" + self.progress + ")"; }
        }
      });
      return function () { tw.kill(); };
    });

    /* process meter */
    var proc = document.querySelector("[data-process]");
    if (proc) {
      var pb = proc.querySelector("[data-process-bar]");
      if (pb) gsap.to(pb, { scaleX: 1, ease: "none", scrollTrigger: { trigger: proc.querySelector(".steps"), start: "top 70%", end: "bottom 60%", scrub: true } });
    }

    /* timeline fill */
    $$(".timeline__fill").forEach(function (f) {
      gsap.to(f, { scaleX: 1, ease: "none", scrollTrigger: { trigger: f.parentNode, start: "top 80%", end: "bottom 50%", scrub: true } });
    });

    /* footer word */
    var fw = document.querySelector(".footer__word");
    if (fw) gsap.fromTo(fw, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: fw, start: "top bottom", end: "bottom 85%", scrub: true } });

    /* CTA title */
    var ct = document.querySelector(".cta__rays");
    if (ct) gsap.fromTo(ct, { scale: .8 }, { scale: 1.1, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });

    window.addEventListener("load", function () { ST.refresh(); });
  }

  whenFontsReady(function () {
    if (window.__kphReady) init();
    else document.addEventListener("kph:ready", init, { once: true });
  });
})();
