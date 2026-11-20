/* VC Challenge — version B
   A swarm of particles keeps reorganising into one idea after another.
   Scatter it with the cursor; it always finds its shape again. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- swarm ----------
  var cv = document.getElementById('swarm');
  var ctx = cv.getContext('2d');
  var WORDS = ['VC', 'CHALLENGE', '100', 'GPs', 'FUND I', 'NORDIC', '2020—24'];
  var W, H, DPR, P = [], targets = [], wi = 0, mouse = { x: -9999, y: -9999 }, last = 0;

  function size() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function shape(word) {
    var off = document.createElement('canvas');
    off.width = W; off.height = H;
    var o = off.getContext('2d');
    var fs = Math.min(H * 0.62, W * 1.55 / Math.max(2, word.length * 0.62));
    o.font = '900 ' + fs + 'px "Schibsted Grotesk", sans-serif';
    o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillStyle = '#000';
    // fit width
    var w = o.measureText(word).width;
    if (w > W * 0.9) { fs = fs * (W * 0.9) / w; o.font = '900 ' + fs + 'px "Schibsted Grotesk", sans-serif'; }
    o.fillText(word, W / 2, H * 0.44);
    var d = o.getImageData(0, 0, W, H).data, pts = [];
    var step = Math.max(4, Math.round(Math.sqrt((W * H) / 26000)));
    for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
      if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    }
    for (var i = pts.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
    return pts;
  }

  function assign(pts) {
    for (var i = 0; i < P.length; i++) {
      var p = pts[i % pts.length];
      P[i].tx = p[0] + (i >= pts.length ? (Math.random() - .5) * 4 : 0);
      P[i].ty = p[1] + (i >= pts.length ? (Math.random() - .5) * 4 : 0);
    }
  }

  function build() {
    size();
    targets = WORDS.map(shape);
    var n = Math.min(2200, Math.max(700, Math.round((W * H) / 900)));
    if (!P.length) {
      for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: 0, ty: 0, k: .04 + Math.random() * .05 });
    } else if (P.length < n) {
      while (P.length < n) P.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: 0, ty: 0, k: .04 + Math.random() * .05 });
    } else P.length = n;
    assign(targets[wi]);
  }

  function next() {
    wi = (wi + 1) % WORDS.length;
    // a burst before re-forming
    for (var i = 0; i < P.length; i++) { P[i].vx += (Math.random() - .5) * 14; P[i].vy += (Math.random() - .5) * 14; }
    assign(targets[wi]);
  }

  function tick(t) {
    if (t - last > 2600) { last = t; next(); }
    ctx.fillStyle = '#d7ff3c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0b0d10';
    var s = W < 700 ? 2 : 2.6;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      p.vx += (p.tx - p.x) * p.k * .35; p.vy += (p.ty - p.y) * p.k * .35;
      var dx = p.x - mouse.x, dy = p.y - mouse.y, dd = dx * dx + dy * dy;
      if (dd < 16000) { var f = (16000 - dd) / 16000 * 6 / Math.sqrt(dd + 1); p.vx += dx * f; p.vy += dy * f; }
      p.vx *= .82; p.vy *= .82;
      p.x += p.vx; p.y += p.vy;
      ctx.fillRect(p.x, p.y, s, s);
    }
    requestAnimationFrame(tick);
  }

  var hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
  hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });

  var go = function () {
    build();
    if (reduce) {
      ctx.fillStyle = '#d7ff3c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#0b0d10';
      targets[0].forEach(function (p) { ctx.fillRect(p[0], p[1], 2.6, 2.6); });
    } else requestAnimationFrame(tick);
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('900 100px "Schibsted Grotesk"'), new Promise(function (r) { setTimeout(r, 1500); })]).then(go);
  } else go();

  // ---------- runner moves with scroll ----------
  var runner = document.getElementById('runner');
  function onScroll() {
    if (reduce) return;
    var r = runner.parentElement.getBoundingClientRect();
    var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
    runner.style.transform = 'translateX(' + (-p * 35) + '%)';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- reveal + counters ----------
  function countUp(el) {
    var target = +el.getAttribute('data-count'), t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1300); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        var c = e.target.querySelector('[data-count]'); if (c && !reduce) countUp(c);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('is-in'); });

  // ---------- the plate ----------
  var input = document.getElementById('nameInput'), out = document.getElementById('plateName');
  input.addEventListener('input', function () { out.textContent = input.value.trim() || 'Your name'; });
})();
