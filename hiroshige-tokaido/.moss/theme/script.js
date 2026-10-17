// Draws the road ruler and drives the map panel. Data: /assets/road.json (written by tools/tokaido/generate.py).
// Without script the pages still read: the ruler keeps its sentence, the map keeps one link per station.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var rulers = $$(".ruler"), map = $(".road-map:not(.road-map-compact)"), strip = $(".moss-grid.strip[data-scroll]");
  if (!rulers.length && !map && !strip) return;

  fetch("/assets/road.json").then(function (r) { return r.json(); }).then(function (D) {
    var S = D.stations, LAST = D.last;
    var here = null, m = location.pathname.match(/\/prints\/([^/]+)\//);
    if (m) here = S.filter(function (s) { return s.file === m[1]; })[0] || null;

    function ruler(el, cur) {
      var h = '<div class="axis" aria-hidden="true">' + S.map(function (s) {
        return '<i' + (cur && s.n === cur.n ? ' class="here"' : '') + ' style="left:' + (s.ri / LAST * 100).toFixed(3) + '%"></i>';
      }).join("");
      if (cur) {
        var l = cur.ri / LAST * 100, al = l > 78 ? "r" : l < 22 ? "l" : "";
        h += '<span class="lab ' + al + '" style="left:' + l.toFixed(3) + '%"><b>' + esc(cur.name) + "</b> · " + cur.ri_s + " ri</span>";
      }
      h += '<div class="ends"><span>0 · Nihonbashi</span><span>' + D.stations[54].ri_s + " ri · Kyoto</span></div></div>";
      if (el.classList.contains("ruler-bands")) {
        var w = D.stretches.map(function (x) {
          var a = x.a ? S[x.a - 1].ri : 0; return ((S[x.b].ri - a) / LAST * 100).toFixed(3);
        });
        h += '<div class="bands" aria-hidden="true">' + w.map(function (v) { return '<i style="width:' + v + '%"></i>'; }).join("") + "</div>";
        h += '<div class="bandlab" aria-hidden="true">' + D.stretches.map(function (x, i) { return '<span style="width:' + w[i] + '%">' + esc(x.name) + "</span>"; }).join("") + "</div>";
      }
      el.insertAdjacentHTML("afterbegin", h);
      el.setAttribute("data-drawn", "");
    }
    rulers.forEach(function (el) { ruler(el, el.classList.contains("ruler-bands") ? null : here); });

    // The home strip's position: the same ruler, a slider over the 55 prints.
    // moss reports where the row is (moss-scroll-position); this draws it on
    // the road by distance, and a tap, drag or key moves the row there.
    if (strip) (function (row) {
      var cards = Array.prototype.slice.call(row.children);
      if (cards.length !== S.length) { row.setAttribute("data-road", "off"); return; }
      var N = S.length, pos = S.map(function (s) { return s.ri / LAST; });
      var pct = function (f) { return (f * 100).toFixed(3) + "%"; };
      var tag = function (i) { return i === 0 ? "Start" : i === N - 1 ? "End" : "No. " + i; };
      var el = document.createElement("div");
      el.className = "road-strip";
      el.tabIndex = 0;
      el.setAttribute("role", "slider");
      el.setAttribute("aria-label", row.getAttribute("aria-label") || "Prints along the road");
      el.setAttribute("aria-valuemin", "1");
      el.setAttribute("aria-valuemax", String(N));
      el.innerHTML = '<span class="road-axis" aria-hidden="true">' + S.map(function (s, i) {
        return '<i style="left:' + pct(pos[i]) + '"></i>';
      }).join("") + '<b class="road-band"></b><i class="here"></i><span class="lab"></span>' +
        '<span class="ends"><span>Nihonbashi</span><span>Kyoto · ' + S[N - 1].ri_s + " ri</span></span></span>";
      row.insertAdjacentElement("afterend", el);
      var band = $(".road-band", el), mark = $(".here", el), lab = $(".lab", el);
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      function draw(cur, a, b) {
        band.style.left = pct(pos[a]);
        band.style.width = pct(Math.max(0, pos[b] - pos[a]));
        mark.style.left = pct(pos[cur]);
        var l = pos[cur] * 100;
        lab.className = "lab" + (l > 78 ? " r" : l < 22 ? " l" : "");
        lab.style.left = pct(pos[cur]);
        lab.innerHTML = tag(cur) + " · <b>" + esc(S[cur].name) + "</b> · " + S[cur].ri_s + " ri";
        el.setAttribute("aria-valuenow", String(cur + 1));
        el.setAttribute("aria-valuetext", S[cur].name + ", " + tag(cur).toLowerCase() + "; " + S[cur].ri_s + " of " + S[N - 1].ri_s + " ri");
      }
      // Prints that fit in the row at once, from its width and the card spacing.
      function view() {
        var step = cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
        return Math.max(1, Math.floor((row.clientWidth + 1) / step));
      }
      // The last view cannot bring its first print to the row's start, so it
      // scrolls the row to its end instead.
      // The print the reader picked on the ruler stays marked while it is in
      // view; moss's current print takes over once the row moves past it.
      var picked = null;
      function go(i, instant) {
        i = Math.max(0, Math.min(N - 1, i));
        var behavior = instant || reduce ? "auto" : "smooth", v = view();
        if (i > N - v) row.scrollTo({ left: row.scrollWidth, behavior: behavior });
        else cards[i].scrollIntoView({ inline: "start", block: "nearest", behavior: behavior });
        picked = i;
        draw(i, Math.min(i, N - v), Math.min(N - 1, Math.max(i, N - v) + v - 1));
      }
      function follow(p) {
        var a = p.first - 1, b = p.last - 1;
        if (picked !== null && (picked < a || picked > b)) picked = null;
        draw(picked !== null ? picked : p.current - 1, a, b);
      }
      row.addEventListener("moss-scroll-position", function (e) { follow(e.detail); });
      // moss may have reported before this listener was added; its indicator keeps the numbers.
      var own = row.parentNode.querySelector(".moss-scroll-dots[data-current]");
      if (own) follow({ current: +own.dataset.current, first: +own.dataset.first, last: +own.dataset.last });
      else draw(0, 0, 0);

      // A tap or drag lands on the station nearest the pointer, by distance.
      function at(x) {
        var r = el.getBoundingClientRect(), f = (x - r.left) / r.width, best = 0;
        pos.forEach(function (p, i) { if (Math.abs(p - f) < Math.abs(pos[best] - f)) best = i; });
        return best;
      }
      var dragging = null;
      el.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        dragging = e.pointerId; el.setPointerCapture(e.pointerId); go(at(e.clientX), true);
      });
      el.addEventListener("pointermove", function (e) { if (dragging === e.pointerId) go(at(e.clientX), true); });
      el.addEventListener("pointerup", function () { dragging = null; });
      el.addEventListener("pointercancel", function () { dragging = null; });
      el.addEventListener("keydown", function (e) {
        var v = view(), now = Number(el.getAttribute("aria-valuenow")) - 1;
        var to = { ArrowRight: now + 1, ArrowUp: now + 1, ArrowLeft: now - 1, ArrowDown: now - 1, PageDown: now + v, PageUp: now - v, Home: 0, End: N - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault(); go(to);
      });
    })(strip);

    if (!map) return;
    var fig = map, panel = document.createElement("div");
    panel.className = "road-panel"; panel.setAttribute("aria-live", "polite");
    var note = $(".map-note");
    (note || fig).insertAdjacentElement(note ? "afterend" : "afterend", panel);
    var links = $$("a.st", map), cur = -1;
    var axisHere = null;
    function select(n) {
      if (n === cur) return; cur = n;
      var s = S[n];
      links.forEach(function (a) { a.classList.toggle("sel", +a.dataset.n === n); });
      var pos = n === 0 ? "The start of the road" : n === 54 ? "The end of the road" : "Station " + n;
      panel.innerHTML = '<img src="/assets/' + s.img.replace(".jpg", ".w800.webp") + '" alt="" width="230" height="153">' +
        '<div><div class="eyebrow">' + pos + " · " + s.ri_s + " ri · about " + s.km + ' km from Nihonbashi</div><p class="nm">' + esc(s.name) + "<span lang=\"ja\">" + esc(s.ja) + "</span></p><p>" + esc(s.note) + "</p></div>" +
        '<a class="open" href="/prints/' + s.file + '/">Open the print →</a>';
      var rl = $(".ruler-bands .axis");
      if (rl) {
        $$("i.here, .lab", rl).forEach(function (e) { e.remove(); });
        var ticks = $$("i", rl); if (ticks[n]) ticks[n].classList.add("here");
      }
    }
    links.forEach(function (a) {
      var n = +a.dataset.n;
      a.addEventListener("mouseenter", function () { select(n); });
      a.addEventListener("focus", function () { select(n); });
      // On touch the first tap previews (the panel has an "Open" button), the second tap follows the link.
      a.addEventListener("click", function (e) { if (matchMedia("(pointer: coarse)").matches && cur !== n) { e.preventDefault(); select(n); } });
    });
    select(10);
  }, function () {
    // Without the road data the strip keeps moss's own count (see style.css).
    if (strip) strip.setAttribute("data-road", "off");
  });
})();
