// Draws the road ruler and drives the map panel. Data: /assets/road.json (written by tools/tokaido/generate.py).
// Without script the pages still read: the ruler keeps its sentence, the map keeps one link per station.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ri = function (r) { r = Math.round(r * 10) / 10; return String(r); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var rulers = $$(".ruler"), map = $(".road-map:not(.road-map-compact)");
  if (!rulers.length && !map) return;

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
        h += '<span class="lab ' + al + '" style="left:' + l.toFixed(3) + '%"><b>' + esc(cur.name) + "</b> · " + ri(cur.ri) + " ri</span>";
      }
      h += '<div class="ends"><span>0 · Nihonbashi</span><span>' + ri(LAST) + " ri · Kyoto</span></div></div>";
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
        '<div><div class="eyebrow">' + pos + " · " + ri(s.ri) + " ri · about " + s.km + ' km from Nihonbashi</div><p class="nm">' + esc(s.name) + "<span lang=\"ja\">" + esc(s.ja) + "</span></p><p>" + esc(s.note) + "</p></div>" +
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
  });
})();
