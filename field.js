/* VC Challenge — hero field.
   ~100 emerging managers start scattered and find each other:
   five national clusters, then one Nordic network. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- reveal + counters ----------
  var reveals = document.querySelectorAll('.reveal');
  function countUp(el) {
    var target = +el.getAttribute('data-count'), t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        var c = e.target.querySelector('[data-count]');
        if (c && !reduce) countUp(c);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- field ----------
  var cv = document.getElementById('field');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W, H, DPR, dots = [], mouse = { x: -1e4, y: -1e4 }, start = performance.now();
  var INK = '#0d1014', RED = '#e5432f', MUTED = '#7a818a';

  // relative positions, loosely geographic
  var C = [
    { k: 'IS', x: .50, y: .20, n: 12 },
    { k: 'NO', x: .64, y: .33, n: 24 },
    { k: 'SE', x: .75, y: .42, n: 24 },
    { k: 'FI', x: .88, y: .27, n: 18 },
    { k: 'DK', x: .67, y: .60, n: 22 }
  ];

  function layout() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var mobile = W < 700;
    C.forEach(function (c) {
      c.px = (mobile ? (c.x - .5) * 1.7 + .45 : c.x) * W;
      c.py = (mobile ? c.y * .75 + .02 : c.y) * H;
    });
  }

  function seed() {
    dots = [];
    var id = 0;
    C.forEach(function (c, ci) {
      for (var i = 0; i < c.n; i++) {
        var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * Math.min(W, H) * .058;
        dots.push({
          ci: ci,
          x: Math.random() * W, y: Math.random() * H,
          ox: Math.cos(a) * r, oy: Math.sin(a) * r,
          vx: 0, vy: 0,
          ph: Math.random() * 6.28,
          red: (id++ % 11) === 0
        });
      }
    });
  }

  function frame(now) {
    var t = (now - start) / 1000;
    var gather = reduce ? 1 : Math.min(1, t / 3.2);
    var net = reduce ? 1 : Math.max(0, Math.min(1, (t - 3) / 2.5));
    ctx.clearRect(0, 0, W, H);

    // move
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i], c = C[d.ci];
      var tx = c.px + d.ox + Math.sin(t * .6 + d.ph) * 6;
      var ty = c.py + d.oy + Math.cos(t * .5 + d.ph) * 6;
      var k = .012 + gather * .03;
      d.vx += (tx - d.x) * k; d.vy += (ty - d.y) * k;
      var mx = d.x - mouse.x, my = d.y - mouse.y, md = mx * mx + my * my;
      if (md < 14000) { var f = (14000 - md) / 14000 * 2.4; d.vx += mx / Math.sqrt(md + 1) * f; d.vy += my / Math.sqrt(md + 1) * f; }
      d.vx *= .86; d.vy *= .86;
      d.x += d.vx; d.y += d.vy;
    }

    // links inside clusters
    ctx.lineWidth = .6;
    for (i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var a = dots[i], b = dots[j];
        var dx = a.x - b.x, dy = a.y - b.y, dd = dx * dx + dy * dy;
        var same = a.ci === b.ci;
        var lim = same ? 2200 : 0;
        if (dd < lim) {
          ctx.strokeStyle = 'rgba(13,16,20,' + (0.22 * gather * (1 - dd / lim)) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    // the Nordic network: every cluster to every other
    if (net > 0) {
      ctx.lineWidth = 1;
      for (i = 0; i < C.length; i++) for (j = i + 1; j < C.length; j++) {
        var A = C[i], B = C[j];
        ctx.strokeStyle = 'rgba(229,67,47,' + (0.55 * net) + ')';
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(A.px, A.py);
        ctx.lineTo(A.px + (B.px - A.px) * net, A.py + (B.py - A.py) * net);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // dots
    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      ctx.fillStyle = d.red ? RED : INK;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.red ? 3.2 : 2.3, 0, 6.283); ctx.fill();
    }

    // labels
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = MUTED;
    ctx.globalAlpha = gather;
    C.forEach(function (c) { ctx.fillText(c.k, c.px + Math.min(W, H) * .1, c.py - Math.min(W, H) * .07); });
    ctx.globalAlpha = 1;

    if (!reduce) requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });
  window.addEventListener('pointerleave', function () { mouse.x = mouse.y = -1e4; });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); }, 150); });

  layout(); seed();
  if (reduce) { gatherNow(); } else requestAnimationFrame(frame);
  function gatherNow() { dots.forEach(function (d) { var c = C[d.ci]; d.x = c.px + d.ox; d.y = c.py + d.oy; }); frame(start + 10000); }
})();
