/* ==========================================================================
   Keystone Power Holdings — motion (GSAP + ScrollTrigger + Lenis)
   Everything here is progressive: with reduced motion or without GSAP the
   page renders fully, just without the choreography.
   ========================================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
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
    /* page intro: copy rises, arch image unveils from the bottom */
    var intro = $$("[data-hero-in]"), heroImg = $$("[data-hero-img]");
    var itl = gsap.timeline({ defaults: { ease: "expo.out" } });
    if (heroImg.length) itl.to(heroImg, { clipPath: "inset(0% 0 0 0 round 999px 999px 28px 28px)", duration: 1.6, ease: "expo.inOut" }, 0);
    if (intro.length) itl.to(intro, { opacity: 1, y: 0, duration: 1.1, stagger: .08 }, .15);
    itl.add(function () { $$(".hero .hl, .ph .hl").forEach(function (h) { h.classList.add("is-on"); }); }, .5);
    itl.fromTo(".ring", { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: "back.out(1.6)" }, .7);
    itl.fromTo(".hero [data-float], .ph [data-float]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: .15, clearProps: "transform" }, .8);

    /* highlight markers, bar fills */
    $$(".hl").forEach(function (h) {
      if (h.closest(".hero, .ph")) return;
      ST.create({ trigger: h, start: "top 85%", once: true, onEnter: function () { h.classList.add("is-on"); } });
    });
    $$(".bars, .ledger, .reach__list").forEach(function (el) {
      ST.create({ trigger: el, start: "top 85%", once: true, onEnter: function () { el.classList.add("is-on"); } });
    });

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

    window.addEventListener("load", function () { ST.refresh(); });
  }

  whenFontsReady(function () {
    if (window.__kphReady) init();
    else document.addEventListener("kph:ready", init, { once: true });
  });
})();
