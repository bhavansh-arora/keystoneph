/* ==========================================================================
   Keystone Power Holdings — interactions
   Preloader, header, menu, live counter,
   savings estimator, sector tabs, tile map, project filters,
   project enquiry wizard and the utility-scale land check.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var money = function (n) {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "") + "M";
    if (n >= 1e4) return "$" + Math.round(n / 1e3) + "k";
    return "$" + fmt(n);
  };
  var moneyFull = function (n) { return "$" + fmt(n); };

  /* ---------- year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- preloader ---------- */
  function ready() { window.__kphReady = true; document.dispatchEvent(new CustomEvent("kph:ready")); }
  (function preloader() {
    var pre = $(".preloader");
    if (!pre || doc.classList.contains("no-preloader") || getComputedStyle(pre).display === "none") { ready(); return; }
    var bar = $(".preloader__bar i", pre), count = $(".preloader__count", pre);
    var start = performance.now(), dur = reduce ? 200 : 900;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      bar.style.transform = "scaleX(" + e + ")";
      count.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (p < 1) return requestAnimationFrame(tick);
      try { sessionStorage.setItem("kph_seen", "1"); } catch (err) {}
      pre.classList.add("is-done");
      setTimeout(ready, 120);
    })(start);
  })();

  /* ---------- page transitions ----------
     A forest curtain covers the page on internal navigation and lifts on
     arrival, so moving between pages feels like one continuous site. */
  var curtain = $(".curtain");
  if (curtain) {
    if (doc.classList.contains("is-entering")) {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        curtain.classList.add("is-lifting");
        setTimeout(function () { doc.classList.remove("is-entering"); curtain.classList.remove("is-lifting"); }, 900);
      }); });
    }
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { curtain.classList.remove("is-covering"); doc.classList.remove("is-entering"); }
    });
    if (!reduce) document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; /* same page or hash link */
      e.preventDefault();
      try { sessionStorage.setItem("kph_nav", "1"); } catch (err) {}
      curtain.classList.add("is-covering");
      setTimeout(function () { location.href = url.href; }, 520);
    });
  }

  /* ---------- header + dock (rAF-throttled, no layout reads) ---------- */
  var header = $(".site-header"), dock = $(".dock"), footer = $(".footer");
  var lastY = window.scrollY, nearFooter = false, ticking = false;
  if (dock && footer && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { nearFooter = en[0].isIntersecting; update(); }, { rootMargin: "0px 0px -40px 0px" }).observe(footer);
  }
  function update() {
    ticking = false;
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      if (y > 320 && y > lastY + 2 && !doc.classList.contains("menu-open")) header.classList.add("is-hidden");
      else if (y < lastY - 2 || y <= 320) header.classList.remove("is-hidden");
    }
    if (dock) dock.classList.toggle("is-hidden", nearFooter || y < 200);
    lastY = y;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  /* ---------- pause looping CSS animations while off screen ---------- */
  if ("IntersectionObserver" in window) {
    var idle = new IntersectionObserver(function (en) {
      en.forEach(function (x) { x.target.classList.toggle("is-paused", !x.isIntersecting); });
    });
    $$("[data-float], .ring, .pulse").forEach(function (el) { idle.observe(el); });
  }

  /* ---------- menu ---------- */
  var toggle = $(".menu-toggle"), menu = $("#site-menu");
  function setMenu(open) {
    doc.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) { menu.removeAttribute("inert"); } else { menu.setAttribute("inert", ""); }
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(!doc.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && doc.classList.contains("menu-open")) { setMenu(false); toggle.focus(); } });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  }

  /* ---------- live kWh counter ----------
     23.9 MW featured portfolio x ~16% capacity factor = ~3,824 kW average
     output, i.e. ~1.06 kWh every second. */
  var live = $("[data-live-kwh]");
  if (live) {
    var t0 = performance.now(), perSec = 23900 * 0.16 / 3600, liveOn = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { liveOn = en[0].isIntersecting; }).observe(live);
    setInterval(function () {
      if (!liveOn) return;
      var v = (performance.now() - t0) / 1000 * perSec;
      live.textContent = v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }, 100);
  }

  /* ---------- savings estimator ---------- */
  var SECTORS = {
    municipal:  { low: .12, high: .18, rate: .12, label: "Municipality" },
    water:      { low: .12, high: .20, rate: .11, label: "Water / wastewater" },
    education:  { low: .10, high: .18, rate: .13, label: "School / university" },
    nonprofit:  { low: .15, high: .22, rate: .14, label: "Non-profit" },
    commercial: { low: .10, high: .20, rate: .11, label: "Commercial / industrial" }
  };
  var SITES = { Rooftop: { offset: .4, k: 1 }, Ground: { offset: .6, k: 1.05 }, Carport: { offset: .3, k: .95 } };
  var ESC = 0; for (var i = 0; i < 25; i++) ESC += Math.pow(1.025, i);

  function spendFromSlider(v) {
    var s = v <= 50 ? 25000 * Math.pow(10, v / 50) : 250000 * Math.pow(20, (v - 50) / 50);
    if (s < 100000) return Math.round(s / 1000) * 1000;
    if (s < 1000000) return Math.round(s / 5000) * 5000;
    return Math.round(s / 25000) * 25000;
  }
  function sliderFromSpend(s) {
    return s <= 250000 ? 50 * Math.log10(s / 25000) : 50 + 50 * Math.log(s / 250000) / Math.log(20);
  }

  $$("[data-estimator]").forEach(function (root) {
    var range = $("#est-spend", root) || $("input[type=range]", root);
    var out = {
      spend: $("[data-est-spend]", root), low: $("[data-est-low]", root), high: $("[data-est-high]", root),
      life: $("[data-est-life]", root), size: $("[data-est-size]", root), co2: $("[data-est-co2]", root),
      bars: $("[data-est-bars]", root), cta: $("[data-est-cta]", root)
    };
    var shown = { low: 0, high: 0, life: 0, pct: 0, g: 0 }, raf;

    /* 25-year bar chart: utility-only cost vs. cost with Keystone */
    var NS = "http://www.w3.org/2000/svg", uBars = [], kBars = [];
    if (out.bars) {
      for (var y = 0; y < 25; y++) {
        var u = document.createElementNS(NS, "rect"), k = document.createElementNS(NS, "rect");
        u.setAttribute("x", y * 20 + 2); u.setAttribute("width", 16); u.setAttribute("rx", 3); u.setAttribute("fill", "rgba(244,239,228,.22)");
        k.setAttribute("x", y * 20 + 5); k.setAttribute("width", 10); k.setAttribute("rx", 3); k.setAttribute("fill", "#F4B63F");
        out.bars.appendChild(u); out.bars.appendChild(k); uBars.push(u); kBars.push(k);
      }
    }
    function drawBars(pct, g) {
      var max = Math.pow(1.025, 24);
      for (var t = 0; t < 25; t++) {
        var uh = Math.pow(1.025, t) / max * 150 * g, kh = uh * (1 - pct);
        uBars[t].setAttribute("y", 160 - uh); uBars[t].setAttribute("height", Math.max(0, uh));
        kBars[t].setAttribute("y", 160 - kh); kBars[t].setAttribute("height", Math.max(0, kh));
      }
    }

    function calc() {
      var type = ($("input[name=est-type]:checked", root) || {}).value || "municipal";
      var site = ($("input[name=est-site]:checked", root) || {}).value || "Rooftop";
      var sec = SECTORS[type], st = SITES[site];
      var spend = spendFromSlider(+range.value);
      range.style.setProperty("--p", range.value + "%");
      out.spend.textContent = moneyFull(spend) + (+range.value >= 100 ? "+" : "");
      var low = spend * sec.low * st.k, high = spend * sec.high * st.k;
      var life = spend * ((sec.low + sec.high) / 2) * st.k * ESC;
      var kwh = spend / sec.rate * st.offset;
      var kw = kwh / 1350;
      out.size.textContent = kw >= 1000 ? (kw / 1000).toFixed(1) + " MW" : Math.round(kw / 10) * 10 + " kW";
      out.co2.textContent = fmt(kwh * 0.00037) + " t";
      if (out.cta) out.cta.href = "contact.html?sector=" + type + "&spend=" + spend + "&site=" + site;
      animate({ low: low, high: high, life: life, pct: (sec.low + sec.high) / 2 * st.k, g: 1 });
    }

    function animate(target) {
      cancelAnimationFrame(raf);
      var from = {}, t0 = performance.now(), d = reduce ? 1 : (shown.g < 1 ? 1200 : 600);
      Object.keys(target).forEach(function (k) { from[k] = shown[k]; });
      (function step(now) {
        var p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3);
        Object.keys(target).forEach(function (k) { shown[k] = from[k] + (target[k] - from[k]) * e; });
        out.low.textContent = money(shown.low);
        out.high.textContent = money(shown.high);
        out.life.textContent = money(shown.life);
        if (out.bars) drawBars(shown.pct, shown.g);
        if (p < 1) raf = requestAnimationFrame(step);
      })(t0);
    }

    root.addEventListener("input", calc);
    root.addEventListener("change", calc);
    calc();
  });

  /* ---------- sector tabs ---------- */
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$("[role=tab]", root), panels = $$("[role=tabpanel]", root);
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on; panels[k].classList.toggle("is-active", on);
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault(); select((i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length, true);
        }
      });
    });
  });

  /* ---------- quote slider ---------- */
  $$("[data-slider]").forEach(function (root) {
    var slides = $$("[data-slide]", root), idx = 0, timer;
    var dotsWrap = $("[data-slider-dots]", root), index = $("[data-slider-index]", root), total = $("[data-slider-total]", root);
    if (!slides.length) return;
    if (total) total.textContent = String(slides.length).padStart(2, "0");
    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Show quote " + (i + 1)); b.innerHTML = "<i></i>";
      b.addEventListener("click", function () { go(i); });
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });
    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === idx); s.setAttribute("aria-hidden", k !== idx); });
      dots.forEach(function (d, k) { d.classList.remove("is-active"); if (k === idx) { void d.offsetWidth; d.classList.add("is-active"); } });
      if (index) index.textContent = String(idx + 1).padStart(2, "0");
      restart();
    }
    function restart() { clearTimeout(timer); if (!reduce) timer = setTimeout(function () { go(idx + 1); }, 7000); }
    var prev = $("[data-slider-prev]", root), next = $("[data-slider-next]", root);
    prev && prev.addEventListener("click", function () { go(idx - 1); });
    next && next.addEventListener("click", function () { go(idx + 1); });
    var sx = null;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); sx = null;
    });
    go(0);
  });

  /* ---------- tile map tooltip ---------- */
  $$(".tilemap").forEach(function (map) {
    var tip = $("[data-tilemap-tip]", map);
    function show(tile) {
      tip.innerHTML = "<b>" + tile.textContent.trim() + "</b>" + tile.getAttribute("data-tip");
      var mr = map.getBoundingClientRect(), tr = tile.getBoundingClientRect();
      var x = tr.left - mr.left + tr.width / 2;
      x = Math.max(tip.offsetWidth / 2, Math.min(mr.width - tip.offsetWidth / 2, x));
      tip.style.left = x + "px"; tip.style.top = (tr.top - mr.top) + "px";
      tip.classList.add("is-on");
    }
    function hide() { tip.classList.remove("is-on"); }
    $$("[data-tip]", map).forEach(function (t) {
      t.addEventListener("mouseenter", function () { show(t); });
      t.addEventListener("focus", function () { show(t); });
      t.addEventListener("click", function () { show(t); });
      t.addEventListener("mouseleave", hide);
      t.addEventListener("blur", hide);
    });
  });

  /* ---------- project filter & sort ---------- */
  $$("[data-projects]").forEach(function (root) {
    var grid = $("[data-pgrid]", root), tiles = $$(".ptile", grid);
    var chips = $$("[data-filter]", root), sortSel = $("[data-sort]", root);
    var sumN = $("[data-sum-n]", root), sumMW = $("[data-sum-mw]", root), sumS = $("[data-sum-s]", root);
    var current = "all";
    function apply() {
      var shown = tiles.filter(function (t) {
        var ok = current === "all" || t.getAttribute("data-cat") === current;
        t.classList.toggle("is-hidden", !ok);
        return ok;
      });
      var how = sortSel ? sortSel.value : "size";
      shown.sort(function (a, b) {
        if (how === "state") return a.getAttribute("data-state").localeCompare(b.getAttribute("data-state")) || (+b.dataset.mw - +a.dataset.mw);
        if (how === "small") return +a.dataset.mw - +b.dataset.mw;
        return +b.dataset.mw - +a.dataset.mw;
      }).forEach(function (t) { grid.appendChild(t); });
      var mw = shown.reduce(function (s, t) { return s + +t.dataset.mw; }, 0);
      var states = {}; shown.forEach(function (t) { states[t.dataset.state] = 1; });
      if (sumN) sumN.textContent = shown.length;
      if (sumMW) sumMW.textContent = mw.toFixed(1);
      if (sumS) sumS.textContent = Object.keys(states).length;
      if (window.gsap && !reduce) window.gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, stagger: .03, ease: "power3.out", overwrite: true });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        current = c.getAttribute("data-filter");
        chips.forEach(function (x) { x.classList.toggle("is-active", x === c); x.setAttribute("aria-pressed", x === c); });
        apply();
      });
    });
    sortSel && sortSel.addEventListener("change", apply);
    // counts on chips
    chips.forEach(function (c) {
      var f = c.getAttribute("data-filter"), n = f === "all" ? tiles.length : tiles.filter(function (t) { return t.dataset.cat === f; }).length;
      var sup = document.createElement("sup"); sup.textContent = n; c.appendChild(sup);
    });
    apply();
  });

  /* ---------- project enquiry wizard ---------- */
  var MIDWEST = ["IL", "IN", "WI", "MI", "OH", "IA", "MN", "MO", "KS", "NE", "ND", "SD"];
  var SOUTHEAST = ["VA", "MD", "DC", "DE", "WV", "NC", "SC", "GA", "TN", "KY", "FL", "AL", "MS"];
  var SPEND_MID = { "<$50k": 35000, "$50k–$150k": 100000, "$150k–$500k": 300000, "$500k–$1M": 750000, "$1M+": 1500000 };

  $$("[data-wizard]").forEach(function (form) {
    var steps = $$(".wstep", form), rail = $$(".wizard__steps li", form.parentNode.parentNode);
    var bar = $(".wizard__progress i", form.parentNode), back = $("[data-w-back]", form), next = $("[data-w-next]", form);
    var nextLabel = $(".btn__label", next), err = $(".wizard__err", form), result = $(".result", form.parentNode);
    var summary = $("[data-w-summary]", form.parentNode.parentNode);
    var nav = $(".wizard__nav", form);
    var cur = 0;

    // prefill from estimator (?sector=&spend=&site=)
    var q = new URLSearchParams(location.search);
    var mapSector = { municipal: "Municipality", water: "Water / wastewater authority", education: "School district / K-12", nonprofit: "Non-profit", commercial: "Commercial / industrial" };
    if (q.get("sector") && mapSector[q.get("sector")]) { var r1 = $('input[name=sector][value="' + mapSector[q.get("sector")] + '"]', form); if (r1) r1.checked = true; }
    if (q.get("site")) { var mapSite = { Rooftop: "Rooftop", Ground: "Ground-mount", Carport: "Parking canopy" }; var r2 = $('input[name=site][value="' + mapSite[q.get("site")] + '"]', form); if (r2) r2.checked = true; }
    if (q.get("spend")) {
      var s = +q.get("spend"), sel = $("[name=scale]", form);
      if (sel) sel.value = s < 50000 ? "<$50k" : s < 150000 ? "$50k–$150k" : s < 500000 ? "$150k–$500k" : s < 1000000 ? "$500k–$1M" : "$1M+";
    }
    if (q.get("type") === "land") { var r3 = $('input[name=sector][value="Landowner (utility-scale)"]', form); if (r3) r3.checked = true; }

    function val(name) {
      var el = form.elements[name]; if (!el) return "";
      if (el.length && el[0] && el[0].type === "radio") { var c = $("input[name='" + name + "']:checked", form); return c ? c.value : ""; }
      return (el.value || "").trim();
    }
    function isLand() { return /Landowner/.test(val("sector")); }
    function syncScale() {
      var land = isLand();
      $$("[data-for-land]", form).forEach(function (el) { el.hidden = !land; });
      $$("[data-for-load]", form).forEach(function (el) { el.hidden = land; });
    }
    function updateSummary() {
      if (!summary) return;
      var rows = [["Organization", val("sector")], ["Site", val("site")], ["Scale", isLand() ? val("acres") : val("scale")], ["State", val("state")], ["Timing", val("timeline")]];
      summary.innerHTML = rows.map(function (r) { return "<li><span>" + r[0] + "</span><b>" + (r[1] || "—") + "</b></li>"; }).join("");
    }
    function validate(i) {
      var step = steps[i], ok = true, msg = "";
      $$("[data-req]", step).forEach(function (el) {
        if (el.closest("[hidden]")) return;
        var name = el.getAttribute("data-req"), v = val(name);
        var wrap = el.closest(".input");
        var bad = !v || (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        if (wrap) wrap.classList.toggle("is-invalid", bad);
        if (bad && ok) { ok = false; msg = el.getAttribute("data-msg") || "Please complete this step."; }
      });
      err.textContent = ok ? "" : msg;
      return ok;
    }
    function show(i) {
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      rail.forEach(function (r, k) { r.classList.toggle("is-active", k === i); r.classList.toggle("is-done", k < i); });
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
      back.disabled = i === 0;
      nextLabel.textContent = i === steps.length - 1 ? "Send my project" : "Continue";
      err.textContent = "";
      syncScale(); updateSummary();
      var top = form.closest(".wizard").getBoundingClientRect().top;
      if (top < 0) { var y = window.scrollY + top - 100; window.__lenis ? window.__lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: "smooth" }); }
      var first = $("input:not([type=hidden]), select, textarea", steps[i]);
      if (first && i > 0 && finePointer) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    }
    form.addEventListener("change", function (e) {
      updateSummary(); syncScale();
      // auto-advance on single-choice card steps
      if (e.target.type === "radio" && e.target.closest(".cards") && steps[cur].hasAttribute("data-auto")) {
        setTimeout(function () { if (validate(cur)) show(cur + 1); }, 260);
      }
    });
    back.addEventListener("click", function () { if (cur > 0) show(cur - 1); });
    next.addEventListener("click", function () {
      if (!validate(cur)) return;
      if (cur < steps.length - 1) return show(cur + 1);
      submit();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); next.click(); });

    function route(state) {
      if (MIDWEST.indexOf(state) > -1) return CFG.offices.IL;
      if (SOUTHEAST.indexOf(state) > -1) return CFG.offices.VA;
      return CFG.offices.HQ;
    }
    function score() {
      var p = 0, tl = val("timeline"), sc = val("scale"), ac = val("acres");
      p += /Ready/.test(tl) ? 40 : /budget/.test(tl) ? 30 : /6/.test(tl) ? 18 : 6;
      if (isLand()) p += ({ "500+ acres": 40, "200–500 acres": 38, "50–200 acres": 28, "20–50 acres": 16 })[ac] || 10;
      else p += ({ "$1M+": 40, "$500k–$1M": 34, "$150k–$500k": 26, "$50k–$150k": 16, "<$50k": 6 })[sc] || 10;
      p += /Not sure/.test(val("site")) ? 4 : 12;
      p += val("phone") ? 8 : 0;
      return Math.min(100, p);
    }
    function sizeRange() {
      if (isLand()) {
        var a = { "20–50 acres": [3, 8], "50–200 acres": [8, 33], "200–500 acres": [33, 80], "500+ acres": [80, 150], "Not sure": null }[val("acres")];
        return a ? a[0] + "–" + a[1] + " MW" : "To be assessed";
      }
      var m = SPEND_MID[val("scale")]; if (!m) return "To be assessed";
      var kw = m / .12 * .4 / 1350, lo = kw * .7, hi = kw * 1.3;
      var f = function (x) { return x >= 1000 ? (x / 1000).toFixed(1) + " MW" : Math.round(x / 10) * 10 + " kW"; };
      return f(lo) + " – " + f(hi);
    }
    function submit() {
      var office = route(val("state")), pr = score();
      var data = {
        sector: val("sector"), site: val("site"), scale: isLand() ? val("acres") : val("scale"),
        state: val("state"), timeline: val("timeline"), name: val("name"), title: val("title"),
        organization: val("org"), email: val("email"), phone: val("phone"), notes: val("notes"),
        priority_score: pr, priority: pr >= 70 ? "A — hot" : pr >= 45 ? "B — warm" : "C — nurture",
        routed_to: office.name, indicative_size: sizeRange(), source: location.href, submitted: new Date().toISOString()
      };
      $("[data-r-office]", result).textContent = office.name;
      $("[data-r-size]", result).textContent = data.indicative_size;
      $("[data-r-reply]", result).textContent = CFG.replyPromise || "within one business day";
      $("[data-r-name]", result).textContent = data.name.split(" ")[0] || "there";
      var book = $("[data-r-book]", result);
      if (book && CFG.bookingUrl) { book.href = CFG.bookingUrl; book.hidden = false; }
      next.disabled = true; nextLabel.textContent = "Sending…";

      var done = function () {
        form.hidden = true; result.classList.add("is-active");
        var h = result.querySelector("h3"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
        var y = window.scrollY + form.closest(".wizard").getBoundingClientRect().top - 100;
        window.__lenis ? window.__lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: "smooth" });
        if (bar) bar.style.width = "100%";
        rail.forEach(function (r) { r.classList.remove("is-active"); r.classList.add("is-done"); });
      };
      if (CFG.formEndpoint) {
        fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
          .then(done).catch(function () { mailto(data); done(); });
      } else { mailto(data); done(); }
    }
    function mailto(d) {
      var body = Object.keys(d).map(function (k) { return k.replace(/_/g, " ") + ": " + d[k]; }).join("\n");
      var subj = "New project enquiry: " + (d.organization || d.sector) + " (" + d.state + ")";
      window.location.href = "mailto:" + (CFG.email || "") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    }
    nav && show(0);
  });

  /* ---------- utility-scale land check ---------- */
  $$("[data-landcheck]").forEach(function (root) {
    var acres = $("#lc-acres", root), acresOut = $("[data-lc-acres]", root);
    var arc = $("[data-lc-arc]", root), valEl = $("[data-lc-score]", root);
    var vt = $("[data-lc-title]", root), vp = $("[data-lc-text]", root), mw = $("[data-lc-mw]", root), cta = $("[data-lc-cta]", root);
    var len = arc.getTotalLength ? arc.getTotalLength() : 440, shownScore = 0, raf;
    arc.style.strokeDasharray = len; arc.style.strokeDashoffset = len;
    function pick(n) { var c = $("input[name=" + n + "]:checked", root); return c ? +c.value : 0; }
    function calc() {
      var a = +acres.value;
      acres.style.setProperty("--p", ((a - +acres.min) / (+acres.max - +acres.min) * 100) + "%");
      acresOut.textContent = fmt(a) + (a >= +acres.max ? "+" : "") + " acres";
      var sa = a >= 200 ? 40 : a >= 100 ? 34 : a >= 50 ? 28 : a >= 20 ? 18 : 8;
      var score = Math.min(100, sa + pick("lc-grid") + pick("lc-land") + pick("lc-slope"));
      var cap = a / 6;
      mw.textContent = cap >= 1 ? "~" + (cap >= 10 ? Math.round(cap) : cap.toFixed(1)) + " MW" : "<1 MW";
      if (score >= 75) { vt.textContent = "Strong candidate"; vp.textContent = "Your land has the profile utility-scale projects look for. Let's run a free desktop study on interconnection and zoning."; }
      else if (score >= 50) { vt.textContent = "Promising site"; vp.textContent = "There's a real opportunity here. A few factors need a closer look, which our team can do at no cost."; }
      else { vt.textContent = "Worth a conversation"; vp.textContent = "Not every parcel suits utility-scale, but smaller community or distributed projects may still work. Let's talk it through."; }
      if (cta) cta.href = "contact.html?type=land";
      cancelAnimationFrame(raf);
      var from = shownScore, t0 = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - t0) / (reduce ? 1 : 700)), e = 1 - Math.pow(1 - p, 3);
        shownScore = from + (score - from) * e;
        valEl.textContent = Math.round(shownScore);
        arc.style.strokeDashoffset = len * (1 - shownScore / 100);
        if (p < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    root.addEventListener("input", calc);
    root.addEventListener("change", calc);
    calc();
  });
})();
