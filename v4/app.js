/* VC Challenge — v3
   Hero: a swarm that writes the name.
   Story: ~100 managers (dots) travel through six moves as you scroll. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LIME = '#d7ff3c', INK = '#0b0d10', ICE = '#eef1f0', RED = '#ff4b2b', GREY = '#4a5058';
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  /* ---------- palettes: accent / dark / light / signal ---------- */
  var PALETTES = {
    lime: { name: 'Lime (original)', lime: '#d7ff3c', ink: '#0b0d10', ice: '#eef1f0', red: '#ff4b2b' },
    punk: { name: 'Red · Snow · Punk yellow', lime: '#ffe14d', ink: '#ff3b1f', ice: '#fbfaf6', red: '#111111' }
  };
  function applyPalette(key) {
    var p = PALETTES[key] || PALETTES.lime, r = document.documentElement.style;
    LIME = p.lime; INK = p.ink; ICE = p.ice; RED = p.red;
    GREY = rgba(p.ice, .28);
    document.documentElement.dataset.pal = key; r.setProperty('--lime', p.lime); r.setProperty('--ink', p.ink); r.setProperty('--ice', p.ice); r.setProperty('--red', p.red);
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = p.ink;
    try { localStorage.setItem('vcc-palette', key); } catch (e) {}
    document.querySelectorAll('.pal button').forEach(function (b) { b.classList.toggle('on', b.dataset.k === key); });
  }
  (function () {
    var bar = document.createElement('div'); bar.className = 'pal'; bar.innerHTML = '<span>Palette</span>';
    Object.keys(PALETTES).forEach(function (k) {
      var p = PALETTES[k], b = document.createElement('button');
      b.type = 'button'; b.dataset.k = k; b.title = p.name; b.setAttribute('aria-label', 'Palette ' + p.name);
      b.innerHTML = '<i style="background:' + p.ink + '"></i><i style="background:' + p.lime + '"></i>';
      b.addEventListener('click', function () { applyPalette(k); });
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
    var q = (location.search.match(/[?&]p=(\w+)/) || [])[1], saved = null;
    try { saved = localStorage.getItem('vcc-palette'); } catch (e) {}
    applyPalette(q || saved || 'lime');
  })();
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function setup(cv) {
    var ctx = cv.getContext('2d'), DPR = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx: ctx, W: W, H: H };
  }

  /* ================= HERO SWARM ================= */
  (function () {
    var cv = document.getElementById('swarm'), S, P = [], T = [], wi = 0, last = 0, m = { x: -9e3, y: -9e3 }, locked = false;
    window.__lockSwarm = function (on) { if (on === locked) return; locked = on; if (on && S) { wi = 0; assign(); } };
    var WORDS = ['VC', 'CHALLENGE', '100', 'GPs', '2020—24'];
    function shape(word) {
      var o = document.createElement('canvas'); o.width = S.W; o.height = S.H;
      var c = o.getContext('2d'), fs = Math.min(S.H * .6, S.W * 1.5 / Math.max(2, word.length * .62));
      c.font = '900 ' + fs + 'px "Schibsted Grotesk", sans-serif';
      var w = c.measureText(word).width; if (w > S.W * .92) { fs *= S.W * .92 / w; c.font = '900 ' + fs + 'px "Schibsted Grotesk", sans-serif'; }
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, S.W / 2, S.H * .42);
      var d = c.getImageData(0, 0, S.W, S.H).data, pts = [], st = Math.max(4, Math.round(Math.sqrt(S.W * S.H / 24000)));
      for (var y = 0; y < S.H; y += st) for (var x = 0; x < S.W; x += st) if (d[(y * S.W + x) * 4 + 3] > 128) pts.push([x, y]);
      for (var i = pts.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
      return pts;
    }
    function assign() { var pts = T[wi]; for (var i = 0; i < P.length; i++) { var p = pts[i % pts.length]; P[i].tx = p[0]; P[i].ty = p[1]; } }
    function build() {
      S = setup(cv); T = WORDS.map(shape);
      var n = Math.min(2400, Math.max(800, Math.round(S.W * S.H / 700)));
      while (P.length < n) P.push({ x: rnd(0, S.W), y: rnd(0, S.H), vx: 0, vy: 0, k: rnd(.035, .07) });
      P.length = n; assign();
    }
    function tick(t) {
      if (!locked && t - last > 2800) { last = t; wi = (wi + 1) % WORDS.length; P.forEach(function (p) { p.vx += rnd(-16, 16); p.vy += rnd(-16, 16); }); assign(); }
      var c = S.ctx; c.fillStyle = INK; c.fillRect(0, 0, S.W, S.H); c.fillStyle = LIME;
      var s = S.W < 700 ? 2.2 : 3;
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.vx += (p.tx - p.x) * p.k; p.vy += (p.ty - p.y) * p.k;
        var dx = p.x - m.x, dy = p.y - m.y, dd = dx * dx + dy * dy;
        if (dd < 20000) { var f = (20000 - dd) / 20000 * 7 / Math.sqrt(dd + 1); p.vx += dx * f; p.vy += dy * f; }
        p.vx *= .78; p.vy *= .78; p.x += p.vx; p.y += p.vy;
        c.fillRect(p.x, p.y, s, s);
      }
      requestAnimationFrame(tick);
    }
    var hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', function () { m.x = m.y = -9e3; });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    function go() { build(); if (reduce) { S.ctx.fillStyle = INK; S.ctx.fillRect(0, 0, S.W, S.H); S.ctx.fillStyle = LIME; T[0].forEach(function (p) { S.ctx.fillRect(p[0], p[1], 2.3, 2.3); }); } else requestAnimationFrame(tick); }
    (document.fonts && document.fonts.load ? Promise.race([document.fonts.load('900 100px "Schibsted Grotesk"'), new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve()).then(go);
  })();

  /* ================= STORY FIELD ================= */
  (function () {
    var story = document.getElementById('story'), cv = document.getElementById('field');
    var steps = document.querySelectorAll('.step'), prog = document.getElementById('prog'), barStep = document.getElementById('barStep');
    var S, A, step = 0, M = [], R = [], edges = [], mentorLinks = [];
    var COUNTRIES = [
      { k: 'Iceland', x: .12, y: .18 }, { k: 'Norway', x: .38, y: .30 }, { k: 'Sweden', x: .58, y: .44 },
      { k: 'Finland', x: .84, y: .24 }, { k: 'Denmark', x: .42, y: .74 }, { k: 'Baltics · Germany · Belgium', x: .84, y: .76 }
    ];
    var COH = [{ n: 25, cols: 5, label: '2022 · Nordic I' }, { n: 44, cols: 7, label: '2023 · Nordic II' }, { n: 30, cols: 6, label: '23/24 · Nordic III' }];

    // people
    var id = 0;
    COH.forEach(function (c, ci) {
      for (var i = 0; i < c.n; i++, id++) {
        var country = ci === 2 && i >= 24 ? 5 : [0, 1, 1, 2, 2, 3, 3, 4, 4, 4][(Math.random() * 10) | 0];
        M.push({ ci: ci, ii: i, country: country, launch: Math.random() < .7, rx: Math.random(), ry: Math.random(), ox: rnd(-1, 1), oy: rnd(-1, 1), x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
      }
    });
    for (var r = 0; r < 24; r++) R.push({ a: r / 24 * Math.PI * 2, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
    for (var e = 0; e < 170; e++) edges.push([(Math.random() * M.length) | 0, (Math.random() * M.length) | 0]);
    R.forEach(function (_, ri) { for (var k = 0; k < 3; k++) mentorLinks.push([ri, (Math.random() * M.length) | 0]); });

    function area() {
      var mobile = S.W < 820;
      return mobile ? { x: S.W * .06, y: S.H * .1, w: S.W * .88, h: S.H * .46 } : { x: S.W * .42, y: S.H * .12, w: S.W * .54, h: S.H * .76 };
    }
    function gridPos(c, i, g, ox, oy) { return [ox + (i % c.cols) * g, oy + Math.floor(i / c.cols) * g]; }
    function roomLayout() {
      var gap = 2.2, colsTotal = COH.reduce(function (s, c) { return s + c.cols; }, 0) + gap * 2;
      var g = Math.min(A.w / colsTotal, A.h / 9), x = A.x + (A.w - colsTotal * g) / 2, out = [];
      COH.forEach(function (c) { var rows = Math.ceil(c.n / c.cols); out.push({ x: x, y: A.y + A.h / 2 - rows * g / 2, g: g, rows: rows, c: c }); x += (c.cols + gap) * g; });
      return out;
    }

    function targets() {
      var blocks = roomLayout(), cx = A.x + A.w / 2, cy = A.y + A.h / 2, mn = Math.min(A.w, A.h);
      M.forEach(function (d) {
        var t;
        if (step === 0) t = [A.x + d.rx * A.w, A.y + d.ry * A.h];
        else if (step === 1 || step === 5) { var C = COUNTRIES[d.country]; t = [A.x + C.x * A.w + d.ox * mn * .09, A.y + C.y * A.h + d.oy * mn * .09]; }
        else if (step === 2 || step === 3) { var b = blocks[d.ci]; t = gridPos(b.c, d.ii, b.g, b.x, b.y); }
        else { // leap: launched rise into a big block, the rest stay small below
          var L = M.filter(function (q) { return q.launch; }), N = M.filter(function (q) { return !q.launch; });
          var g = Math.min(A.w / 14, A.h / 10);
          if (d.launch) { var i = L.indexOf(d); t = [A.x + g / 2 + (i % 12) * g, A.y + g + Math.floor(i / 12) * g]; }
          else { var j = N.indexOf(d); t = [A.x + (j % 12) * g * .6, A.y + A.h * .78 + Math.floor(j / 12) * g * .6]; }
        }
        d.tx = t[0]; d.ty = t[1];
      });
      R.forEach(function (m) {
        var rad = step === 3 ? mn * .62 : mn * 1.4;
        m.tx = cx + Math.cos(m.a) * rad * (A.w / mn) * .55; m.ty = cy + Math.sin(m.a) * rad * .55;
      });
    }

    function label(c, txt, x, y, color, a) { c.globalAlpha = a; c.fillStyle = color; c.font = '500 11px "IBM Plex Mono", monospace'; c.fillText(txt.toUpperCase(), x, y); c.globalAlpha = 1; }

    var shown = 0;
    function draw(now) {
      var c = S.ctx; c.clearRect(0, 0, S.W, S.H);
      shown += (1 - shown) * .05;
      var springK = .06;
      M.forEach(function (d) { d.vx += (d.tx - d.x) * springK; d.vy += (d.ty - d.y) * springK; d.vx *= .8; d.vy *= .8; d.x += d.vx; d.y += d.vy; });
      R.forEach(function (d) { d.vx += (d.tx - d.x) * .05; d.vy += (d.ty - d.y) * .05; d.vx *= .8; d.vy *= .8; d.x += d.vx; d.y += d.vy; });
      var t = now / 1000;

      // lines
      c.lineWidth = .7;
      if (step === 3) { c.strokeStyle = rgba(RED, .35); mentorLinks.forEach(function (l) { var a = R[l[0]], b = M[l[1]]; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }); }
      if (step === 5) { c.strokeStyle = rgba(LIME, .22); edges.forEach(function (l) { var a = M[l[0]], b = M[l[1]]; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }); }

      // managers
      var blocks = roomLayout(), g = blocks[0].g;
      M.forEach(function (d) {
        var col = ICE, s = 5;
        if (step === 0) { col = GREY; s = 4; }
        if (step === 2 || step === 3) s = Math.max(4, g * .42);
        if (step === 4) { col = d.launch ? LIME : GREY; s = d.launch ? Math.max(5, Math.min(A.w / 14, A.h / 10) * .5) : 4; }
        if (step === 5) { col = LIME; s = 5 + Math.sin(t * 2 + d.rx * 6) * 1; }
        c.fillStyle = col; c.fillRect(d.x - s / 2, d.y - s / 2, s, s);
      });
      // mentors
      if (step === 3) R.forEach(function (d) { c.fillStyle = RED; c.beginPath(); c.arc(d.x, d.y, 4.5, 0, 6.283); c.fill(); });

      // labels
      var mn = Math.min(A.w, A.h);
      if (step === 1 || step === 5) COUNTRIES.forEach(function (C) { label(c, C.k, A.x + C.x * A.w - 10, A.y + C.y * A.h - mn * .12, step === 5 ? LIME : rgba(ICE, .6), .9); });
      if (step === 2 || step === 3) blocks.forEach(function (b) { label(c, b.c.label + ' · ' + b.c.n, b.x, b.y + b.rows * b.g + 22, rgba(ICE, .6), .95); });
      if (step === 3) label(c, 'VCs · lawyers · family offices · fund administrators · LPs', A.x, A.y - 4, RED, .95);
      if (step === 4) { var gg = Math.min(A.w / 14, A.h / 10); label(c, '70% · building Fund I', A.x, A.y, LIME, 1); label(c, 'not yet', A.x, A.y + A.h * .78 - 12, rgba(ICE, .45), 1); }

      if (!reduce) requestAnimationFrame(draw);
    }

    function setStep(s) {
      if (s === step) return;
      step = s; targets();
      steps.forEach(function (el, i) { el.classList.toggle('is-on', i === s); });
      barStep.textContent = steps[s].querySelector('.step__k').textContent;
    }
    function onScroll() {
      var r = story.getBoundingClientRect(), total = r.height - window.innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / total));
      prog.style.width = (p * 100) + '%';
      setStep(Math.min(5, Math.floor(p * 6.0001)));
      if (r.top > window.innerHeight || r.bottom < 0) barStep.textContent = 'Nordic · 2020 — 2024';
    }
    function build() {
      S = setup(cv); A = area(); targets();
      M.forEach(function (d) { if (!d.x) { d.x = d.tx; d.y = d.ty; } });
      R.forEach(function (d) { if (!d.x) { d.x = d.tx; d.y = d.ty; } });
    }
    build();
    window.addEventListener('scroll', onScroll, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); onScroll(); }, 200); });
    onScroll();
    if (reduce) { setInterval(function () { draw(performance.now()); }, 300); } else requestAnimationFrame(draw);
  })();

  /* ================= THEY CAME AS ================= */
  (function () {
    var el = document.getElementById('cameWord');
    var words = ['founders.', 'angels.', 'corporates.', 'family offices.', 'public investors.'], i = 0, timer = null;
    function nextWord() { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
    if (reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !timer) timer = setInterval(nextWord, 1500); if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; } });
    }).observe(el);
  })();

  /* ================= FLY-THROUGH ================= */
  (function () {
    var wrap = document.getElementById('heroWrap'), cv = document.getElementById('swarm');
    var enter = document.getElementById('heroEnter'), foot = document.querySelector('.hero__foot');
    function onScroll() {
      var r = wrap.getBoundingClientRect(), total = r.height - window.innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / total));
      if (window.__lockSwarm) window.__lockSwarm(p > 0.02);
      if (!reduce) cv.style.transform = 'scale(' + (1 + Math.pow(p, 2.2) * 38) + ')';
      foot.style.opacity = Math.max(0, 1 - p * 4);
      var e = Math.min(1, Math.max(0, (p - 0.5) / 0.25));
      enter.style.opacity = e;
      enter.style.background = rgba(document.documentElement.dataset.pal === 'punk' ? ICE : LIME, e);
      enter.style.transform = 'scale(' + (1.15 - e * .15) + ')';
      document.body.dataset.heroLime = e > .5 ? '1' : '';
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  })();

  /* ================= DOCK: follows the page ================= */
  (function () {
    var dock = document.getElementById('dock'), zones = [].slice.call(document.querySelectorAll('[data-dock]'));
    function pick() {
      var y = window.innerHeight - 40, theme = 'ink';
      zones.forEach(function (z) { var r = z.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) theme = z.getAttribute('data-dock'); });
      if (document.body.dataset.heroLime) theme = 'lime';
      dock.setAttribute('data-theme', theme);
    }
    window.addEventListener('scroll', pick, { passive: true }); window.addEventListener('resize', pick); pick();
  })();

  /* ================= CURSOR ================= */
  (function () {
    var c = document.getElementById('cursor'); if (!c || reduce) { if (c) c.remove(); return; }
    var x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; c.classList.toggle('big', !!e.target.closest('a, button, input')); }, { passive: true });
    (function loop() { cx += (x - cx) * .25; cy += (y - cy) * .25; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
  })();

  /* ================= SAY HI ================= */
  (function () {
    var CALENDLY = '';                                   // paste the 30-min Calendly link here
    var INBOX = 'hello@vevegas.com';                     // where notes and voice notes arrive (via FormSubmit)
    var dlg = document.getElementById('hi'), done = document.getElementById('hiDone');
    if (CALENDLY) document.getElementById('callLink').href = CALENDLY;

    // live clock in Spain: a real person, a real time zone
    var clock = document.getElementById('hiClock');
    function tick() { try { clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }); } catch (e) {} }
    tick(); setInterval(tick, 30000);

    function open() { reset(); if (dlg.showModal) dlg.showModal(); else location.href = 'mailto:' + INBOX; }
    document.querySelectorAll('[data-hi]').forEach(function (b) { b.addEventListener('click', open); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

    // tabs
    var tabs = dlg.querySelectorAll('[data-tab]'), panes = dlg.querySelectorAll('[data-pane]');
    function show(name) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.tab === name ? 'true' : 'false'); });
      panes.forEach(function (p) { p.classList.toggle('is-on', p.dataset.pane === name); });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.tab); }); });
    function reset() { done.hidden = true; dlg.querySelector('.hi__tabs').hidden = false; show('note'); }
    function thanks() { panes.forEach(function (p) { p.classList.remove('is-on'); }); dlg.querySelector('.hi__tabs').hidden = true; done.hidden = false; }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    // a note: one email field, sent without leaving the page
    var note = document.getElementById('noteForm');
    note.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = note.email.value.trim();
      if (!validEmail(em)) { note.email.focus(); note.email.setCustomValidity('Please add an email so I can reply'); note.email.reportValidity(); note.email.setCustomValidity(''); return; }
      var intent = (note.querySelector('input[name=intent]:checked') || {}).value || '';
      var body = { email: em, intent: intent, message: note.message.value.trim(), _subject: 'VC Challenge site · ' + intent, _template: 'table', _captcha: 'false' };
      var btn = note.querySelector('.hi__send'); btn.disabled = true;
      fetch('https://formsubmit.co/ajax/' + INBOX, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw 0; thanks(); note.reset(); })
        .catch(function () { location.href = 'mailto:' + INBOX + '?subject=' + encodeURIComponent(body._subject) + '&body=' + encodeURIComponent(body.message); })
        .then(function () { btn.disabled = false; });
    });

    // a voice note, recorded right here
    var recBtn = document.getElementById('recBtn'), recTime = document.getElementById('recTime'), play = document.getElementById('recPlay');
    var voice = document.getElementById('voiceForm'), send = document.getElementById('voiceSend');
    var rec = null, chunks = [], blob = null, t0 = 0, timer = null, MAX = 120;
    function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2); }
    function stop() { if (rec && rec.state === 'recording') rec.stop(); clearInterval(timer); recBtn.classList.remove('on'); recBtn.querySelector('span').textContent = 'Record again'; }
    recBtn.addEventListener('click', function () {
      if (rec && rec.state === 'recording') return stop();
      if (!navigator.mediaDevices || !window.MediaRecorder) { location.href = 'mailto:' + INBOX + '?subject=A%20voice%20note'; return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        chunks = []; rec = new MediaRecorder(stream);
        rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        rec.onstop = function () { stream.getTracks().forEach(function (tr) { tr.stop(); }); blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); play.src = URL.createObjectURL(blob); play.hidden = false; send.disabled = false; };
        rec.start(); t0 = Date.now(); recBtn.classList.add('on'); recBtn.querySelector('span').textContent = 'Stop';
        timer = setInterval(function () { var s = (Date.now() - t0) / 1000; recTime.textContent = fmt(s) + ' / 2:00'; if (s >= MAX) stop(); }, 250);
      }).catch(function () { recTime.textContent = 'Microphone blocked'; });
    });
    voice.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = voice.email.value.trim();
      if (!validEmail(em) || !blob) { voice.email.focus(); return; }
      // FormSubmit takes attachments through a normal multipart post: send it through a hidden frame
      var frame = document.createElement('iframe'); frame.name = 'hiFrame'; frame.hidden = true; document.body.appendChild(frame);
      var f = document.createElement('form'); f.action = 'https://formsubmit.co/' + INBOX; f.method = 'POST'; f.enctype = 'multipart/form-data'; f.target = 'hiFrame'; f.hidden = true;
      [['email', em], ['_subject', 'VC Challenge site · voice note'], ['_captcha', 'false'], ['_template', 'table']].forEach(function (kv) { var i = document.createElement('input'); i.name = kv[0]; i.value = kv[1]; f.appendChild(i); });
      var fi = document.createElement('input'); fi.type = 'file'; fi.name = 'attachment';
      var ext = (blob.type.indexOf('mp4') > -1) ? 'm4a' : 'webm';
      var dt = new DataTransfer(); dt.items.add(new File([blob], 'voice-note.' + ext, { type: blob.type })); fi.files = dt.files; f.appendChild(fi);
      document.body.appendChild(f); f.submit(); send.disabled = true; setTimeout(thanks, 900);
    });
  })();

  /* ================= REVEAL + PLATE ================= */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('is-in'); });
  var input = document.getElementById('nameInput'), out = document.getElementById('plateName');
  input.addEventListener('input', function () { out.textContent = input.value.trim() || 'Your name'; });
})();
