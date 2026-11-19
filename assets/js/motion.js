/* ==========================================================================
   Keystone Power Holdings — motion (GSAP + ScrollTrigger + Lenis)
   Everything here is progressive: with reduced motion or without GSAP the
   page renders fully, just without the choreography.
   Performance rules: animate only transform / opacity (plus one-off
   clip-path reveals), never read layout inside scroll callbacks, and pause
   anything that loops while it is off screen.
   ========================================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    doc.classList.add("motion-off");
    $$("[data-hero-split]").forEach(function (h) { h.style.visibility = "visible"; });
    $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    $$(".hl").forEach(function (h) { h.classList.add("is-on"); });
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "expo.out" });
  doc.classList.add("motion-on");

  /* ---------- smooth scroll (desktop only, tight lerp so it never feels behind the wheel) ---------- */
  if (window.Lenis && fine) {
    var lenis = new window.Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: -90, duration: 1.2 });
      });
    });
  }

  /* ---------- helpers ---------- */
  function onEnter(el, fn, start) {
    ST.create({ trigger: el, start: start || "top 86%", once: true, onEnter: fn });
  }
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
          if (n.classList.contains("pill")) { var pw = document.createElement("span"); pw.className = "w"; pw.appendChild(n.cloneNode(true)); frag.appendChild(pw); return; }
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
  /* count the first number inside an element up from zero, keeping prefix, suffix and decimals */
  function countUp(el, delay) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) { if (/\d/.test(node.nodeValue)) break; }
    if (!node) return;
    var m = node.nodeValue.match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
    if (!m) return;
    var raw = m[2].replace(/,/g, ""), end = parseFloat(raw);
    if (!end) return;
    var dec = (raw.split(".")[1] || "").length, comma = m[2].indexOf(",") > -1, o = { v: 0 };
    var out = function (v) {
      var s = v.toFixed(dec);
      if (comma) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      node.nodeValue = m[1] + s + m[3];
    };
    out(0);
    onEnter(el, function () { gsap.to(o, { v: end, duration: 2, delay: delay || 0, ease: "power3.out", onUpdate: function () { out(o.v); } }); }, "top 92%");
  }

  /* ---------- pinned scenes (created first so later triggers account for their spacing) ---------- */
  function scenes() {
    var mm = gsap.matchMedia();

    /* process: the four steps travel sideways while the section holds (desktop) */
    mm.add("(min-width: 1100px) and (min-height: 700px)", function () {
      var undo = [];
      $$(".process").forEach(function (sec) {
        var flow = $(".flow", sec); if (!flow) return;
        sec.classList.add("is-h"); flow.classList.add("flow--h");
        var bar = document.createElement("div"); bar.className = "process__bar"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<i></i>";
        flow.parentNode.appendChild(bar);
        var dist = function () {
          var box = flow.parentNode, cs = getComputedStyle(box);
          return Math.max(0, flow.scrollWidth - (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)));
        };
        var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1 } });
        tl.to(flow, { x: function () { return -dist(); }, ease: "none" }, 0).to(bar.firstChild, { scaleX: 1, ease: "none" }, 0);
        undo.push(function () { sec.classList.remove("is-h"); flow.classList.remove("flow--h"); bar.remove(); gsap.set(flow, { clearProps: "x" }); });
      });
      return function () { undo.forEach(function (f) { f(); }); };
    });

    /* sector deck: each card sinks back as the next one slides over it (desktop) */
    mm.add("(min-width: 1025px)", function () {
      var cards = $$(".stack__card");
      cards.forEach(function (c, i) {
        var next = cards[i + 1]; if (!next) return;
        gsap.fromTo(c, { scale: 1, "--dim": 0 }, {
          scale: .9, "--dim": .5, ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: function () { return "top " + parseFloat(getComputedStyle(next).top) + "px"; }, scrub: true, invalidateOnRefresh: true }
        });
      });
    });
  }

  function init() {
    scenes();
    var hero = $(".hero"), ph = $(".ph");

    /* ---------- scroll progress ---------- */
    var bar = $(".progress i");
    if (bar) {
      var setP = gsap.quickSetter(bar, "scaleX");
      ST.create({ start: 0, end: "max", onUpdate: function (self) { setP(self.progress); } });
    }

    /* ---------- page intro ---------- */
    var intro = $$("[data-hero-in]"), heroImg = $$("[data-hero-img]");
    var itl = gsap.timeline({ delay: doc.classList.contains("is-entering") ? .7 : 0 });
    $$("[data-hero-split]").forEach(function (h) {
      var sp = splitLines(h); h.style.visibility = "visible";
      itl.fromTo(sp.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: .1, onComplete: function () { sp.revert(); requestAnimationFrame(function () { requestAnimationFrame(function () { $$(".hl", h).forEach(function (x) { x.classList.add("is-on"); }); }); }); } }, .05);
    });
    var rings = $$(".hero__rings i"), sun = $(".hero__sun"), inset = $(".hero__inset");
    if (rings.length) itl.fromTo(rings, { opacity: 0, scale: .92 }, { opacity: function (i) { return [1, .8, .45][i]; }, scale: 1, duration: 1.6, stagger: .12, transformOrigin: "50% 100%" }, .35);
    if (sun) itl.fromTo(sun, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "expo.out" }, .5);
    if (inset) itl.fromTo(inset, { clipPath: "inset(0% 0% 100% 0% round 999px 999px 28px 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 28px 28px)", duration: 1.3, ease: "expo.inOut", clearProps: "clipPath" }, 1);
    if (heroImg.length) {
      itl.fromTo(heroImg, { clipPath: "inset(0% 0% 100% 0% round 999px 999px 28px 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 28px 28px)", duration: 1.6, ease: "expo.inOut" }, 0);
      heroImg.forEach(function (w) {
        var img = $("img", w); if (!img) return;
        itl.fromTo(img, { scale: 1.45 }, { scale: gsap.getProperty(img, "scale") || 1.12, duration: 2.2 }, .1);
      });
    }
    if (intro.length) itl.to(intro, { opacity: 1, y: 0, duration: 1.1, stagger: .08 }, .15);
    itl.add(function () { $$(".ph .hl, .hero .hl:not([data-hero-split] .hl)").forEach(function (h) { h.classList.add("is-on"); }); }, .5);
    if ($(".ring")) itl.fromTo(".ring", { scale: 0, rotate: -120, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.4, ease: "back.out(1.5)" }, .7);
    var floats = $$(".hero [data-float]:not(.hero__inset), .ph [data-float]");
    if (floats.length) itl.fromTo(floats, { opacity: 0, y: 40, scale: .92 }, { opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: .14, ease: "back.out(1.4)", clearProps: "transform" }, .85);
    $$(".hero .statbar > div, .ph__facts > div").forEach(function (d, i) { countUp(d.querySelector("dt") || d, 1 + i * .1); });

    /* hero: floating cards drift on the pointer and at different speeds on scroll */
    [hero, ph].forEach(function (sec) {
      if (!sec) return;
      var layers = $$(".float, .ring, [data-float]", sec).filter(function (el, i, a) { return a.indexOf(el) === i; });
      if (!layers.length) return;
      layers.forEach(function (el, i) {
        var depth = el.classList.contains("ring") ? 1.6 : 1 + (i % 3) * .35;
        el.__d = depth;
        gsap.fromTo(el, { "--sy": 0 }, { "--sy": -60 * depth, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } });
      });
      if (!fine) return;
      var movers = layers.map(function (el) {
        return { x: gsap.quickTo(el, "--mx", { duration: .9, ease: "power3.out" }), y: gsap.quickTo(el, "--my", { duration: .9, ease: "power3.out" }), d: el.__d };
      });
      var art = $(".hero__arch img, .ph__img img", sec), artX = art && gsap.quickTo(art, "x", { duration: 1.2, ease: "power3.out" });
      sec.addEventListener("pointermove", function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        movers.forEach(function (m) { m.x(nx * 26 * m.d); m.y(ny * 20 * m.d); });
        if (artX) artX(nx * -14);
      });
      sec.addEventListener("pointerleave", function () { movers.forEach(function (m) { m.x(0); m.y(0); }); if (artX) artX(0); });
    });

    /* ---------- headlines: line-by-line rise, then the marker draws ---------- */
    $$("[data-split]").forEach(function (el) {
      var s = splitLines(el);
      gsap.to(s.lines, {
        y: 0, duration: 1.25, stagger: .09,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: function () {
          s.revert();
          requestAnimationFrame(function () { requestAnimationFrame(function () { $$(".hl", el).forEach(function (h) { h.classList.add("is-on"); }); }); });
        }
      });
    });
    $$(".hl").forEach(function (h) {
      if (h.closest(".hero, .ph, [data-split]")) return;
      onEnter(h, function () { h.classList.add("is-on"); }, "top 85%");
    });

    /* eyebrows and side copy */
    $$(".head .tag, .head__side").forEach(function (el) {
      gsap.from(el, { opacity: 0, x: el.classList.contains("tag") ? -24 : 0, y: el.classList.contains("tag") ? 0 : 24, duration: 1.1, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });

    /* ---------- cards: staggered rise ---------- */
    gsap.set("[data-reveal]", { y: 64, scale: .97 });
    ST.batch("[data-reveal]", {
      start: "top 90%", once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 1.3, stagger: .12, overwrite: true, clearProps: "transform" }); }
    });

    /* ---------- photos: arches unveil from the base, every photo settles from a zoom ---------- */
    $$(".arch:not(.hero__arch):not([data-hero-img])").forEach(function (a) {
      if (a.closest("[hidden]") || a.closest(".mega") || a.closest(".hero")) return;
      var r = getComputedStyle(a).borderBottomLeftRadius || "28px";
      gsap.fromTo(a, { clipPath: "inset(0% 0% 100% 0% round 999px 999px " + r + " " + r + ")" },
        { clipPath: "inset(0% 0% 0% 0% round 999px 999px " + r + " " + r + ")", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath", scrollTrigger: { trigger: a, start: "top 88%", once: true } });
    });
    $$(".arch img, .tile--photo > img, .case__img img, .study__img img, .lead-story figure img, .post figure img, .office__img img, .collage img").forEach(function (img) {
      if (img.closest(".hero, .ph, .mega, [hidden], .leader__portrait")) return;
      var base = gsap.getProperty(img, "scale") || 1;
      gsap.fromTo(img, { scale: base * 1.28 }, { scale: base, duration: 2, scrollTrigger: { trigger: img.parentNode, start: "top 90%", once: true } });
    });

    /* manifesto: words light up as you read; footnotes rise */
    $$(".manifesto__foot").forEach(function (f) {
      gsap.from(f.children, { opacity: 0, y: 26, duration: 1, stagger: .1, scrollTrigger: { trigger: f, start: "top 92%", once: true } });
    });
    $$(".manifesto__k").forEach(function (k) {
      gsap.from(k, { opacity: 0, duration: 1.2, scrollTrigger: { trigger: k, start: "top 92%", once: true } });
    });

    /* project list: rows rise in */
    $$("[data-plist]").forEach(function (list) {
      gsap.from($$(".plist__row, .plist__more", list), { opacity: 0, y: 34, duration: 1, stagger: .07, scrollTrigger: { trigger: list, start: "top 85%", once: true } });
    });

    /* word-by-word highlight on scroll */
    $$("[data-words]").forEach(function (el) {
      var words = splitWords(el);
      gsap.fromTo(words, { opacity: .12 }, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 50%", scrub: true } });
    });

    /* image parallax */
    $$("[data-parallax]").forEach(function (img) {
      if (img.closest(".hero")) {
        gsap.to(img, { yPercent: 10, ease: "none", scrollTrigger: { trigger: img.closest(".hero"), start: "top top", end: "bottom top", scrub: true } });
        return;
      }
      var wrap = img.closest("[data-parallax-wrap]") || img.parentNode;
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* ---------- numbers ---------- */
    $$("[data-count]").forEach(function (el) {
      var end = +el.getAttribute("data-count"), o = { v: 0 };
      if (!end) { el.textContent = "0"; return; }
      gsap.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: function () { el.textContent = Math.round(o.v); } });
    });
    $$(".statbar:not(.hero .statbar) dt, .panel__stats dt, .case__stats dd, .study__stats dd, .tl time, .ptile__mw, .mega-num, .reach__num").forEach(function (el) {
      if (!el.closest("[hidden]")) countUp(el);
    });

    /* bars, ledger, map list fill when seen */
    $$(".bars, .ledger, .reach__list").forEach(function (el) { onEnter(el, function () { el.classList.add("is-on"); }, "top 85%"); });

    /* process: step numbers pop in after their cards */
    $$(".flow").forEach(function (f) {
      gsap.from($$(".flow__n", f), { scale: 0, rotate: -90, duration: .9, stagger: .14, delay: .45, ease: "back.out(2)", scrollTrigger: { trigger: f, start: "top 82%", once: true } });
    });

    /* timeline rail draws as you scroll through it */
    $$(".timeline").forEach(function (t) {
      gsap.fromTo(t, { "--tl": 0 }, { "--tl": 1, ease: "none", scrollTrigger: { trigger: t, start: "top 80%", end: "bottom 60%", scrub: true } });
    });

    /* check lists tick in */
    $$(".checks").forEach(function (c) {
      if (c.closest("[hidden]")) return;
      gsap.from($$("li", c), { opacity: 0, x: -16, duration: .8, stagger: .07, scrollTrigger: { trigger: c, start: "top 90%", once: true } });
    });

    /* CTA panel grows into place */
    $$(".cta").forEach(function (c) {
      gsap.fromTo(c, { scale: .93, y: 40 }, { scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "top 55%", scrub: true } });
    });

    /* footer wordmark letters rise */
    var word = $(".footer__word");
    if (word) {
      var txt = word.textContent; word.textContent = "";
      txt.split("").forEach(function (ch) { var s = document.createElement("span"); s.className = "ch"; s.textContent = ch; word.appendChild(s); });
      gsap.from($$(".ch", word), { yPercent: 70, opacity: 0, rotate: 6, duration: 1.4, stagger: .05, scrollTrigger: { trigger: word, start: "top 98%", once: true } });
    }

    /* ---------- client marquee: speeds up and follows scroll direction ---------- */
    $$(".clients__track, .bigtype__track").forEach(function (track) {
      var tw = gsap.to(track, { xPercent: -50, duration: track.classList.contains("bigtype__track") ? 30 : 38, ease: "none", repeat: -1 });
      var dir = 1, hover = false;
      ST.create({
        trigger: track, start: "top bottom", end: "bottom top",
        onToggle: function (self) { self.isActive ? tw.play() : tw.pause(); },
        onUpdate: function (self) {
          if (hover) return;
          dir = self.direction;
          var boost = Math.min(6, 1 + Math.abs(self.getVelocity()) / 250);
          gsap.to(tw, { timeScale: dir * boost, duration: .25, overwrite: true, onComplete: function () { if (!hover) gsap.to(tw, { timeScale: dir, duration: 1.4, ease: "power2.out" }); } });
        }
      });
      var host = track.closest(".clients, .bigtype") || track;
      host.addEventListener("mouseenter", function () { hover = true; gsap.to(tw, { timeScale: 0, duration: .6, overwrite: true }); });
      host.addEventListener("mouseleave", function () { hover = false; gsap.to(tw, { timeScale: dir, duration: .6, overwrite: true }); });
    });

    /* ---------- sector tabs: new panel's photo and copy animate in ---------- */
    $$("[data-tabs] [role=tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var p = document.getElementById(tab.getAttribute("aria-controls")); if (!p) return;
        var img = $(".arch img", p), body = $$(".panel__body > *", p);
        if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.4, overwrite: true });
        gsap.fromTo(body, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .9, stagger: .06, overwrite: true });
      });
    });

    window.addEventListener("load", function () { ST.refresh(); });
  }

  function start() {
    if (window.__kphReady) init();
    else document.addEventListener("kph:ready", init, { once: true });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
